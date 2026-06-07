import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const BUILDING_DETAIL_FORMAL_HOST = 'server/routes/buildings.ts'
const BUILDING_DETAIL_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/buildings/[id]/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase13-03 起 `/api/buildings/:id` 的详情、编辑与删除语义统一收口到 `server/routes/buildings.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护独立查询、校验或删除门禁。
 */
async function handleBuildingDetailCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'building-detail-api',
    migrationHost: BUILDING_DETAIL_FORMAL_HOST,
    exitCondition: BUILDING_DETAIL_EXIT_CONDITION,
  })
}

export const GET = handleBuildingDetailCompatProxy
export const PUT = handleBuildingDetailCompatProxy
export const DELETE = handleBuildingDetailCompatProxy
