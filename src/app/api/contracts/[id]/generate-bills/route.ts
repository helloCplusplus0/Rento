import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const CONTRACT_GENERATE_BILLS_FORMAL_HOST = 'server/routes/contracts.ts'
const CONTRACT_GENERATE_BILLS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/contracts/[id]/generate-bills/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/contracts/:id/generate-bills` 的正式补账单语义统一收口到 `server/routes/contracts.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护独立补账单编排。
 */
async function handleContractGenerateBillsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'contract-generate-bills-api',
    migrationHost: CONTRACT_GENERATE_BILLS_FORMAL_HOST,
    exitCondition: CONTRACT_GENERATE_BILLS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: '合同补账单主链已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const POST = handleContractGenerateBillsCompatProxy
