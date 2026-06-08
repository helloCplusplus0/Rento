import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const CONTRACTS_FORMAL_HOST = 'server/routes/contracts.ts'
const CONTRACTS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/contracts/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/contracts` 的正式列表与创建语义统一收口到 `server/routes/contracts.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护第二套查询、校验或创建事务逻辑。
 */
async function handleContractsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'contracts-api',
    migrationHost: CONTRACTS_FORMAL_HOST,
    exitCondition: CONTRACTS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: 'contracts 主链已完成统一 Hono 宿主 cutover，旧 Next 路由仅保留回滚基线与兼容代理。',
    },
  })
}

export const GET = handleContractsCompatProxy
export const POST = handleContractsCompatProxy
