import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const CONTRACT_ACTIVATE_FORMAL_HOST = 'server/routes/contracts.ts'
const CONTRACT_ACTIVATE_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/contracts/activate/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/contracts/activate` 的正式生命周期语义统一收口到 `server/routes/contracts.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护独立激活逻辑。
 */
async function handleContractActivateCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'contract-activate-api',
    migrationHost: CONTRACT_ACTIVATE_FORMAL_HOST,
    exitCondition: CONTRACT_ACTIVATE_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: '合同激活已由统一 Hono 宿主承担正式职责，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const POST = handleContractActivateCompatProxy
