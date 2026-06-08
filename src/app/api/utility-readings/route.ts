import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const UTILITY_READINGS_FORMAL_HOST = 'server/routes/utility-readings.ts'
const UTILITY_READINGS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/utility-readings/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/utility-readings` 的历史兼容读写统一收口到 `server/routes/utility-readings.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再直接执行 utility 账单逻辑。
 */
async function handleUtilityReadingsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'utility-readings-api',
    migrationHost: UTILITY_READINGS_FORMAL_HOST,
    exitCondition: UTILITY_READINGS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason: 'utility 历史兼容读写已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleUtilityReadingsCompatProxy
export const POST = handleUtilityReadingsCompatProxy
