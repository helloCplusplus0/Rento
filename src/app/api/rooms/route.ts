import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const ROOMS_FORMAL_HOST = 'server/routes/rooms.ts'
const ROOMS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/rooms/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-07 起 `/api/rooms` 的正式列表、创建与批量状态更新统一收口到 `server/routes/rooms.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护第二套房源主链逻辑。
 */
async function handleRoomsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'rooms-api',
    migrationHost: ROOMS_FORMAL_HOST,
    exitCondition: ROOMS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-07',
      compatReason:
        'rooms 列表、创建与批量状态更新已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleRoomsCompatProxy
export const POST = handleRoomsCompatProxy
export const PATCH = handleRoomsCompatProxy
