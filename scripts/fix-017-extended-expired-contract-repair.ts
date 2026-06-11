import './load-env'

import { prisma } from '../src/lib/prisma'
import type {
  ExtendedExpiredContractAuditResult,
  ExtendedExpiredContractAuditSummary,
} from '../src/lib/fix-017-extended-expired-contract-audit'

interface CliOptions {
  apply: boolean
  json: boolean
  help: boolean
  contractNumbers: string[]
}

interface RepairSummary {
  auditedContracts: number
  repairEligibleContracts: number
  repairedContracts: number
  skippedContracts: Array<{
    contractNumber: string
    reason: string
  }>
  repairedResults: Array<{
    contractNumber: string
    successorContractNumbers: string[]
  }>
}

const RENEWAL_REMARK_MARKERS = ['[续租记录', '续租至合同', '续租记录', '续租自合同']

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    apply: false,
    json: false,
    help: false,
    contractNumbers: [],
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

    if (arg.startsWith('--contract-number=')) {
      const rawValue = arg.slice('--contract-number='.length)
      const contractNumbers = rawValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      options.contractNumbers.push(...contractNumbers)
    }
  }

  return options
}

function printHelp(): void {
  console.log(`
fix_017 历史续租旧合同安全修复工具

用法:
  npm run fix:017:extended-expired-contract-repair
  npm run fix:017:extended-expired-contract-repair -- --contract-number=HT-2026-001
  npm run fix:017:extended-expired-contract-repair -- --apply
  npm run fix:017:extended-expired-contract-repair -- --json

参数:
  --apply                   对满足安全边界的合同执行历史修复
  --contract-number=<list>  只处理指定合同编号，支持逗号分隔
  --json                    以 JSON 输出结果
  --help, -h                查看帮助

默认行为:
  仅做 dry-run 审计，不改写任何历史合同。
  只有同时满足“具备续租备注证据 + 存在承接合同”的 EXPIRED + isExtended 旧合同才会进入自动修复。
`)
}

function hasRenewalRemarkEvidence(remarks: string | null): boolean {
  if (!remarks) {
    return false
  }

  return RENEWAL_REMARK_MARKERS.some((marker) => remarks.includes(marker))
}

function isRepairEligible(result: ExtendedExpiredContractAuditResult): boolean {
  return result.hasRenewalRemarkEvidence && result.successorContracts.length > 0
}

function printAuditSummary(summary: ExtendedExpiredContractAuditSummary): void {
  const eligibleResults = summary.results.filter(isRepairEligible)
  const auditOnlyResults = summary.results.filter((result) => !isRepairEligible(result))

  console.log('fix_017 历史续租旧合同安全修复审计结果')
  console.log(`- 已审计合同: ${summary.totalMatchedContracts}`)
  console.log(`- 满足自动修复边界: ${eligibleResults.length}`)
  console.log(`- 仅审计清单: ${auditOnlyResults.length}`)

  if (summary.results.length === 0) {
    return
  }

  console.log('')
  for (const result of summary.results) {
    console.log(
      `[${isRepairEligible(result) ? 'AUTO_FIXABLE' : 'AUDIT_ONLY'}] ${result.contractNumber}`
    )
    console.log(
      `  状态=${result.status} | isExtended=${result.isExtended ? 'true' : 'false'} | 承接合同=${result.successorContracts.length}`
    )
    console.log(
      `  续租备注证据=${result.hasRenewalRemarkEvidence ? '命中' : '未命中'} | 房间=${result.roomInfo} | 租客=${result.renterName}`
    )
  }
}

async function applySafeRepairs(
  summary: ExtendedExpiredContractAuditSummary
): Promise<RepairSummary> {
  const eligibleResults = summary.results.filter(isRepairEligible)
  const repairedResults: RepairSummary['repairedResults'] = []
  const skippedContracts: RepairSummary['skippedContracts'] = []
  let repairedContracts = 0

  for (const result of eligibleResults) {
    try {
      await prisma.$transaction(async (tx) => {
        // 在同一事务内重做关键判定，避免 dry-run 到写入之间状态漂移。
        const contract = await tx.contract.findUnique({
          where: {
            id: result.contractId,
          },
          select: {
            id: true,
            contractNumber: true,
            status: true,
            isExtended: true,
            remarks: true,
            roomId: true,
            renterId: true,
            endDate: true,
          },
        })

        if (!contract) {
          throw new Error('合同不存在')
        }

        if (contract.status !== 'EXPIRED' || !contract.isExtended) {
          throw new Error('合同已不再处于 EXPIRED + isExtended 安全修复边界')
        }

        if (!hasRenewalRemarkEvidence(contract.remarks)) {
          throw new Error('合同缺少续租备注证据')
        }

        const successorContracts = await tx.contract.findMany({
          where: {
            id: {
              not: contract.id,
            },
            roomId: contract.roomId,
            renterId: contract.renterId,
            startDate: {
              gte: contract.endDate,
            },
          },
          orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
          take: 3,
          select: {
            contractNumber: true,
          },
        })

        if (successorContracts.length === 0) {
          throw new Error('合同缺少承接合同证据')
        }

        await tx.contract.update({
          where: {
            id: contract.id,
          },
          data: {
            status: 'TERMINATED',
            updatedAt: new Date(),
          },
        })

        repairedContracts += 1
        repairedResults.push({
          contractNumber: contract.contractNumber,
          successorContractNumbers: successorContracts.map(
            (successor) => successor.contractNumber
          ),
        })
      })
    } catch (error) {
      skippedContracts.push({
        contractNumber: result.contractNumber,
        reason: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  return {
    auditedContracts: summary.totalMatchedContracts,
    repairEligibleContracts: eligibleResults.length,
    repairedContracts,
    skippedContracts,
    repairedResults,
  }
}

function printRepairSummary(summary: RepairSummary): void {
  console.log('fix_017 历史续租旧合同安全修复结果')
  console.log(`- 已审计合同: ${summary.auditedContracts}`)
  console.log(`- 满足自动修复边界: ${summary.repairEligibleContracts}`)
  console.log(`- 实际修复合同: ${summary.repairedContracts}`)

  if (summary.repairedResults.length > 0) {
    console.log('- 已修复合同:')
    for (const repaired of summary.repairedResults) {
      console.log(
        `  ${repaired.contractNumber} -> ${repaired.successorContractNumbers.join(', ')}`
      )
    }
  }

  if (summary.skippedContracts.length > 0) {
    console.log('- 跳过合同:')
    for (const skipped of summary.skippedContracts) {
      console.log(`  ${skipped.contractNumber}: ${skipped.reason}`)
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const { auditExtendedExpiredContracts } = await import(
    '../src/lib/fix-017-extended-expired-contract-audit'
  )
  const auditSummary = await auditExtendedExpiredContracts({
    contractNumbers: options.contractNumbers,
  })

  if (!options.apply) {
    if (options.json) {
      console.log(JSON.stringify(auditSummary, null, 2))
      return
    }

    printAuditSummary(auditSummary)
    console.log('')
    console.log('默认仅输出审计清单；如需执行安全修复，请显式添加 --apply。')
    return
  }

  const repairSummary = await applySafeRepairs(auditSummary)
  if (options.json) {
    console.log(JSON.stringify(repairSummary, null, 2))
    return
  }

  printRepairSummary(repairSummary)
}

main()
  .catch((error) => {
    console.error('fix_017 安全修复工具执行失败:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
