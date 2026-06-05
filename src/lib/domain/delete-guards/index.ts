import {
  defineDomainModuleBoundary,
  PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
} from '../shared'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import type { PrismaTransactionClient } from '@/lib/transaction-manager'

/**
 * 删除门禁服务只表达“能否删、为什么不能删”的业务规则。
 * 具体的房间、合同、账单、仪表删除入口后续复用这层能力，不在 phase09-01 直接迁业务逻辑。
 */
export const deleteGuardsDomainBoundary = defineDomainModuleBoundary({
  name: 'delete-guards',
  description: '承接合同、房间、账单、仪表等高风险删除门禁语义。',
  compatBoundary: {
    strategy: 'read-only-reference',
    reason:
      'phase09-01 先冻结删除门禁共享边界，旧删除入口仍需作为高风险路径对照基线，避免提前放宽业务门禁。',
    exitCondition:
      '当房间、合同、账单、仪表删除门禁均已迁入共享领域服务，并完成至少一条主链验证后，旧删除实现退化为只读参考或移除。',
  },
  transactionBoundary: {
    ...PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
    note:
      '删除前校验与终止/解绑编排统一下沉到共享领域服务，避免页面、路由和数据库各自维护一套规则。',
  },
})

const PRISMA_TRANSACTION_MAX_RETRIES = 3
const PRISMA_TRANSACTION_MAX_WAIT_MS = 5_000
const PRISMA_TRANSACTION_TIMEOUT_MS = 10_000
const PRISMA_TRANSACTION_RETRY_BASE_DELAY_MS = 100

export interface RoomDeleteSafetyCheck {
  canDelete: boolean
  roomStatus: string
  contractCount: number
  hasActiveContracts: boolean
  activeContractCount: number
  pendingContractCount: number
  billCount: number
  hasUnpaidBills: boolean
  unpaidBillCount: number
  settledBillCount: number
  meterCount: number
  activeMeterCount: number
  inactiveMeterCount: number
  meterReadingCount: number
  billDetailCount: number
  hasRelatedData: boolean
  relatedDataTypes: string[]
  errorCode: string | null
  blockingReasons: string[]
  suggestion: string | null
}

export interface ContractDeleteSafetyCheck {
  canDelete: boolean
  contractStatus: string
  billCount: number
  hasPaidBills: boolean
  paidBillCount: number
  hasUnpaidBills: boolean
  unpaidBillCount: number
  hasMeterReadings: boolean
  meterReadingCount: number
  billedMeterReadingCount: number
  billDetailCount: number
  errorCode: string | null
  blockingReasons: string[]
  suggestion: string | null
}

export interface DeletedContractResult {
  success: true
  message: string
  deletedEntities: {
    contract: string
  }
  contractId: string
  roomId: string
  renterId: string
}

export interface DeletedRoomResult {
  success: true
  action: 'hard_delete'
  message: string
  deletedRoomId: string
  buildingId: string
}

export class DeleteGuardBlockedError extends Error {
  constructor(
    message: string,
    public readonly details: RoomDeleteSafetyCheck | ContractDeleteSafetyCheck
  ) {
    super(message)
    this.name = 'DeleteGuardBlockedError'
  }
}

export function isDeleteGuardBlockedError(
  error: unknown
): error is DeleteGuardBlockedError {
  return error instanceof DeleteGuardBlockedError
}

export class RoomDeleteGuardBlockedError extends DeleteGuardBlockedError {
  declare readonly details: RoomDeleteSafetyCheck

  constructor(message: string, details: RoomDeleteSafetyCheck) {
    super(message, details)
    this.name = 'RoomDeleteGuardBlockedError'
  }
}

export function isRoomDeleteGuardBlockedError(
  error: unknown
): error is RoomDeleteGuardBlockedError {
  return error instanceof RoomDeleteGuardBlockedError
}

export class ContractDeleteGuardBlockedError extends DeleteGuardBlockedError {
  declare readonly details: ContractDeleteSafetyCheck

  constructor(message: string, details: ContractDeleteSafetyCheck) {
    super(message, details)
    this.name = 'ContractDeleteGuardBlockedError'
  }
}

export function isContractDeleteGuardBlockedError(
  error: unknown
): error is ContractDeleteGuardBlockedError {
  return error instanceof ContractDeleteGuardBlockedError
}

function isPrismaWriteConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE.retryCode
  )
}

async function waitForRetry(attempt: number) {
  const delayMs = PRISMA_TRANSACTION_RETRY_BASE_DELAY_MS * attempt
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })
}

async function runWithSerializableTransaction<T>(
  operation: Parameters<typeof prisma.$transaction>[0]
) {
  for (let attempt = 1; attempt <= PRISMA_TRANSACTION_MAX_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: PRISMA_TRANSACTION_MAX_WAIT_MS,
        timeout: PRISMA_TRANSACTION_TIMEOUT_MS,
      }) as T
    } catch (error) {
      if (
        !isPrismaWriteConflict(error) ||
        attempt >= PRISMA_TRANSACTION_MAX_RETRIES
      ) {
        throw error
      }

      await waitForRetry(attempt)
    }
  }

  throw new Error('删除门禁事务执行失败')
}

async function getRoomDeleteGuardSnapshot(
  db: typeof prisma | PrismaTransactionClient,
  roomId: string
) {
  return db.room.findUnique({
    where: { id: roomId },
    include: {
      contracts: {
        select: {
          id: true,
          status: true,
          bills: {
            select: {
              id: true,
              status: true,
              amount: true,
              pendingAmount: true,
              receivedAmount: true,
            },
          },
        },
      },
      meters: {
        select: {
          id: true,
          isActive: true,
          readings: {
            select: {
              id: true,
              billDetails: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

function buildRoomDeleteSafetyCheck(
  room: NonNullable<Awaited<ReturnType<typeof getRoomDeleteGuardSnapshot>>>
): RoomDeleteSafetyCheck {
  const contracts = room.contracts || []
  const meters = room.meters || []
  const bills = contracts.flatMap((contract) => contract.bills || [])
  const meterReadings = meters.flatMap((meter) => meter.readings || [])
  const billDetails = meterReadings.flatMap((reading) => reading.billDetails || [])
  const activeContracts = contracts.filter((contract) => contract.status === 'ACTIVE')
  const pendingContracts = contracts.filter(
    (contract) => contract.status === 'PENDING'
  )
  const settledBills = bills.filter(
    (bill) =>
      bill.status === 'PAID' ||
      bill.status === 'COMPLETED' ||
      Number(bill.receivedAmount) > 0 ||
      Number(bill.pendingAmount) < Number(bill.amount)
  )
  const unpaidBills = bills.filter(
    (bill) =>
      bill.status === 'PENDING' ||
      bill.status === 'OVERDUE' ||
      Number(bill.pendingAmount) > 0
  )
  const activeMeters = meters.filter((meter) => meter.isActive)
  const inactiveMeters = meters.filter((meter) => !meter.isActive)

  const blockingReasons: string[] = []
  const relatedDataTypes: string[] = []

  if (room.status === 'OCCUPIED' || room.status === 'OVERDUE') {
    blockingReasons.push('ROOM_STATUS_NOT_RELEASABLE')
  }

  if (activeContracts.length > 0) {
    blockingReasons.push('ROOM_HAS_ACTIVE_CONTRACTS')
  }

  if (pendingContracts.length > 0) {
    blockingReasons.push('ROOM_HAS_PENDING_CONTRACTS')
  }

  if (contracts.length > 0) {
    blockingReasons.push('ROOM_HAS_CONTRACT_HISTORY')
    relatedDataTypes.push('contracts')
  }

  if (bills.length > 0) {
    blockingReasons.push('ROOM_HAS_BILL_HISTORY')
    relatedDataTypes.push('bills')
  }

  if (billDetails.length > 0) {
    blockingReasons.push('ROOM_HAS_BILL_DETAIL_HISTORY')
    relatedDataTypes.push('billDetails')
  }

  if (activeMeters.length > 0) {
    blockingReasons.push('ROOM_HAS_ACTIVE_METERS')
  }

  if (meters.length > 0) {
    blockingReasons.push('ROOM_HAS_METER_BINDINGS')
    relatedDataTypes.push('meters')
  }

  if (meterReadings.length > 0) {
    blockingReasons.push('ROOM_HAS_METER_READING_HISTORY')
    relatedDataTypes.push('meterReadings')
  }

  const errorCode = blockingReasons[0] || null
  const suggestion =
    errorCode === 'ROOM_STATUS_NOT_RELEASABLE'
      ? '请先通过退租、结清欠费或恢复空置流程释放房间，再评估是否归档该房间'
      : errorCode === 'ROOM_HAS_ACTIVE_CONTRACTS'
        ? '请先终止或完成当前合同，不要通过删除房间清空在租事实'
        : errorCode === 'ROOM_HAS_PENDING_CONTRACTS'
          ? '请先取消或归档待生效合同，再决定是否保留房间主数据'
          : errorCode === 'ROOM_HAS_CONTRACT_HISTORY'
            ? '房间下已有合同历史事实，请保留房间主数据，并通过归档流程表达停用而不是删除'
            : errorCode === 'ROOM_HAS_BILL_HISTORY' ||
                errorCode === 'ROOM_HAS_BILL_DETAIL_HISTORY'
              ? '账单、账单明细和收支事实必须保留；如房间停用，请改走归档而不是删除'
              : errorCode === 'ROOM_HAS_ACTIVE_METERS' ||
                  errorCode === 'ROOM_HAS_METER_BINDINGS'
                ? '请先通过仪表停用或专用解绑流程处理仪表资产，再保留房间历史'
                : errorCode === 'ROOM_HAS_METER_READING_HISTORY'
                  ? '房间下已有抄表历史，必须保留读数事实；请改走归档或停用流程'
                  : null

  return {
    canDelete: blockingReasons.length === 0,
    roomStatus: room.status,
    contractCount: contracts.length,
    hasActiveContracts: activeContracts.length > 0,
    activeContractCount: activeContracts.length,
    pendingContractCount: pendingContracts.length,
    billCount: bills.length,
    hasUnpaidBills: unpaidBills.length > 0,
    unpaidBillCount: unpaidBills.length,
    settledBillCount: settledBills.length,
    meterCount: meters.length,
    activeMeterCount: activeMeters.length,
    inactiveMeterCount: inactiveMeters.length,
    meterReadingCount: meterReadings.length,
    billDetailCount: billDetails.length,
    hasRelatedData: relatedDataTypes.length > 0,
    relatedDataTypes,
    errorCode,
    blockingReasons,
    suggestion,
  }
}

export async function performRoomDeleteSafetyCheck(
  roomId: string
): Promise<RoomDeleteSafetyCheck> {
  const room = await getRoomDeleteGuardSnapshot(prisma, roomId)

  if (!room) {
    throw new Error('Room not found')
  }

  return buildRoomDeleteSafetyCheck(room)
}

async function getContractDeleteGuardSnapshot(
  db: typeof prisma | PrismaTransactionClient,
  contractId: string
) {
  return db.contract.findUnique({
    where: { id: contractId },
    include: {
      bills: {
        select: {
          id: true,
          status: true,
          amount: true,
          pendingAmount: true,
          receivedAmount: true,
        },
      },
      meterReadings: {
        select: {
          id: true,
          status: true,
          isBilled: true,
          bills: {
            select: {
              id: true,
            },
          },
          billDetails: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })
}

function buildContractDeleteSafetyCheck(
  contract: NonNullable<Awaited<ReturnType<typeof getContractDeleteGuardSnapshot>>>
): ContractDeleteSafetyCheck {
  const paidBills =
    contract.bills?.filter(
      (bill) =>
        bill.status === 'PAID' ||
        bill.status === 'COMPLETED' ||
        Number(bill.receivedAmount) > 0 ||
        Number(bill.pendingAmount) < Number(bill.amount)
    ) || []
  const unpaidBills =
    contract.bills?.filter(
      (bill) =>
        bill.status === 'PENDING' ||
        bill.status === 'OVERDUE' ||
        Number(bill.pendingAmount) > 0
    ) || []
  const billCount = contract.bills?.length || 0
  const meterReadingCount = contract.meterReadings?.length || 0
  const billDetails =
    contract.meterReadings?.flatMap((reading) => reading.billDetails || []) || []
  const billedMeterReadings =
    contract.meterReadings?.filter(
      (reading) =>
        reading.isBilled ||
        reading.bills.length > 0 ||
        reading.billDetails.length > 0
    ) || []

  const blockingReasons: string[] = []

  if (contract.status !== 'PENDING') {
    blockingReasons.push(`CONTRACT_STATUS_${contract.status}`)
  }

  if (paidBills.length > 0) {
    blockingReasons.push('CONTRACT_HAS_PAID_BILL_HISTORY')
  }

  if (unpaidBills.length > 0) {
    blockingReasons.push('CONTRACT_HAS_UNPAID_BILL_HISTORY')
  }

  if (billDetails.length > 0 || billedMeterReadings.length > 0) {
    blockingReasons.push('CONTRACT_HAS_BILLED_READING_HISTORY')
  }

  if (meterReadingCount > 0) {
    blockingReasons.push('CONTRACT_HAS_METER_READING_HISTORY')
  }

  const errorCode = blockingReasons[0] || null
  const suggestion =
    errorCode === 'CONTRACT_STATUS_ACTIVE'
      ? '请使用退租或终止流程处理生效中的合同，不要直接删除合同锚点'
      : errorCode === 'CONTRACT_STATUS_EXPIRED'
        ? '已到期合同属于历史事实，请保留记录并通过续租或归档流程处理'
        : errorCode === 'CONTRACT_STATUS_TERMINATED'
          ? '已终止合同应作为历史保留，不应再次物理删除'
          : errorCode === 'CONTRACT_HAS_PAID_BILL_HISTORY' ||
              errorCode === 'CONTRACT_HAS_UNPAID_BILL_HISTORY'
            ? '请保留合同下的账单事实；如需结束关系，请走终止、退租或账务处理流程'
            : errorCode === 'CONTRACT_HAS_BILLED_READING_HISTORY' ||
                errorCode === 'CONTRACT_HAS_METER_READING_HISTORY'
              ? '合同下已有抄表或计费历史，请保留事实链并改走终止/归档流程'
              : null

  return {
    canDelete: blockingReasons.length === 0,
    contractStatus: contract.status,
    billCount,
    hasPaidBills: paidBills.length > 0,
    paidBillCount: paidBills.length,
    hasUnpaidBills: unpaidBills.length > 0,
    unpaidBillCount: unpaidBills.length,
    hasMeterReadings: meterReadingCount > 0,
    meterReadingCount,
    billedMeterReadingCount: billedMeterReadings.length,
    billDetailCount: billDetails.length,
    errorCode,
    blockingReasons,
    suggestion,
  }
}

export async function performContractDeleteSafetyCheck(
  contractId: string
): Promise<ContractDeleteSafetyCheck> {
  const contract = await getContractDeleteGuardSnapshot(prisma, contractId)

  if (!contract) {
    throw new Error('Contract not found')
  }

  return buildContractDeleteSafetyCheck(contract)
}

export async function deletePendingContractWithoutHistory(
  contractId: string
): Promise<DeletedContractResult> {
  return runWithSerializableTransaction(async (tx) => {
    const existingContract = await getContractDeleteGuardSnapshot(tx, contractId)

    if (!existingContract) {
      throw new Error('Contract not found')
    }

    const safetyCheck = buildContractDeleteSafetyCheck(existingContract)

    if (!safetyCheck.canDelete) {
      throw new ContractDeleteGuardBlockedError('无法删除合同', safetyCheck)
    }

    await tx.contract.delete({
      where: { id: contractId },
    })

    return {
      success: true,
      message: '合同删除成功，仅删除了未产生历史事实的待生效合同',
      deletedEntities: {
        contract: contractId,
      },
      contractId,
      roomId: existingContract.roomId,
      renterId: existingContract.renterId,
    }
  })
}

export async function deleteRoomWithoutRelatedHistory(
  roomId: string
): Promise<DeletedRoomResult> {
  return runWithSerializableTransaction(async (tx) => {
    const room = await getRoomDeleteGuardSnapshot(tx, roomId)

    if (!room) {
      throw new Error('Room not found')
    }

    const safetyCheck = buildRoomDeleteSafetyCheck(room)

    if (!safetyCheck.canDelete) {
      throw new RoomDeleteGuardBlockedError(
        'Cannot delete room with related business history',
        safetyCheck
      )
    }

    await tx.room.delete({ where: { id: roomId } })

    await tx.building.update({
      where: { id: room.buildingId },
      data: { totalRooms: { decrement: 1 } },
    })

    return {
      success: true,
      action: 'hard_delete',
      message: '房间无合同、账单、仪表或抄表历史，已执行物理删除',
      deletedRoomId: roomId,
      buildingId: room.buildingId,
    }
  })
}
