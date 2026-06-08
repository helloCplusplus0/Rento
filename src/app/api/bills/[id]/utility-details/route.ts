import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const BILL_UTILITY_DETAILS_FORMAL_HOST = 'server/routes/bills.ts'
const BILL_UTILITY_DETAILS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/bills/[id]/utility-details/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-07 起 `/api/bills/:id/utility-details` 的正式读取统一收口到 `server/routes/bills.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护独立 utility 详情拼装逻辑。
 */
async function handleBillUtilityDetailsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'bill-utility-details-api',
    migrationHost: BILL_UTILITY_DETAILS_FORMAL_HOST,
    exitCondition: BILL_UTILITY_DETAILS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-07',
      compatReason:
        '账单 utility details 读取已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleBillUtilityDetailsCompatProxy
