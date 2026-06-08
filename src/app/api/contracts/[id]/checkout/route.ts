import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const CONTRACT_CHECKOUT_FORMAL_HOST = 'server/routes/checkout.ts'
const CONTRACT_CHECKOUT_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/contracts/[id]/checkout/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/contracts/:id/checkout` 的正式退租结算事务统一收口到 `server/routes/checkout.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护独立结算编排、会话透传或缓存失效逻辑。
 */
async function handleContractCheckoutCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'checkout-contract-api',
    migrationHost: CONTRACT_CHECKOUT_FORMAL_HOST,
    exitCondition: CONTRACT_CHECKOUT_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: 'checkout 主链已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理与回滚基线。',
    },
  })
}

export const POST = handleContractCheckoutCompatProxy
