import './load-env'

import { prisma } from '../src/lib/prisma'
import {
  deriveRoomOccupancySnapshot,
  isRoomOccupancySnapshotStale,
} from '../src/lib/room-occupancy'

interface CliOptions {
  apply: boolean
  json: boolean
  help: boolean
  roomNumbers: string[]
}

interface RoomMismatchResult {
  roomId: string
  roomNumber: string
  buildingName: string
  currentStatus: string
  currentRenter: string | null
  currentOverdueDays: number | null
  derivedStatus: string
  derivedRenter: string | null
  derivedOverdueDays: number | null
  activeContracts: Array<{
    contractNumber: string
    renterName: string | null
    startDate: string
    endDate: string
  }>
}

interface RepairSummary {
  auditedRooms: number
  mismatchedRooms: number
  repairedRooms: number
  results: RoomMismatchResult[]
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    apply: false,
    json: false,
    help: false,
    roomNumbers: [],
  }

  for (const arg of argv) {
    if (arg === '--apply') {
      options.apply = true
      continue
    }

    if (arg === '--json') {
      options.json = true
      continue
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }

    if (arg.startsWith('--room-number=')) {
      const rawValue = arg.slice('--room-number='.length)
      options.roomNumbers.push(
        ...rawValue
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    }
  }

  return options
}

function printHelp() {
  console.log(`
fix_017 房态快照修复工具

用法:
  npm run fix:017:room-occupancy-repair
  npm run fix:017:room-occupancy-repair -- --room-number=A101
  npm run fix:017:room-occupancy-repair -- --apply
  npm run fix:017:room-occupancy-repair -- --json

参数:
  --apply                对命中的房间执行修复写入
  --room-number=<list>   仅处理指定房号，支持逗号分隔
  --json                 以 JSON 输出结果
  --help, -h             查看帮助

默认行为:
  仅做 dry-run 审计，不改写任何房间数据。
  会根据房间下 ACTIVE 合同推导应展示/应持久化的房态、租客与逾期天数快照。
`)
}

async function collectMismatches(
  options: CliOptions
): Promise<RepairSummary> {
  const rooms = await prisma.room.findMany({
    where:
      options.roomNumbers.length > 0
        ? {
            roomNumber: {
              in: options.roomNumbers,
            },
          }
        : undefined,
    include: {
      building: {
        select: {
          name: true,
        },
      },
      contracts: {
        where: {
          status: 'ACTIVE',
        },
        select: {
          id: true,
          contractNumber: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          renter: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      },
    },
    orderBy: [{ building: { name: 'asc' } }, { roomNumber: 'asc' }],
  })

  const mismatches = rooms
    .filter((room) => isRoomOccupancySnapshotStale(room))
    .map<RoomMismatchResult>((room) => {
      const derived = deriveRoomOccupancySnapshot(room)
      return {
        roomId: room.id,
        roomNumber: room.roomNumber,
        buildingName: room.building.name,
        currentStatus: room.status,
        currentRenter: room.currentRenter,
        currentOverdueDays: room.overdueDays,
        derivedStatus: derived.status,
        derivedRenter: derived.currentRenter,
        derivedOverdueDays: derived.overdueDays,
        activeContracts: room.contracts.map((contract) => ({
          contractNumber: contract.contractNumber,
          renterName: contract.renter?.name ?? null,
          startDate: contract.startDate.toISOString().split('T')[0],
          endDate: contract.endDate.toISOString().split('T')[0],
        })),
      }
    })

  return {
    auditedRooms: rooms.length,
    mismatchedRooms: mismatches.length,
    repairedRooms: 0,
    results: mismatches,
  }
}

async function applyRepairs(summary: RepairSummary): Promise<RepairSummary> {
  let repairedRooms = 0

  for (const result of summary.results) {
    await prisma.room.update({
      where: {
        id: result.roomId,
      },
      data: {
        status: result.derivedStatus as any,
        currentRenter: result.derivedRenter,
        overdueDays: result.derivedOverdueDays,
        updatedAt: new Date(),
      },
    })
    repairedRooms += 1
  }

  return {
    ...summary,
    repairedRooms,
  }
}

function printSummary(summary: RepairSummary) {
  console.log('fix_017 房态快照审计结果')
  console.log(`- 已审计房间: ${summary.auditedRooms}`)
  console.log(`- 命中不一致房间: ${summary.mismatchedRooms}`)
  console.log(`- 实际修复房间: ${summary.repairedRooms}`)

  if (summary.results.length === 0) {
    return
  }

  console.log('')
  for (const result of summary.results) {
    const activeContracts = result.activeContracts
      .map(
        (contract) =>
          `${contract.contractNumber}(${contract.renterName ?? '未知租客'}, ${contract.startDate} -> ${contract.endDate})`
      )
      .join(', ')

    console.log(
      `[${result.buildingName}-${result.roomNumber}] ${result.currentStatus}/${result.currentRenter ?? 'null'} -> ${result.derivedStatus}/${result.derivedRenter ?? 'null'}`
    )
    console.log(
      `  overdueDays: ${result.currentOverdueDays ?? 'null'} -> ${result.derivedOverdueDays ?? 'null'}`
    )
    console.log(`  activeContracts: ${activeContracts || '无'}`)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    printHelp()
    return
  }

  const auditSummary = await collectMismatches(options)
  const finalSummary = options.apply ? await applyRepairs(auditSummary) : auditSummary

  if (options.json) {
    console.log(JSON.stringify(finalSummary, null, 2))
    return
  }

  printSummary(finalSummary)
}

main()
  .catch((error) => {
    console.error('fix_017 房态修复工具执行失败:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
