import { NextRequest, NextResponse } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'
import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'

const ROOMS_FORMAL_HOST = 'server/routes/rooms.ts'
const ROOMS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/rooms/route.ts 的 GET/POST 可直接移除；批量状态更新待后续独立收口。'

/**
 * compat wrapper:
 * phase14-05 起 `/api/rooms` 的正式列表与创建语义统一收口到 `server/routes/rooms.ts`。
 * 旧 Next 入口的 GET/POST 仅保留为薄 compat wrapper，不再维护第二套查询或创建逻辑。
 * `PATCH /api/rooms` 的批量状态更新暂未进入本波次 cutover，仍保留旧实现。
 */
async function handleRoomsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'rooms-api',
    migrationHost: ROOMS_FORMAL_HOST,
    exitCondition: ROOMS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-05',
      compatReason: 'rooms 列表与创建主链已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleRoomsCompatProxy
export const POST = handleRoomsCompatProxy

/**
 * rollback-only:
 * `/api/rooms` 的批量状态更新尚未迁入 `server/routes/rooms.ts`，因此继续保留旧实现作为本波次之外的存量入口。
 */
async function handlePatchRooms(request: NextRequest) {
  const { roomQueries } = await import('@/lib/queries')
  const { formatBatchUpdateResponse } = await import('@/lib/room-utils')
  const { revalidateMutationPaths } = await import('@/lib/mutation-revalidation')

  const body = await request.json()
  const { roomIds, status, operator } = body

  if (!Array.isArray(roomIds) || roomIds.length === 0) {
    return NextResponse.json(
      { error: 'Room IDs must be a non-empty array' },
      { status: 400 }
    )
  }

  if (!['VACANT', 'OCCUPIED', 'OVERDUE', 'MAINTENANCE'].includes(status)) {
    return NextResponse.json({ error: 'Invalid room status' }, { status: 400 })
  }

  if (roomIds.length > 100) {
    return NextResponse.json(
      { error: 'Cannot update more than 100 rooms at once' },
      { status: 400 }
    )
  }

  const result = await roomQueries.batchUpdateStatus(roomIds, status, operator)
  const response = formatBatchUpdateResponse(result)

  await revalidateMutationPaths({
    scopes: ['dashboard', 'rooms', 'contracts'],
  })

  return NextResponse.json({
    ...response,
    rollbackOnly: true,
    migrationHost: 'src/app/api/rooms/route.ts',
  })
}

export const PATCH = withApiErrorHandler(handlePatchRooms, {
  requireAuth: true,
  module: 'rooms-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
