import { optimizedRenterQueries } from '@/lib/optimized-queries'

import type { AuthAppEnv } from '../lib/auth-context'
import { notImplementedError } from '../lib/api-errors'
import { jsonApiError, jsonSuccess } from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
import { Hono } from 'hono'

const LEGACY_COMPAT = {
  currentState: 'partial-migrated',
  targetStrategy: 'compat-wrapper',
  legacyPaths: [
    'src/app/api/renters/route.ts',
    'src/app/api/renters/[id]/route.ts',
    'src/app/api/renters/stats/route.ts',
  ] as const,
  reason:
    'phase13-03 当前轮仅为合同创建 loader 最小补齐 GET /api/renters；租客创建、详情、删改与统计仍保留旧 Next 入口。',
  exitCondition:
    '待后续阶段冻结租客正式查询/写入宿主与统计承接位后，再评估移除旧 src/app/api/renters* 入口。',
} as const

const SORT_FIELDS = new Set(['name', 'phone', 'moveInDate', 'createdAt'] as const)

function normalizeOptionalSearchParam(value: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeSortField(value: string | null) {
  if (!value) {
    return 'name' as const
  }

  return SORT_FIELDS.has(value as (typeof SORT_FIELDS extends Set<infer T> ? T : never))
    ? (value as 'name' | 'phone' | 'moveInDate' | 'createdAt')
    : ('name' as const)
}

function normalizeSortOrder(value: string | null) {
  return value === 'desc' ? 'desc' : 'asc'
}

function normalizeBooleanQuery(value: string | null) {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return undefined
}

function toClientRenter(renter: any) {
  return {
    ...renter,
    contracts: renter.contracts.map((contract: any) => ({
      ...contract,
    })),
  }
}

function appendRentersFallback(
  routeApp: Hono<AuthAppEnv>,
  env: MinixServerEnv
) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        '当前仅为合同创建页补齐 GET /api/renters；租客创建、详情、删改与统计仍由旧入口或后续子任务承接。',
        {
          phase: 'phase13-03',
          routeKey: 'renters',
          migrationState: 'partial-migrated',
          compatBoundary: LEGACY_COMPAT,
        }
      ),
      { env }
    )
  })
}

export function createRenterRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.get('/', async (c) => {
    const url = new URL(c.req.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(
      Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10)),
      100
    )
    const search = normalizeOptionalSearchParam(url.searchParams.get('search'))
    const contractStatus = normalizeOptionalSearchParam(
      url.searchParams.get('contractStatus')
    )
    const hasActiveContract = normalizeBooleanQuery(
      url.searchParams.get('hasActiveContract')
    )
    const buildingId = normalizeOptionalSearchParam(url.searchParams.get('buildingId'))
    const sortField = normalizeSortField(url.searchParams.get('sortField'))
    const sortOrder = normalizeSortOrder(url.searchParams.get('sortOrder'))

    const result = await optimizedRenterQueries.findWithPagination(
      { page, limit },
      {
        search,
        contractStatus: contractStatus as any,
        hasActiveContract,
        buildingId,
      },
      {
        field: sortField,
        order: sortOrder,
      }
    )

    return jsonSuccess(c, {
      data: {
        renters: result.data.map(toClientRenter),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
      env,
    })
  })

  appendRentersFallback(routeApp, env)

  return routeApp
}
