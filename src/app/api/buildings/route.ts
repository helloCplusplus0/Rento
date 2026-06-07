import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const BUILDINGS_FORMAL_HOST = 'server/routes/buildings.ts'
const BUILDINGS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/buildings/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase13-03 起 `/api/buildings` 的正式语义统一收口到 `server/routes/buildings.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护独立校验、查询或写入逻辑。
 */
async function handleBuildingsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'buildings-api',
    migrationHost: BUILDINGS_FORMAL_HOST,
    exitCondition: BUILDINGS_EXIT_CONDITION,
  })
}

export const GET = handleBuildingsCompatProxy
export const POST = handleBuildingsCompatProxy
