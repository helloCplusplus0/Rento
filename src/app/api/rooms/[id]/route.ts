import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { prisma } from '@/lib/prisma'
import { roomQueries } from '@/lib/queries'
import { transformRoomDecimalFields } from '@/lib/room-utils'
import { performDeleteSafetyCheck } from '@/lib/validation'

/**
 * 删除房间API
 * DELETE /api/rooms/[id]
 */
async function handleDeleteRoom(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)

  if (
    searchParams.get('force') === 'true' ||
    searchParams.get('archive') === 'true'
  ) {
    return NextResponse.json(
      {
        error: 'Legacy delete overrides are no longer supported',
        code: 'ROOM_LEGACY_DELETE_OVERRIDE_DISABLED',
        details: {
          suggestion:
            '房间删除不再支持 force 或 archive 参数，请改用退租、归档、仪表停用或专用解绑流程',
        },
      },
      { status: 400 }
    )
  }

  const safetyCheck = await performDeleteSafetyCheck(id)

  if (!safetyCheck.canDelete) {
    return NextResponse.json(
      {
        error: 'Cannot delete room with related business history',
        code: safetyCheck.errorCode,
        details: {
          roomStatus: safetyCheck.roomStatus,
          contractCount: safetyCheck.contractCount,
          hasActiveContracts: safetyCheck.hasActiveContracts,
          activeContractCount: safetyCheck.activeContractCount,
          pendingContractCount: safetyCheck.pendingContractCount,
          billCount: safetyCheck.billCount,
          hasUnpaidBills: safetyCheck.hasUnpaidBills,
          unpaidBillCount: safetyCheck.unpaidBillCount,
          settledBillCount: safetyCheck.settledBillCount,
          meterCount: safetyCheck.meterCount,
          activeMeterCount: safetyCheck.activeMeterCount,
          inactiveMeterCount: safetyCheck.inactiveMeterCount,
          meterReadingCount: safetyCheck.meterReadingCount,
          billDetailCount: safetyCheck.billDetailCount,
          relatedDataTypes: safetyCheck.relatedDataTypes,
          blockingReasons: safetyCheck.blockingReasons,
        },
        suggestion: safetyCheck.suggestion,
      },
      { status: 400 }
    )
  }

  const result = await deleteRoomWithoutRelatedHistory(id)
  return NextResponse.json(result)
}

export const DELETE = withApiErrorHandler(handleDeleteRoom, {
  requireAuth: true,
  module: 'room-detail-api',
  errorType: ErrorType.VALIDATION_ERROR,
})

/**
 * 获取房间详情API
 * GET /api/rooms/[id]
 */
async function handleGetRoom(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const room = await roomQueries.findById(id)

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const roomData = transformRoomDecimalFields(room)
  return NextResponse.json(roomData)
}

export const GET = withApiErrorHandler(handleGetRoom, {
  requireAuth: true,
  module: 'room-detail-api',
  errorType: ErrorType.DATABASE_ERROR,
})

/**
 * 更新房间信息API
 * PUT /api/rooms/[id]
 */
async function handlePutRoom(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const requestData = await request.json()

  const existingRoom = await roomQueries.findById(id)
  if (!existingRoom) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const updateData: {
    roomNumber?: string
    floorNumber?: number
    roomType?: 'SHARED' | 'WHOLE' | 'SINGLE'
    area?: number
    rent?: number
    status?: any
    currentRenter?: string
    overdueDays?: number
  } = {}

  if (requestData.roomNumber !== undefined) {
    updateData.roomNumber = requestData.roomNumber
  }
  if (requestData.floorNumber !== undefined) {
    updateData.floorNumber = requestData.floorNumber
  }
  if (requestData.roomType !== undefined) {
    updateData.roomType = requestData.roomType
  }
  if (requestData.area !== undefined) {
    updateData.area = requestData.area
  }
  if (requestData.rent !== undefined) {
    updateData.rent = requestData.rent
  }
  if (requestData.status !== undefined) {
    updateData.status = requestData.status
  }
  if (requestData.currentRenter !== undefined) {
    updateData.currentRenter = requestData.currentRenter
  }
  if (requestData.overdueDays !== undefined) {
    updateData.overdueDays = requestData.overdueDays
  }

  if (
    updateData.roomNumber &&
    updateData.roomNumber !== existingRoom.roomNumber
  ) {
    const duplicateRoom = await prisma.room.findFirst({
      where: {
        buildingId: existingRoom.buildingId,
        roomNumber: updateData.roomNumber,
        id: { not: id },
      },
    })

    if (duplicateRoom) {
      return NextResponse.json(
        { error: 'Room number already exists in this building' },
        { status: 409 }
      )
    }
  }

  const updatedRoom = await roomQueries.update(id, updateData)

  if (!updatedRoom) {
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    )
  }

  const roomData = transformRoomDecimalFields(updatedRoom)
  return NextResponse.json(roomData)
}

export const PUT = withApiErrorHandler(handlePutRoom, {
  requireAuth: true,
  module: 'room-detail-api',
  errorType: ErrorType.VALIDATION_ERROR,
})

/**
 * 仅在房间不存在主链历史时执行物理删除
 */
async function deleteRoomWithoutRelatedHistory(roomId: string) {
  return prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        buildingId: true,
      },
    })

    if (!room) {
      throw new Error('Room not found')
    }

    await tx.room.delete({ where: { id: roomId } })

    await tx.building.update({
      where: { id: room.buildingId },
      data: { totalRooms: { decrement: 1 } },
    })

    return {
      success: true,
      action: 'hard_delete',
      message: '房间无合同、账单、仪表或抄表历史，已执行物理删除',
      deletedRoomId: roomId,
    }
  })
}
