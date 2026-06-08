import {
  createRenterPageClosureData,
  deleteRenterPageClosureData,
  getRenterDetailPageClosureData,
  getRenterStatsPageClosureData,
  getRentersPageClosureData,
  type RenterMutationPayload,
  updateRenterPageClosureData,
} from '@/lib/page-closure-compat/renters'

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
    'phase13-04 页面闭环期间，Hono 与 Next 入口共同复用 shared page-closure compat helper；这不等于 `/api/renters*` 已完成 phase14 正式 cutover。',
  exitCondition:
    '待 phase13 页面闭环、phase14 `/api/renters*` drain 与最终 cutover 审核完成后，再评估 shared compat helper 与旧入口退出。',
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
          'phase13-04 仅为 Minix 页面闭环补 page-closure bridge；`/api/renters*` 的正式 drain 仍留给 phase14 与最终 cutover 审核。',
        {
            phase: 'phase13-04',
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

  // Minix page-closure bridge: keep Hono runtime usable for phase13 pages
  // without declaring `/api/renters*` formal ownership ahead of phase14.
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

    const result = await getRentersPageClosureData({
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
    const stats = await getRenterStatsPageClosureData()
    return c.json(stats)
  })

  routeApp.post('/', async (c) => {
    const body =
      (await readJsonBody<RenterMutationPayload>(c, {
        maxBytes: env.requestGovernance.maxRequestSize,
      })) ?? {}

    const result = await createRenterPageClosureData(body)

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
    const renter = await getRenterDetailPageClosureData(renterId)

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

    const result = await updateRenterPageClosureData(renterId, body)

    if ('error' in result) {
      return c.json({ error: result.error }, result.status)
    }

    return c.json(result.data)
  })

  routeApp.delete('/:id', async (c) => {
    const renterId = c.req.param('id')
    const result = await deleteRenterPageClosureData(renterId)

    if ('error' in result) {
      return c.json({ error: result.error }, result.status)
    }

    return c.json(result.data)
  })

  appendRentersFallback(routeApp, env)

  return routeApp
}
