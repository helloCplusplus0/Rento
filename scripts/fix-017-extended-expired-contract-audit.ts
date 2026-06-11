import './load-env'

import type {
  ExtendedExpiredContractAuditSummary,
} from '../src/lib/fix-017-extended-expired-contract-audit'

interface CliOptions {
  json: boolean
  help: boolean
  contractNumbers: string[]
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    json: false,
    help: false,
    contractNumbers: [],
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
    }
  }

  return options
}

function printHelp(): void {
  console.log(`
fix_017 历史续租旧合同审计工具

用法:
  npm run fix:017:extended-expired-contract-audit
  npm run fix:017:extended-expired-contract-audit -- --contract-number=HT-2026-001
  npm run fix:017:extended-expired-contract-audit -- --json

参数:
  --contract-number=<list>  只盘点指定合同编号，支持逗号分隔
  --json                    以 JSON 输出盘点结果
  --help, -h                查看帮助

默认行为:
  仅盘点 status=EXPIRED 且 isExtended=true 的历史合同，输出续租备注证据与候选承接合同。
  本工具不会改写任何合同数据。
`)
}

function printHumanReadableSummary(
  summary: ExtendedExpiredContractAuditSummary
): void {
  console.log('fix_017 历史续租旧合同盘点结果')
  console.log(`- 命中合同总数: ${summary.totalMatchedContracts}`)
  console.log(
    `- 带续租备注证据: ${summary.contractsWithRenewalRemarkEvidence}`
  )
  console.log(
    `- 存在候选承接合同: ${summary.contractsWithSuccessorCandidates}`
  )

  if (summary.results.length === 0) {
    return
  }

  console.log('')
  for (const result of summary.results) {
    console.log(
      `[${result.contractNumber}] ${result.roomInfo} / ${result.renterName}`
    )
    console.log(
      `  状态=${result.status} | isExtended=${result.isExtended ? 'true' : 'false'} | businessStatus=${result.businessStatus ?? 'null'}`
    )
    console.log(
      `  起止=${result.startDate} -> ${result.endDate} | 更新=${result.updatedAt}`
    )
    console.log(
      `  续租备注证据=${result.hasRenewalRemarkEvidence ? '命中' : '未命中'} | 候选承接合同=${result.successorContracts.length}`
    )

    if (result.successorContracts.length > 0) {
      const successorSummary = result.successorContracts
        .map(
          (candidate) =>
            `${candidate.contractNumber}(${candidate.status}, ${candidate.startDate} -> ${candidate.endDate})`
        )
        .join(', ')
      console.log(`  承接候选=${successorSummary}`)
    }

    if (result.remarks) {
      console.log(`  remarks=${result.remarks}`)
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
  const summary = await auditExtendedExpiredContracts({
    contractNumbers: options.contractNumbers,
  })

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  printHumanReadableSummary(summary)
}

main()
  .catch((error) => {
    console.error('fix_017 审计工具执行失败:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    const { prisma } = await import('../src/lib/prisma')
    await prisma.$disconnect()
  })
