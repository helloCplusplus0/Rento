import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const RENTER_DETAIL_FORMAL_HOST = 'server/routes/renters.ts'
const RENTER_DETAIL_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/renters/[id]/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/renters/:id` 的详情、编辑与删除语义统一收口到 `server/routes/renters.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护第二套详情查询或编辑逻辑。
 */
async function handleRenterDetailCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'renter-detail-api',
    migrationHost: RENTER_DETAIL_FORMAL_HOST,
    exitCondition: RENTER_DETAIL_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason: 'renters 详情主链已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleRenterDetailCompatProxy
export const PUT = handleRenterDetailCompatProxy
export const DELETE = handleRenterDetailCompatProxy
