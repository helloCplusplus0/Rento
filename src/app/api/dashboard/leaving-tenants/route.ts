import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const DASHBOARD_FORMAL_HOST = 'server/routes/dashboard.ts'
const DASHBOARD_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono dashboard 宿主后，旧 src/app/api/dashboard/* 路由可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/dashboard/*` 的正式查询统一收口到 `server/routes/dashboard.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护独立 dashboard 查询实现。
 */
async function handleDashboardLeavingTenantsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'dashboard-leaving-tenants-api',
    migrationHost: DASHBOARD_FORMAL_HOST,
    exitCondition: DASHBOARD_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason: 'dashboard 离店提醒查询已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleDashboardLeavingTenantsCompatProxy
