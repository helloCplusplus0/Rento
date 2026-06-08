import {
  getDashboardContractAlertsPageClosureData,
  getDashboardLeavingTenantsPageClosureData,
  getDashboardStatsPageClosureData,
  getDashboardUpcomingContractsPageClosureData,
  getDashboardVacantRoomsPageClosureData,
} from '@/lib/page-closure-compat/dashboard'

import type { AuthAppEnv } from '../lib/auth-context'
import { jsonSuccess } from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
import { Hono } from 'hono'

const DASHBOARD_COMPAT = {
  currentState: 'retained-legacy-bridge',
  targetStrategy: 'phase13-page-closure-bridge',
  exitCondition:
    '待后续阶段统一处理 dashboard 查询宿主与读模型切流时，再评估是否迁入正式 Hono 读路径或归档旧入口。',
} as const

export function createDashboardRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.get('/stats', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardStatsPageClosureData(),
      meta: {
        compatBoundary: DASHBOARD_COMPAT,
      },
      env,
    })
  )

  routeApp.get('/vacant-rooms', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardVacantRoomsPageClosureData(),
      meta: {
        compatBoundary: DASHBOARD_COMPAT,
      },
      env,
    })
  )

  routeApp.get('/leaving-tenants', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardLeavingTenantsPageClosureData(),
      meta: {
        compatBoundary: DASHBOARD_COMPAT,
      },
      env,
    })
  )

  routeApp.get('/upcoming-contracts', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardUpcomingContractsPageClosureData(),
      meta: {
        compatBoundary: DASHBOARD_COMPAT,
      },
      env,
    })
  )

  routeApp.get('/contract-alerts', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardContractAlertsPageClosureData(),
      meta: {
        compatBoundary: DASHBOARD_COMPAT,
      },
      env,
    })
  )

  return routeApp
}
