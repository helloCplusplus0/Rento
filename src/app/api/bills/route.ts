import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const BILLS_FORMAL_HOST = 'server/routes/bills.ts'
const BILLS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/bills/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/bills` 的正式列表与手动创建语义统一收口到 `server/routes/bills.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护第二套账单查询、校验或写入逻辑。
 */
async function handleBillsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'bills-api',
    migrationHost: BILLS_FORMAL_HOST,
    exitCondition: BILLS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: 'bills 主链已完成统一 Hono 宿主 cutover，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleBillsCompatProxy
export const POST = handleBillsCompatProxy
