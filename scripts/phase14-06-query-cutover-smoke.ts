import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import {
  flattenLegacyRouteInventory,
  type LegacyRouteCategory,
  type LegacyRouteMethod,
} from '../server/lib/legacy-route-inventory'

interface AssertionResult {
  label: string
  passed: boolean
  details: string[]
}

interface InventoryExpectation {
  routePath: string
  method: LegacyRouteMethod
  category: LegacyRouteCategory
  formalHost: string
}

interface FileExpectation {
  label: string
  filePath: string
  includes?: string[]
  excludes?: string[]
}

const WORKSPACE_ROOT = process.cwd()
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])

const inventoryExpectations: readonly InventoryExpectation[] = [
  {
    routePath: '/api/dashboard/stats',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/dashboard.ts',
  },
  {
    routePath: '/api/dashboard/vacant-rooms',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/dashboard.ts',
  },
  {
    routePath: '/api/dashboard/leaving-tenants',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/dashboard.ts',
  },
  {
    routePath: '/api/dashboard/upcoming-contracts',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/dashboard.ts',
  },
  {
    routePath: '/api/dashboard/contract-alerts',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/dashboard.ts',
  },
  {
    routePath: '/api/settings',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/settings.ts',
  },
  {
    routePath: '/api/settings',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/settings.ts',
  },
  {
    routePath: '/api/settings',
    method: 'DELETE',
    category: 'compat-wrapper',
    formalHost: 'server/routes/settings.ts',
  },
  {
    routePath: '/api/settings/init',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/settings.ts',
  },
  {
    routePath: '/api/renters',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/renters.ts',
  },
  {
    routePath: '/api/renters',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/renters.ts',
  },
  {
    routePath: '/api/renters/:id',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/renters.ts',
  },
  {
    routePath: '/api/renters/:id',
    method: 'PUT',
    category: 'compat-wrapper',
    formalHost: 'server/routes/renters.ts',
  },
  {
    routePath: '/api/renters/:id',
    method: 'DELETE',
    category: 'compat-wrapper',
    formalHost: 'server/routes/renters.ts',
  },
  {
    routePath: '/api/renters/stats',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/renters.ts',
  },
  {
    routePath: '/api/meter-readings',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/meter-readings.ts',
  },
  {
    routePath: '/api/meter-readings',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/meter-readings.ts',
  },
  {
    routePath: '/api/meter-readings/:id',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/meter-readings.ts',
  },
  {
    routePath: '/api/meter-readings/:id',
    method: 'PUT',
    category: 'compat-wrapper',
    formalHost: 'server/routes/meter-readings.ts',
  },
  {
    routePath: '/api/meter-readings/:id',
    method: 'DELETE',
    category: 'compat-wrapper',
    formalHost: 'server/routes/meter-readings.ts',
  },
  {
    routePath: '/api/meter-readings/:id/related-bills',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/meter-readings.ts',
  },
  {
    routePath: '/api/meter-readings/status-check',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/meter-readings.ts',
  },
  {
    routePath: '/api/meter-readings/repair-status',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/meter-readings.ts',
  },
  {
    routePath: '/api/utility-readings',
    method: 'GET',
    category: 'compat-wrapper',
    formalHost: 'server/routes/utility-readings.ts',
  },
  {
    routePath: '/api/utility-readings',
    method: 'POST',
    category: 'compat-wrapper',
    formalHost: 'server/routes/utility-readings.ts',
  },
] as const

const formalHostExpectations: readonly FileExpectation[] = [
  {
    label: 'dashboard formal host',
    filePath: 'server/routes/dashboard.ts',
    includes: [
      "from '@/lib/dashboard-formal-host'",
      'getDashboardStatsData',
      'getDashboardVacantRoomsData',
      'compatBoundary: DASHBOARD_HOST_STATE',
    ],
  },
  {
    label: 'settings formal host',
    filePath: 'server/routes/settings.ts',
    includes: [
      "from '@/lib/global-settings'",
      'routeApp.get(\'/\'',
      'routeApp.post(\'/\'',
      'routeApp.delete(\'/\'',
      "routeApp.post('/init'",
    ],
  },
  {
    label: 'renters formal host',
    filePath: 'server/routes/renters.ts',
    includes: [
      'listRenters',
      'getRenterStats',
      'getRenterDetail',
      'createRenter',
      'updateRenter',
      'deleteRenter',
    ],
  },
  {
    label: 'meter-readings formal host',
    filePath: 'server/routes/meter-readings.ts',
    includes: [
      'listMeterReadings',
      'getMeterReadingStatusCheck',
      'repairMeterReadingStatus',
      'meterReadingDomainService.createRegularMeterReadingBatch',
      'getRelatedBillsForMeterReading',
    ],
  },
  {
    label: 'utility compat host',
    filePath: 'server/routes/utility-readings.ts',
    includes: [
      'generateLegacyUtilityBillCompat',
      'listContractUtilityBillHistory',
      "migrationHost: 'server/routes/utility-readings.ts'",
    ],
  },
] as const

const compatWrapperExpectations: readonly FileExpectation[] = [
  {
    label: 'dashboard next compat wrapper',
    filePath: 'src/app/api/dashboard/stats/route.ts',
    includes: [
      'proxyToFormalHost',
      "migrationHost: DASHBOARD_FORMAL_HOST",
      "closurePhase: 'phase14-06'",
    ],
    excludes: ['dashboardQueries', 'getDashboardStatsPageClosureData'],
  },
  {
    label: 'settings next compat wrapper',
    filePath: 'src/app/api/settings/route.ts',
    includes: [
      'proxyToFormalHost',
      "migrationHost: SETTINGS_FORMAL_HOST",
      "closurePhase: 'phase14-06'",
    ],
    excludes: ['globalSettings.'],
  },
  {
    label: 'renters next compat wrapper',
    filePath: 'src/app/api/renters/route.ts',
    includes: [
      'proxyToFormalHost',
      "migrationHost: RENTERS_FORMAL_HOST",
      "closurePhase: 'phase14-06'",
    ],
    excludes: ['getRentersPageClosureData', 'optimizedRenterQueries', 'renterQueries'],
  },
  {
    label: 'meter-readings next compat wrapper',
    filePath: 'src/app/api/meter-readings/route.ts',
    includes: [
      'proxyToFormalHost',
      "migrationHost: METER_READINGS_FORMAL_HOST",
      "closurePhase: 'phase14-06'",
    ],
    excludes: ['getMeterReadingsPageClosureData', 'meterReadingQueries'],
  },
  {
    label: 'utility next compat wrapper',
    filePath: 'src/app/api/utility-readings/route.ts',
    includes: [
      'proxyToFormalHost',
      "migrationHost: UTILITY_READINGS_FORMAL_HOST",
      "closurePhase: 'phase14-06'",
    ],
    excludes: ['generateLegacyUtilityBillCompat', 'listContractUtilityBillHistory'],
  },
] as const

const pageDirectionExpectations: readonly FileExpectation[] = [
  {
    label: 'dashboard page consumes Hono dashboard endpoints',
    filePath: 'src/minix/components/homepage/MinixDashboardAdapters.tsx',
    includes: [
      "buildMinixApiUrl('/dashboard/vacant-rooms')",
      "buildMinixApiUrl('/dashboard/leaving-tenants')",
      "buildMinixApiUrl('/dashboard/upcoming-contracts')",
      "buildMinixApiUrl('/dashboard/contract-alerts')",
    ],
  },
  {
    label: 'dashboard stats hook keeps page side pointed at dashboard api',
    filePath: 'src/hooks/useStatistics.ts',
    includes: ["fetch('/api/dashboard/stats')"],
  },
  {
    label: 'settings loader points to settings api',
    filePath: 'src/minix/lib/primary-route-data.ts',
    includes: [
      "'/settings'",
      "'/renters/stats'",
      "'/meter-readings'",
      'buildApiUrl(`/bills/${billId}/details`)',
    ],
    excludes: ["'/utility-readings'", 'page-closure-compat'],
  },
  {
    label: 'settings client hook points to settings api',
    filePath: 'src/hooks/useSettings.ts',
    includes: [
      "fetch('/api/settings')",
      "fetch('/api/settings/init'",
      "fetch('/api/settings', { method: 'DELETE' })",
    ],
  },
  {
    label: 'renters page actions point to renters api',
    filePath: 'src/components/pages/RenterCreatePage.tsx',
    includes: ["fetch('/api/renters', {"],
  },
  {
    label: 'renters detail page actions point to renters api',
    filePath: 'src/components/pages/RenterDetailPage.tsx',
    includes: ["fetch(`/api/renters/${renter.id}`, {"],
  },
  {
    label: 'renters edit page actions point to renters api',
    filePath: 'src/components/pages/RenterEditPage.tsx',
    includes: ["fetch(`/api/renters/${renter.id}`, {"],
  },
  {
    label: 'meter-reading history page points to meter-readings api',
    filePath: 'src/components/pages/MeterReadingHistoryPage.tsx',
    includes: [
      "fetch('/api/meter-readings/status-check')",
      "fetch('/api/meter-readings/repair-status', {",
      '`/api/meter-readings?${queryParams.toString()}`',
    ],
  },
  {
    label: 'meter-reading batch page points to meter-readings api',
    filePath: 'src/components/pages/BatchMeterReadingPage.tsx',
    includes: ["fetch('/api/meter-readings', {"],
  },
  {
    label: 'utility detail page points to bills details api instead of utility tail api',
    filePath: 'src/components/business/BillBasicInfo.tsx',
    includes: ['fetch(`/api/bills/${bill.id}/details`)'],
    excludes: ['/api/utility-readings'],
  },
  {
    label: 'dashboard compat helper only delegates to formal host',
    filePath: 'src/lib/page-closure-compat/dashboard.ts',
    includes: [
      "from '@/lib/dashboard-formal-host'",
      'return getDashboardStatsData()',
      'return getDashboardContractAlertsData()',
    ],
    excludes: ['dashboard-queries'],
  },
] as const

function createAssertionResult(
  label: string,
  passed: boolean,
  details: string[]
): AssertionResult {
  return { label, passed, details }
}

function printAssertionResult(result: AssertionResult) {
  const prefix = result.passed ? '[PASS]' : '[FAIL]'
  console.log(`${prefix} ${result.label}`)
  for (const detail of result.details) {
    console.log(`  - ${detail}`)
  }
}

async function readWorkspaceFile(relativePath: string) {
  return readFile(path.join(WORKSPACE_ROOT, relativePath), 'utf8')
}

function assertInventoryExpectation(expectation: InventoryExpectation): AssertionResult {
  const operation = flattenLegacyRouteInventory().find(
    (item) =>
      item.routePath === expectation.routePath &&
      item.methods.includes(expectation.method)
  )

  if (!operation) {
    return createAssertionResult(
      `inventory ${expectation.method} ${expectation.routePath}`,
      false,
      ['FAIL 未找到对应 route inventory 条目']
    )
  }

  const categoryMatched = operation.category === expectation.category
  const hostMatched = operation.formalHosts.includes(expectation.formalHost)
  return createAssertionResult(
    `inventory ${expectation.method} ${expectation.routePath}`,
    categoryMatched && hostMatched,
    [
      `${categoryMatched ? 'PASS' : 'FAIL'} category = ${operation.category}`,
      `${hostMatched ? 'PASS' : 'FAIL'} formalHosts = ${operation.formalHosts.join(' | ') || '<empty>'}`,
    ]
  )
}

async function assertFileExpectation(expectation: FileExpectation): Promise<AssertionResult> {
  const content = await readWorkspaceFile(expectation.filePath)
  const details: string[] = []
  let passed = true

  for (const needle of expectation.includes ?? []) {
    const matched = content.includes(needle)
    details.push(`${matched ? 'PASS' : 'FAIL'} includes "${needle}"`)
    passed &&= matched
  }

  for (const needle of expectation.excludes ?? []) {
    const matched = !content.includes(needle)
    details.push(`${matched ? 'PASS' : 'FAIL'} excludes "${needle}"`)
    passed &&= matched
  }

  return createAssertionResult(expectation.label, passed, details)
}

async function collectSourceFiles(relativeDir: string): Promise<string[]> {
  const absoluteDir = path.join(WORKSPACE_ROOT, relativeDir)
  const entries = await readdir(absoluteDir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = path.join(relativeDir, entry.name)
      if (entry.isDirectory()) {
        return collectSourceFiles(relativePath)
      }

      if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        return []
      }

      return [relativePath]
    })
  )

  return files.flat().sort()
}

async function assertNoNeedleInDirectories(
  label: string,
  directories: string[],
  needle: string
): Promise<AssertionResult> {
  const files = (await Promise.all(directories.map((dir) => collectSourceFiles(dir)))).flat()
  const hits: string[] = []

  for (const filePath of files) {
    const content = await readWorkspaceFile(filePath)
    if (content.includes(needle)) {
      hits.push(filePath)
    }
  }

  return createAssertionResult(
    label,
    hits.length === 0,
    hits.length === 0
      ? [`PASS 未发现 "${needle}" 残留调用`]
      : hits.map((filePath) => `FAIL ${filePath} 仍包含 "${needle}"`)
  )
}

async function runSmokeAssertions() {
  const results: AssertionResult[] = []

  for (const expectation of inventoryExpectations) {
    results.push(assertInventoryExpectation(expectation))
  }

  for (const expectation of formalHostExpectations) {
    results.push(await assertFileExpectation(expectation))
  }

  for (const expectation of compatWrapperExpectations) {
    results.push(await assertFileExpectation(expectation))
  }

  for (const expectation of pageDirectionExpectations) {
    results.push(await assertFileExpectation(expectation))
  }

  results.push(
    await assertNoNeedleInDirectories(
      'minix/page layer 不再直接依赖 page-closure-compat',
      ['src/minix', 'src/components/pages', 'src/hooks', 'src/components/business'],
      'page-closure-compat'
    )
  )

  results.push(
    await assertNoNeedleInDirectories(
      'minix/page layer 不再直接消费 utility legacy tail api',
      ['src/minix', 'src/components/pages', 'src/hooks', 'src/components/business'],
      '/api/utility-readings'
    )
  )

  console.log('\n=== phase14-06 wave2 query cutover smoke 断言 ===')
  results.forEach(printAssertionResult)

  const failed = results.filter((result) => !result.passed)
  console.log(`\n断言汇总: ${results.length - failed.length}/${results.length} 通过，${failed.length} 失败`)

  if (failed.length > 0) {
    throw new Error(
      `phase14-06 wave2 断言失败：${failed.map((item) => item.label).join('；')}`
    )
  }
}

void runSmokeAssertions()
