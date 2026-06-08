import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const RENTERS_FORMAL_HOST = 'server/routes/renters.ts'
const RENTERS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/renters/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/renters` 的列表与创建语义统一收口到 `server/routes/renters.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护第二套查询、校验或写入逻辑。
 */
async function handleRentersCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'renters-api',
    migrationHost: RENTERS_FORMAL_HOST,
    exitCondition: RENTERS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason: 'renters 主链已完成统一 Hono 宿主 cutover，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleRentersCompatProxy
export const POST = handleRentersCompatProxy
