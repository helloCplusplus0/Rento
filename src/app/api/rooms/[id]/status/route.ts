import { NextRequest } from 'next/server'
import { roomQueries } from '@/lib/queries'
import type { RoomStatus } from '@prisma/client'

/**
 * 更新房间状态API
 * PATCH /api/rooms/[id]/status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json()
    
    // 验证状态值
    const validStatuses: RoomStatus[] = ['VACANT', 'OCCUPIED', 'OVERDUE', 'MAINTENANCE']
    if (!validStatuses.includes(status)) {
      return Response.json(
        { error: 'Invalid room status' },
        { status: 400 }
      )
    }
    
    // 更新房间状态
    const updatedRoom = await roomQueries.update(id, { status })
    
    if (!updatedRoom) {
      return Response.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    
    // 转换 Decimal 类型为 number
    const roomData = {
      ...updatedRoom,
      rent: Number(updatedRoom.rent),
      area: updatedRoom.area ? Number(updatedRoom.area) : null,
      building: {
        ...updatedRoom.building,
        totalRooms: Number(updatedRoom.building.totalRooms)
      }
    }
    
    return Response.json(roomData)
  } catch (error) {
    console.error('Failed to update room status:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}