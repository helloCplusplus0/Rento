import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const BILL_STATS_FORMAL_HOST = 'server/routes/bills.ts'
const BILL_STATS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/bills/stats/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/bills/stats` 的正式统计读取统一收口到 `server/routes/bills.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护 page-to-legacy bridge。
 */
async function handleBillStatsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'bill-stats-api',
    migrationHost: BILL_STATS_FORMAL_HOST,
    exitCondition: BILL_STATS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: '账单统计读取已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleBillStatsCompatProxy
