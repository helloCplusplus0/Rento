import './load-env'

import type {
  HistoricalRentBillRepairSummary,
} from '../src/lib/fix-001-rent-bill-repair'

interface CliOptions {
  apply: boolean
  json: boolean
  help: boolean
  contractNumbers: string[]
}

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
      const numbers = rawValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      options.contractNumbers.push(...numbers)
    }
  }

  return options
}

function printHelp(): void {
  console.log(`
fix_001 历史 RENT 账单审计 / 安全修复工具

用法:
  npm run fix:001:rent-bills
  npm run fix:001:rent-bills -- --contract-number=HT-2026-001
  npm run fix:001:rent-bills -- --apply
  npm run fix:001:rent-bills -- --json

参数:
  --apply                   仅对安全边界内合同执行自动修复
  --contract-number=<list>  只处理指定合同编号，支持逗号分隔
  --json                    以 JSON 输出审计结果
  --help, -h                查看帮助

默认行为:
  只做 dry-run 审计，不改写任何历史账单。
`)
}

function printHumanReadableSummary(summary: HistoricalRentBillRepairSummary) {
  console.log('fix_001 历史 RENT 账单审计结果')
  console.log(`- 已审计合同: ${summary.totalAuditedContracts}`)
  console.log(`- 命中异常合同: ${summary.totalFlaggedContracts}`)
  console.log(`- 可自动修复: ${summary.autoFixableContracts}`)
  console.log(`- 仅审计清单: ${summary.auditOnlyContracts}`)

  if (summary.results.length === 0) {
    return
  }

  console.log('')
  for (const result of summary.results) {
    console.log(
      `[${result.safeToAutoFix ? 'AUTO_FIXABLE' : 'AUDIT_ONLY'}] ${result.contractNumber}`
    )
    console.log(
      `  paymentMethod=${result.paymentMethod ?? 'null'} | 周期=${result.paymentCycleLabel} | 理论条数=${result.theoreticalRentBillCount} | 实际条数=${result.actualRentBillCount}`
    )
    console.log(
      `  理论每期金额=${result.theoreticalRentAmountPerPeriod} | 现有状态=${result.actualBillStatuses.join(', ') || '无'}`
    )
    console.log(`  识别命中=${result.mismatchReasons.join(', ')}`)
    console.log(
      `  自动修复边界=${result.safeToAutoFix ? '满足' : result.autoFixBlockedReasons.join(', ')}`
    )
    console.log(`  处理策略=${result.manualHandlingStrategy}`)
  }
}

async function main() {
  const [{ applySafeHistoricalRentBillRepairs, auditHistoricalRentBillRepairs }] =
    await Promise.all([
      import('../src/lib/fix-001-rent-bill-repair'),
    ])
  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    printHelp()
    return
  }

  const filters = {
    contractNumbers: options.contractNumbers,
  }

  if (options.apply) {
    const applySummary = await applySafeHistoricalRentBillRepairs(filters)
    if (options.json) {
      console.log(JSON.stringify(applySummary, null, 2))
      return
    }

    console.log('fix_001 历史 RENT 账单安全修复结果')
    console.log(`- 已审计合同: ${applySummary.auditedContracts}`)
    console.log(`- 安全可修合同: ${applySummary.fixableContracts}`)
    console.log(`- 实际修复合同: ${applySummary.repairedContracts}`)
    console.log(`- 重建 RENT 账单: ${applySummary.repairedBills}`)

    if (applySummary.skippedContracts.length > 0) {
      console.log('- 跳过合同:')
      for (const skipped of applySummary.skippedContracts) {
        console.log(`  ${skipped.contractNumber}: ${skipped.reason}`)
      }
    }

    return
  }

  const auditSummary = await auditHistoricalRentBillRepairs(filters)
  if (options.json) {
    console.log(JSON.stringify(auditSummary, null, 2))
    return
  }

  printHumanReadableSummary(auditSummary)
  console.log('')
  console.log('默认仅输出审计清单；如需执行安全修复，请显式添加 --apply。')
}

main()
  .catch((error) => {
    console.error('fix_001 工具执行失败:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    const { prisma } = await import('../src/lib/prisma')
    await prisma.$disconnect()
  })
