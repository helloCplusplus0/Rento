import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const BILL_DETAIL_FORMAL_HOST = 'server/routes/bills.ts'
const BILL_DETAIL_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/bills/[id]/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/bills/:id` 的详情、草稿更新与删除门禁统一收口到 `server/routes/bills.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护第二套账务读取或写路径。
 */
async function handleBillDetailCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'bill-detail-api',
    migrationHost: BILL_DETAIL_FORMAL_HOST,
    exitCondition: BILL_DETAIL_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: '账单详情主链已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleBillDetailCompatProxy
export const PATCH = handleBillDetailCompatProxy
export const DELETE = handleBillDetailCompatProxy
