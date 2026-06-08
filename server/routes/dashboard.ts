import {
  getDashboardContractAlertsData,
  getDashboardLeavingTenantsData,
  getDashboardOverduePaymentsData,
  getDashboardStatsData,
  getDashboardUnpaidRentData,
  getDashboardUpcomingContractsData,
  getDashboardVacantRoomsData,
} from '@/lib/dashboard-formal-host'

import type { AuthAppEnv } from '../lib/auth-context'
import { jsonSuccess } from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
import { Hono } from 'hono'

const DASHBOARD_HOST_STATE = {
  currentState: 'formal-host-with-legacy-compat',
  targetStrategy: 'phase14-06-dashboard-cutover',
  exitCondition:
    '当前端与存量调用均切换到统一 Hono dashboard 宿主后，旧 Next dashboard 路由可直接退出，只保留回滚基线。',
} as const

export function createDashboardRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.get('/stats', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardStatsData(),
      meta: {
        compatBoundary: DASHBOARD_HOST_STATE,
      },
      env,
    })
  )

  routeApp.get('/vacant-rooms', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardVacantRoomsData(),
      meta: {
        compatBoundary: DASHBOARD_HOST_STATE,
      },
      env,
    })
  )

  routeApp.get('/leaving-tenants', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardLeavingTenantsData(),
      meta: {
        compatBoundary: DASHBOARD_HOST_STATE,
      },
      env,
    })
  )

  routeApp.get('/upcoming-contracts', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardUpcomingContractsData(),
      meta: {
        compatBoundary: DASHBOARD_HOST_STATE,
      },
      env,
    })
  )

  routeApp.get('/contract-alerts', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardContractAlertsData(),
      meta: {
        compatBoundary: DASHBOARD_HOST_STATE,
      },
      env,
    })
  )

  routeApp.get('/overdue-payments', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardOverduePaymentsData(),
      meta: {
        compatBoundary: DASHBOARD_HOST_STATE,
      },
      env,
    })
  )

  routeApp.get('/unpaid-rent', async (c) =>
    jsonSuccess(c, {
      data: await getDashboardUnpaidRentData(),
      meta: {
        compatBoundary: DASHBOARD_HOST_STATE,
      },
      env,
    })
  )

  return routeApp
}
