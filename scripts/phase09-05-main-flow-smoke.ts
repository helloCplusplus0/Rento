import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  CONTRACT_MAIN_FLOW_CONSISTENCY_MATRIX,
  type ContractMainFlowKey,
} from '@/lib/domain/contracts'
import {
  flattenLegacyRouteInventory,
  type LegacyRouteCategory,
  type LegacyRouteMethod,
} from '../server/lib/legacy-route-inventory'

type SmokeFlowCliKey =
  | 'new-contract'
  | 'renew'
  | 'checkout'
  | 'meter-reading'

type SmokeFlowKey = SmokeFlowCliKey | 'all'

interface SmokeFlowDefinition {
  cliKey: SmokeFlowCliKey
  matrixKey: ContractMainFlowKey
  title: string
  endpoint: string
  method: 'POST'
  payload: Record<string, unknown>
  expectedFacts: string[]
  preconditions: string[]
}

interface MatrixExpectation {
  key: ContractMainFlowKey
  canonicalWriteIncludes: string[]
  canonicalQueryHosts: string[]
  compatWrappers: string[]
}

interface InventoryExpectation {
  routePath: string
  method: LegacyRouteMethod
  category: LegacyRouteCategory
  formalHost: string
}

interface AssertionResult {
  label: string
  passed: boolean
  details: string[]
}

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:3000/api'
const COOKIE_PLACEHOLDER = process.env.SMOKE_COOKIE || 'session=<replace-me>'
const WORKSPACE_ROOT = process.cwd()

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
      '新合同由统一 Hono 宿主与共享领域服务编排并返回事实快照',
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

const matrixExpectations: readonly MatrixExpectation[] = [
  {
    key: 'NEW_SIGN_CONTRACT',
    canonicalWriteIncludes: ['server/routes/contracts.ts', 'generateBillsOnContractSigned'],
    canonicalQueryHosts: [
      '合同列表分页 -> server/routes/contracts.ts -> src/lib/optimized-queries.ts',
      '合同详情/SSR 回查 -> server/routes/contracts.ts -> src/lib/queries.ts',
      '提醒窗口配置 -> src/lib/global-settings.ts',
    ],
    compatWrappers: [
      'src/app/api/contracts/route.ts',
      'src/app/api/contracts/[id]/generate-bills/route.ts',
    ],
  },
  {
    key: 'RENEW_CONTRACT',
    canonicalWriteIncludes: ['server/routes/contracts.ts', 'src/lib/domain/contracts'],
    canonicalQueryHosts: [
      '合同详情 -> server/routes/contracts.ts -> src/lib/queries.ts',
      '续租响应事实快照 -> server/routes/contracts.ts -> src/lib/domain/contracts',
    ],
    compatWrappers: [
      'src/app/api/contracts/[id]/route.ts',
      'src/app/api/contracts/[id]/renew/route.ts',
    ],
  },
  {
    key: 'CHECKOUT_SETTLEMENT',
    canonicalWriteIncludes: ['server/routes/checkout.ts', 'src/lib/domain/contracts'],
    canonicalQueryHosts: [
      '合同详情 -> server/routes/contracts.ts -> src/lib/queries.ts',
      '退租结算响应事实快照 -> server/routes/checkout.ts -> src/lib/domain/contracts',
      '终抄详情/related bills -> server/routes/meter-readings.ts -> src/lib/domain/meters',
    ],
    compatWrappers: [
      'src/app/api/contracts/[id]/route.ts',
      'src/app/api/contracts/[id]/checkout/route.ts',
    ],
  },
  {
    key: 'METER_READING_BILLING',
    canonicalWriteIncludes: ['src/lib/domain/meters'],
    canonicalQueryHosts: [
      '抄表详情 -> src/lib/domain/meters',
      'related bills compat 宿主 -> src/app/api/meter-readings/[id]/related-bills/route.ts',
    ],
    compatWrappers: ['src/app/api/meter-readings/route.ts'],
  },
] as const

const inventoryExpectations: readonly InventoryExpectation[] = [
  {
    routePath: '/api/rooms',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/rooms.ts',
  },
  {
    routePath: '/api/rooms',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/rooms.ts',
  },
  {
    routePath: '/api/rooms/:id',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/rooms.ts',
  },
  {
    routePath: '/api/contracts',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/contracts.ts',
  },
  {
    routePath: '/api/contracts',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/contracts.ts',
  },
  {
    routePath: '/api/contracts/:id/renew',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/contracts.ts',
  },
  {
    routePath: '/api/contracts/:id/checkout',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/checkout.ts',
  },
  {
    routePath: '/api/bills',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/bills.ts',
  },
  {
    routePath: '/api/bills',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/bills.ts',
  },
  {
    routePath: '/api/bills/:id',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/bills.ts',
  },
  {
    routePath: '/api/bills/:id/details',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/bills.ts',
  },
  {
    routePath: '/api/bills/stats',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/bills.ts',
  },
] as const

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

function getMatrixByKey(key: ContractMainFlowKey) {
  const matrix = CONTRACT_MAIN_FLOW_CONSISTENCY_MATRIX.find((item) => item.key === key)

  if (!matrix) {
    throw new Error(`未找到主链矩阵定义: ${key}`)
  }

  return matrix
}

function printDefinition(definition: SmokeFlowDefinition) {
  const matrix = getMatrixByKey(definition.matrixKey)

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

function createAssertionResult(
  label: string,
  passed: boolean,
  details: string[]
): AssertionResult {
  return { label, passed, details }
}

function assertMatrixExpectation(expectation: MatrixExpectation): AssertionResult {
  const matrix = getMatrixByKey(expectation.key)
  const details: string[] = []
  let passed = true

  for (const fragment of expectation.canonicalWriteIncludes) {
    const matched = matrix.canonicalWriteHost.includes(fragment)
    details.push(
      `${matched ? 'PASS' : 'FAIL'} canonicalWriteHost 包含 "${fragment}" -> ${matrix.canonicalWriteHost}`
    )
    passed &&= matched
  }

  for (const expectedHost of expectation.canonicalQueryHosts) {
    const matched = matrix.canonicalQueryHosts.includes(expectedHost)
    details.push(
      `${matched ? 'PASS' : 'FAIL'} canonicalQueryHosts 包含 "${expectedHost}"`
    )
    passed &&= matched
  }

  for (const compatWrapper of expectation.compatWrappers) {
    const matched = matrix.compatWrappers.includes(compatWrapper)
    details.push(`${matched ? 'PASS' : 'FAIL'} compatWrappers 包含 "${compatWrapper}"`)
    passed &&= matched
  }

  return createAssertionResult(`主链矩阵 ${expectation.key}`, passed, details)
}

function assertInventoryExpectation(expectation: InventoryExpectation): AssertionResult {
  const operation = flattenLegacyRouteInventory().find(
    (item) =>
      item.routePath === expectation.routePath &&
      item.methods.includes(expectation.method)
  )

  if (!operation) {
    return createAssertionResult(
      `route inventory ${expectation.method} ${expectation.routePath}`,
      false,
      ['FAIL 未找到对应 inventory 条目']
    )
  }

  const categoryMatched = operation.category === expectation.category
  const formalHostMatched = operation.formalHosts.includes(expectation.formalHost)
  const details = [
    `${categoryMatched ? 'PASS' : 'FAIL'} category = ${operation.category}`,
    `${formalHostMatched ? 'PASS' : 'FAIL'} formalHosts = ${operation.formalHosts.join(' | ') || '<empty>'}`,
  ]

  return createAssertionResult(
    `route inventory ${expectation.method} ${expectation.routePath}`,
    categoryMatched && formalHostMatched,
    details
  )
}

async function assertBillsFallbackFile(): Promise<AssertionResult> {
  const filePath = path.join(WORKSPACE_ROOT, 'server/routes/bills.ts')
  const content = await readFile(filePath, 'utf8')
  const checks = [
    {
      label: '使用 phase14-05 作为当前 fallback 阶段说明',
      matched: content.includes("phase: 'phase14-05'"),
    },
    {
      label: 'fallback migrationState 已升级为 formal-host-owned-with-retained-legacy-tail',
      matched: content.includes(
        "migrationState: 'formal-host-owned-with-retained-legacy-tail'"
      ),
    },
    {
      label: 'LEGACY_COMPAT.reason 已说明 bills 正式职责归属 Hono',
      matched: content.includes(
        'phase14-05 起统一 /api runtime 已由 server/routes/bills.ts 承担账单列表、统计、详情、草稿更新、收款状态与删除门禁等正式职责'
      ),
    },
    {
      label: 'fallback 文案不再输出旧的 phase09-03 partial-migrated 状态',
      matched:
        !content.includes("phase: 'phase09-03'") &&
        !content.includes("migrationState: 'partial-migrated'"),
    },
  ]

  return createAssertionResult(
    'bills fallback 说明',
    checks.every((item) => item.matched),
    checks.map((item) => `${item.matched ? 'PASS' : 'FAIL'} ${item.label}`)
  )
}

function printAssertionResult(result: AssertionResult) {
  const prefix = result.passed ? '[PASS]' : '[FAIL]'
  console.log(`${prefix} ${result.label}`)
  for (const detail of result.details) {
    console.log(`  - ${detail}`)
  }
}

async function runAcceptanceAudit(targetKeys?: SmokeFlowCliKey[]) {
  const selectedDefinitions = targetKeys
    ? flowDefinitions.filter((item) => targetKeys.includes(item.cliKey))
    : flowDefinitions
  const selectedMatrixKeys = new Set(selectedDefinitions.map((item) => item.matrixKey))
  const results: AssertionResult[] = []

  for (const expectation of matrixExpectations) {
    if (!selectedMatrixKeys.has(expectation.key)) {
      continue
    }
    results.push(assertMatrixExpectation(expectation))
  }

  for (const expectation of inventoryExpectations) {
    const shouldInclude =
      !targetKeys ||
      ['/api/rooms', '/api/rooms/:id', '/api/contracts', '/api/contracts/:id/renew', '/api/contracts/:id/checkout', '/api/bills', '/api/bills/:id', '/api/bills/:id/details', '/api/bills/stats'].includes(
        expectation.routePath
      )

    if (shouldInclude) {
      results.push(assertInventoryExpectation(expectation))
    }
  }

  if (!targetKeys || targetKeys.some((item) => ['new-contract', 'renew', 'checkout'].includes(item))) {
    results.push(await assertBillsFallbackFile())
  }

  console.log('\n=== phase09-05 主链 smoke 断言 ===')
  results.forEach(printAssertionResult)

  const passedCount = results.filter((item) => item.passed).length
  const failedResults = results.filter((item) => !item.passed)
  console.log(
    `\n断言汇总: ${passedCount}/${results.length} 通过，${failedResults.length} 失败`
  )

  if (failedResults.length > 0) {
    throw new Error(
      `phase09-05 主链 smoke 断言失败：${failedResults
        .map((item) => item.label)
        .join('；')}`
    )
  }
}

async function main() {
  const cliKey = (process.argv[2] as SmokeFlowKey | undefined) || 'all'

  if (cliKey === 'all') {
    await runAcceptanceAudit()
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

  await runAcceptanceAudit([definition.cliKey])
  printDefinition(definition)
}

void main()
