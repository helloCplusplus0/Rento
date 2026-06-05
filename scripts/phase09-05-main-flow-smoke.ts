import {
  CONTRACT_MAIN_FLOW_CONSISTENCY_MATRIX,
  type ContractMainFlowKey,
} from '@/lib/domain/contracts'

type SmokeFlowKey =
  | 'new-contract'
  | 'renew'
  | 'checkout'
  | 'meter-reading'
  | 'all'

interface SmokeFlowDefinition {
  cliKey: Exclude<SmokeFlowKey, 'all'>
  matrixKey: ContractMainFlowKey
  title: string
  endpoint: string
  method: 'POST'
  payload: Record<string, unknown>
  expectedFacts: string[]
  preconditions: string[]
}

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:3000/api'
const COOKIE_PLACEHOLDER = process.env.SMOKE_COOKIE || 'session=<replace-me>'

const flowDefinitions: SmokeFlowDefinition[] = [
  {
    cliKey: 'new-contract',
    matrixKey: 'NEW_SIGN_CONTRACT',
    title: '新签合同出账',
    endpoint: '/contracts',
    method: 'POST',
    payload: {
      renterId: '<renterId>',
      roomId: '<roomId>',
      startDate: '2026-06-10',
      endDate: '2027-06-09',
      monthlyRent: 2600,
      deposit: 5200,
      paymentMethod: '月付',
      generateBills: true,
      meterInitialReadings: {
        '<meterId>': 100,
      },
    },
    preconditions: [
      '目标房间当前为 VACANT',
      '目标租客当前没有 ACTIVE 合同',
      '若带初始仪表底数，meterId 必须属于该房间的启用仪表',
    ],
    expectedFacts: [
      '合同状态按开始日期落为 ACTIVE 或 PENDING',
      '房间状态与 currentRenter 同步更新',
      '账单由统一出账主链生成，不再由旧 generate-bills 入口独立演化',
    ],
  },
  {
    cliKey: 'renew',
    matrixKey: 'RENEW_CONTRACT',
    title: '续租与补账单',
    endpoint: '/contracts/<contractId>/renew',
    method: 'POST',
    payload: {
      newStartDate: '2026-07-01',
      newEndDate: '2027-06-30',
      newMonthlyRent: 2800,
      paymentMethod: '月付',
      signedBy: 'smoke-validator',
      remarks: 'phase09-05 smoke renew',
    },
    preconditions: [
      '原合同状态为 ACTIVE 或 EXPIRED',
      '原合同不存在 PENDING / OVERDUE 未结清账单',
      '原合同所属房间当前为 OCCUPIED',
    ],
    expectedFacts: [
      '原合同变为 EXPIRED 且标记为已续租',
      '新合同由 src/lib/domain/contracts 统一创建并返回事实快照',
      '缺失账单按统一补账单编排生成或修复',
    ],
  },
  {
    cliKey: 'checkout',
    matrixKey: 'CHECKOUT_SETTLEMENT',
    title: '退租结算',
    endpoint: '/contracts/<contractId>/checkout',
    method: 'POST',
    payload: {
      checkoutDate: '2026-06-20',
      checkoutReason: '合同期满',
      damageAssessment: 0,
      finalMeterReadings: {
        '<meterId>': 180,
      },
      settlementItems: '<使用退租预览页返回的正式结算明细原样提交>',
    },
    preconditions: [
      '目标合同状态为 ACTIVE',
      'checkoutDate 不早于今天且不晚于合同 endDate',
      'settlementItems 必须来自最新退租预览，不得手工拼接缺项',
    ],
    expectedFacts: [
      '合同状态落为 TERMINATED，businessStatus 为 CHECKED_OUT',
      '房间状态回空，旧开放账单被正式结算并留痕',
      '最终抄表与退租账单在数据库侧可追溯',
    ],
  },
  {
    cliKey: 'meter-reading',
    matrixKey: 'METER_READING_BILLING',
    title: '多仪表抄表出账',
    endpoint: '/meter-readings',
    method: 'POST',
    payload: {
      aggregationMode: 'AGGREGATED',
      readings: [
        {
          meterId: '<electricMeterId>',
          contractId: '<contractId>',
          previousReading: 100,
          currentReading: 160,
          readingDate: '2026-06-25',
          period: '2026-06',
          operator: 'smoke-validator',
        },
        {
          meterId: '<waterMeterId>',
          contractId: '<contractId>',
          previousReading: 20,
          currentReading: 26,
          readingDate: '2026-06-25',
          period: '2026-06',
          operator: 'smoke-validator',
        },
      ],
    },
    preconditions: [
      '所有 meterId 必须属于同一合同关联房间的启用仪表',
      '同仪表同周期不能已存在正式 REGULAR_READING',
      '全局配置允许自动出账时会同步生成 UTILITIES 账单',
    ],
    expectedFacts: [
      '抄表记录写入后由统一主链驱动聚合或单表出账',
      '账单明细与 meterReadingId 关系可追溯',
      'related-bills 查询与写路径围绕同一数据库事实',
    ],
  },
]

function buildCurlCommand(definition: SmokeFlowDefinition) {
  const targetUrl = `${BASE_URL}${definition.endpoint}`
  const payload = JSON.stringify(definition.payload, null, 2)

  return [
    'curl -X POST',
    `  '${targetUrl}'`,
    `  -H 'Content-Type: application/json'`,
    `  -H 'Cookie: ${COOKIE_PLACEHOLDER}'`,
    `  --data-raw '${payload}'`,
  ].join(' \\\n')
}

function printDefinition(definition: SmokeFlowDefinition) {
  const matrix = CONTRACT_MAIN_FLOW_CONSISTENCY_MATRIX.find(
    (item) => item.key === definition.matrixKey
  )

  if (!matrix) {
    throw new Error(`未找到主链矩阵定义: ${definition.matrixKey}`)
  }

  console.log(`\n=== ${definition.title} ===`)
  console.log(`主链键: ${definition.matrixKey}`)
  console.log(`正式写入口: ${matrix.canonicalWriteHost}`)
  console.log(`正式查询口径: ${matrix.canonicalQueryHosts.join(' | ')}`)
  console.log(`兼容包装入口: ${matrix.compatWrappers.join(' | ')}`)
  console.log(`请求方法: ${definition.method}`)
  console.log(`请求地址: ${BASE_URL}${definition.endpoint}`)
  console.log('前置条件:')
  for (const item of definition.preconditions) {
    console.log(`- ${item}`)
  }
  console.log('期望事实:')
  for (const item of definition.expectedFacts) {
    console.log(`- ${item}`)
  }
  console.log('建议执行命令:')
  console.log(buildCurlCommand(definition))
}

function main() {
  const cliKey = (process.argv[2] as SmokeFlowKey | undefined) || 'all'

  if (cliKey === 'all') {
    flowDefinitions.forEach(printDefinition)
    return
  }

  const definition = flowDefinitions.find((item) => item.cliKey === cliKey)
  if (!definition) {
    throw new Error(
      `不支持的 smoke key: ${cliKey}，可选值为 ${[
        'new-contract',
        'renew',
        'checkout',
        'meter-reading',
        'all',
      ].join(', ')}`
    )
  }

  printDefinition(definition)
}

main()
