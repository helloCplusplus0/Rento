import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { prisma } from '@/lib/prisma'
import { roomQueries } from '@/lib/queries'
import { transformRoomDecimalFields } from '@/lib/room-utils'
import { performDeleteSafetyCheck } from '@/lib/validation'

/**
 * 删除房间API（支持级联删除）
 * DELETE /api/rooms/[id]
 */
async function handleDeleteRoom(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const force = searchParams.get('force') === 'true'
  const archive = searchParams.get('archive') === 'true'

  const safetyCheck = await performDeleteSafetyCheck(id)

  if (safetyCheck.hasRelatedData && !force) {
    return NextResponse.json(
      {
        error: 'Cannot delete room with related data',
        details: {
          hasActiveContracts: safetyCheck.hasActiveContracts,
          activeContractCount: safetyCheck.activeContractCount,
          hasUnpaidBills: safetyCheck.hasUnpaidBills,
          unpaidBillCount: safetyCheck.unpaidBillCount,
          relatedDataTypes: safetyCheck.relatedDataTypes,
        },
        suggestion:
          'Use force=true parameter to force delete or archive=true to archive related data',
      },
      { status: 400 }
    )
  }

  const result = await cascadeDeleteRoom(id, { force, archiveData: archive })
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
 * 级联删除房间
 */
async function cascadeDeleteRoom(
  roomId: string,
  options: { force?: boolean; archiveData?: boolean } = {}
) {
  return prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({
      where: { id: roomId },
      include: {
        contracts: {
          include: {
            bills: true,
          },
        },
      },
    })

    if (!room) {
      throw new Error('Room not found')
    }

    let archivedContracts = 0
    let archivedBills = 0

    for (const contract of room.contracts) {
      if (options.archiveData) {
        await tx.bill.updateMany({
          where: { contractId: contract.id },
          data: { status: 'COMPLETED' },
        })
        archivedBills += contract.bills.length

        await tx.contract.update({
          where: { id: contract.id },
          data: { status: 'TERMINATED' },
        })
        archivedContracts += 1
      } else {
        await tx.bill.deleteMany({
          where: { contractId: contract.id },
        })

        await tx.contract.delete({
          where: { id: contract.id },
        })
      }
    }

    await tx.room.delete({ where: { id: roomId } })

    await tx.building.update({
      where: { id: room.buildingId },
      data: { totalRooms: { decrement: 1 } },
    })

    return {
      success: true,
      deletedRoomId: roomId,
      archivedData: options.archiveData || false,
      affectedRecords: {
        contracts: archivedContracts,
        bills: archivedBills,
      },
    }
  })
}
