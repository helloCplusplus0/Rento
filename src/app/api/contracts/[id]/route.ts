import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const CONTRACT_DETAIL_FORMAL_HOST = 'server/routes/contracts.ts'
const CONTRACT_DETAIL_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/contracts/[id]/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/contracts/:id` 的详情、编辑与删除门禁统一收口到 `server/routes/contracts.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护第二套详情查询、编辑逻辑或删除门禁。
 */
async function handleContractDetailCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'contract-detail-api',
    migrationHost: CONTRACT_DETAIL_FORMAL_HOST,
    exitCondition: CONTRACT_DETAIL_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: 'contracts 详情主链已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleContractDetailCompatProxy
export const PUT = handleContractDetailCompatProxy
export const DELETE = handleContractDetailCompatProxy
