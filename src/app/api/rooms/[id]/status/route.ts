import { NextRequest, NextResponse } from 'next/server'
import type { RoomStatus } from '@prisma/client'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { roomQueries } from '@/lib/queries'

/**
 * 更新房间状态API
 * PATCH /api/rooms/[id]/status
 */
async function handlePatchRoomStatus(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await request.json()

  const validStatuses: RoomStatus[] = [
    'VACANT',
    'OCCUPIED',
    'OVERDUE',
    'MAINTENANCE',
  ]
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid room status' }, { status: 400 })
  }

  const updatedRoom = await roomQueries.update(id, { status })

  if (!updatedRoom) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const roomData = {
    ...updatedRoom,
    rent: Number(updatedRoom.rent),
    area: updatedRoom.area ? Number(updatedRoom.area) : null,
    building: {
      ...updatedRoom.building,
      totalRooms: Number(updatedRoom.building.totalRooms),
    },
  }

  return NextResponse.json(roomData)
}

export const PATCH = withApiErrorHandler(handlePatchRoomStatus, {
  requireAuth: true,
  module: 'room-status-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
