import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const ROOM_BATCH_FORMAL_HOST = 'server/routes/rooms.ts'
const ROOM_BATCH_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/rooms/batch/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/rooms/batch` 的正式批量创建语义统一收口到 `server/routes/rooms.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护独立批量创建逻辑。
 */
async function handleRoomBatchCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'rooms-batch-api',
    migrationHost: ROOM_BATCH_FORMAL_HOST,
    exitCondition: ROOM_BATCH_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: 'rooms 批量创建主链已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const POST = handleRoomBatchCompatProxy
