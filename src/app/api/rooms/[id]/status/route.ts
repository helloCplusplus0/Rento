import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const ROOM_STATUS_FORMAL_HOST = 'server/routes/rooms.ts'
const ROOM_STATUS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/rooms/[id]/status/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/rooms/:id/status` 的正式房态更新统一收口到 `server/routes/rooms.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护独立房态更新逻辑。
 */
async function handleRoomStatusCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'room-status-api',
    migrationHost: ROOM_STATUS_FORMAL_HOST,
    exitCondition: ROOM_STATUS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: 'rooms 房态更新已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const PATCH = handleRoomStatusCompatProxy
