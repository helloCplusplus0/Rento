import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const RENTER_STATS_FORMAL_HOST = 'server/routes/renters.ts'
const RENTER_STATS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/renters/stats/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/renters/stats` 的统计读取统一收口到 `server/routes/renters.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护 shared compat helper。
 */
async function handleRenterStatsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'renter-stats-api',
    migrationHost: RENTER_STATS_FORMAL_HOST,
    exitCondition: RENTER_STATS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason: 'renters stats 读取已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleRenterStatsCompatProxy
