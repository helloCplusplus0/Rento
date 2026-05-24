import './load-env'

import type { HistoricalCheckoutSettlementAuditSummary } from '../src/lib/fix-002-checkout-settlement-audit'

interface CliOptions {
  json: boolean
  help: boolean
  contractNumbers: string[]
  billNumbers: string[]
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    json: false,
    help: false,
    contractNumbers: [],
    billNumbers: [],
  }

  for (const arg of argv) {
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
      continue
    }

    if (arg.startsWith('--bill-number=')) {
      const rawValue = arg.slice('--bill-number='.length)
      const billNumbers = rawValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      options.billNumbers.push(...billNumbers)
    }
  }

  return options
}

function printHelp(): void {
  console.log(`
fix_002 历史退租结算账单审计工具

用法:
  npm run fix:002:checkout-settlement-audit
  npm run fix:002:checkout-settlement-audit -- --contract-number=HT-2026-001
  npm run fix:002:checkout-settlement-audit -- --bill-number=AD202605220001
  npm run fix:002:checkout-settlement-audit -- --json

参数:
  --contract-number=<list>  只审计指定合同编号，支持逗号分隔
  --bill-number=<list>      只审计指定账单编号，支持逗号分隔
  --json                    以 JSON 输出审计结果
  --help, -h                查看帮助

默认行为:
  仅输出历史退租结算账单审计清单，并标记“是否允许进入自动修复评估”。
  本工具不会直接改写任何历史账单。
`)
}

function printHumanReadableSummary(
  summary: HistoricalCheckoutSettlementAuditSummary
): void {
  console.log('fix_002 历史退租结算账单审计结果')
  console.log(`- 候选账单总数: ${summary.totalAuditedCandidates}`)
  console.log(`- 命中异常账单: ${summary.totalFlaggedBills}`)
  console.log(`- 允许进入自动修复评估: ${summary.autoFixEvaluationEligibleBills}`)
  console.log(`- 仅审计清单: ${summary.auditOnlyBills}`)

  if (summary.results.length === 0) {
    return
  }

  console.log('')
  for (const result of summary.results) {
    console.log(
      `[${result.eligibleForAutoFixEvaluation ? 'SAFE_EVAL' : 'AUDIT_ONLY'}] ${result.billNumber} / ${result.contractNumber}`
    )
    console.log(
      `  状态=${result.status} | 金额=${result.amount} | 已收=${result.receivedAmount} | 待收=${result.pendingAmount}`
    )
    console.log(
      `  识别信号=${result.detectionSignals.join(', ')} | 命中规则=${result.mismatchReasons.join(', ')}`
    )
    console.log(
      `  自动修复评估边界=${result.eligibleForAutoFixEvaluation ? '满足' : result.autoFixEvaluationBlockedReasons.join(', ')}`
    )
    console.log(
      `  metadata=${result.hasStructuredMetadata ? '结构化' : '缺失/无效'} | 可信=${result.metadataTrusted ? '是' : '否'} | 结算类型=${result.metadataSettlementType ?? '未知'} | metadata净额=${result.metadataNetAmount ?? '未知'}`
    )
    console.log(`  处理策略=${result.manualHandlingStrategy}`)
  }
}

async function main() {
  const [{ prisma }, { auditHistoricalCheckoutSettlementBills }] = await Promise.all([
    import('../src/lib/prisma'),
    import('../src/lib/fix-002-checkout-settlement-audit'),
  ])
  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    printHelp()
    return
  }

  const summary = await auditHistoricalCheckoutSettlementBills({
    contractNumbers: options.contractNumbers,
    billNumbers: options.billNumbers,
  })

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  printHumanReadableSummary(summary)
}

main()
  .catch((error) => {
    console.error('fix_002 审计工具执行失败:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    const { prisma } = await import('../src/lib/prisma')
    await prisma.$disconnect()
  })
