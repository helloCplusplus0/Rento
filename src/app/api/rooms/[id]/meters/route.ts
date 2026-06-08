import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const ROOM_METERS_FORMAL_HOST = 'server/routes/rooms.ts'
const ROOM_METERS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/rooms/[id]/meters/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/rooms/:id/meters` 的正式仪表列表与新增语义统一收口到 `server/routes/rooms.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护独立房间仪表查询或写入逻辑。
 */
async function handleRoomMetersCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'room-meters-api',
    migrationHost: ROOM_METERS_FORMAL_HOST,
    exitCondition: ROOM_METERS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: 'rooms 仪表主链已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleRoomMetersCompatProxy
export const POST = handleRoomMetersCompatProxy
