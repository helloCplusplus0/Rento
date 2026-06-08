import type { RenterMutationPayload } from '../lib/renters-route-service'
import {
  createRenter,
  deleteRenter,
  getRenterDetail,
  getRenterStats,
  listRenters,
  updateRenter,
} from '../lib/renters-route-service'

import type { AuthAppEnv } from '../lib/auth-context'
import { notImplementedError } from '../lib/api-errors'
import { jsonApiError, jsonSuccess, readJsonBody } from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
import { Hono } from 'hono'

const LEGACY_COMPAT = {
  currentState: 'compat-wrapper',
  targetStrategy: 'compat-wrapper',
  legacyPaths: [
    'src/app/api/renters/route.ts',
    'src/app/api/renters/[id]/route.ts',
    'src/app/api/renters/stats/route.ts',
  ] as const,
  reason:
    'phase14-06 起 renters 正式查询/写入语义统一收口到 `server/routes/renters.ts`；旧 Next 入口仅保留 compat proxy 与回滚基线。',
  exitCondition:
    '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 `src/app/api/renters*` compat proxy 可直接移除。',
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

function appendRentersFallback(
  routeApp: Hono<AuthAppEnv>,
  env: MinixServerEnv
) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        'phase14-06 已冻结 `server/routes/renters.ts` 为 renters 正式宿主；未命中的子路径继续保留为 compat/rollback-only。',
        {
          phase: 'phase14-06',
          routeKey: 'renters',
          migrationState: 'compat-wrapper',
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

    const result = await listRenters({
      page,
      limit,
      search,
      contractStatus,
      hasActiveContract,
      buildingId,
      sortField,
      sortOrder,
    })

    return jsonSuccess(c, {
      data: result,
      env,
    })
  })

  routeApp.get('/stats', async (c) => {
    const stats = await getRenterStats()
    return c.json(stats)
  })

  routeApp.post('/', async (c) => {
    const body =
      (await readJsonBody<RenterMutationPayload>(c, {
        maxBytes: env.requestGovernance.maxRequestSize,
      })) ?? {}

    const result = await createRenter(body, {
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    if ('error' in result) {
      return c.json({ error: result.error }, result.status)
    }

    return jsonSuccess(c, {
      data: result.data,
      message: result.message,
      status: result.status,
      env,
    })
  })

  routeApp.get('/:id', async (c) => {
    const renterId = c.req.param('id')
    const renter = await getRenterDetail(renterId)

    if (!renter) {
      return c.json({ error: 'Renter not found' }, 404)
    }

    return c.json(renter)
  })

  routeApp.put('/:id', async (c) => {
    const renterId = c.req.param('id')
    const body =
      (await readJsonBody<RenterMutationPayload>(c, {
        maxBytes: env.requestGovernance.maxRequestSize,
      })) ?? {}

    const result = await updateRenter(renterId, body, {
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    if ('error' in result) {
      return c.json({ error: result.error }, result.status)
    }

    return c.json(result.data)
  })

  routeApp.delete('/:id', async (c) => {
    const renterId = c.req.param('id')
    const result = await deleteRenter(renterId, {
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    if ('error' in result) {
      return c.json({ error: result.error }, result.status)
    }

    return c.json(result.data)
  })

  appendRentersFallback(routeApp, env)

  return routeApp
}
