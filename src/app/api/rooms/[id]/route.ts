import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import {
  deleteRoomWithoutRelatedHistory,
  isRoomDeleteGuardBlockedError,
  performRoomBuildingReassignmentSafetyCheck,
  performRoomDeleteSafetyCheck,
} from '@/lib/domain/delete-guards'
import { ErrorType } from '@/lib/error-logger'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { prisma } from '@/lib/prisma'
import { buildingQueries, roomQueries } from '@/lib/queries'
import { transformRoomDecimalFields } from '@/lib/room-utils'

/**
 * 删除房间API
 * DELETE /api/rooms/[id]
 *
 * compat wrapper:
 * phase09-02 起房间删除门禁与受控物理删除统一收口到 src/lib/domain/delete-guards，
 * 当前 Next 入口只保留旧调用兼容层，不再维护第二套删除规则。
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

  const safetyCheck = await performRoomDeleteSafetyCheck(id)

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

  let result

  try {
    result = await deleteRoomWithoutRelatedHistory(id)
  } catch (error) {
    if (isRoomDeleteGuardBlockedError(error)) {
      return NextResponse.json(
        {
          error: 'Cannot delete room with related business history',
          code: error.details.errorCode,
          details: {
            roomStatus: error.details.roomStatus,
            contractCount: error.details.contractCount,
            hasActiveContracts: error.details.hasActiveContracts,
            activeContractCount: error.details.activeContractCount,
            pendingContractCount: error.details.pendingContractCount,
            billCount: error.details.billCount,
            hasUnpaidBills: error.details.hasUnpaidBills,
            unpaidBillCount: error.details.unpaidBillCount,
            settledBillCount: error.details.settledBillCount,
            meterCount: error.details.meterCount,
            activeMeterCount: error.details.activeMeterCount,
            inactiveMeterCount: error.details.inactiveMeterCount,
            meterReadingCount: error.details.meterReadingCount,
            billDetailCount: error.details.billDetailCount,
            relatedDataTypes: error.details.relatedDataTypes,
            blockingReasons: error.details.blockingReasons,
          },
          suggestion: error.details.suggestion,
        },
        { status: 400 }
      )
    }

    throw error
  }

  await revalidateMutationPaths({
    scopes: ['dashboard', 'rooms', 'contracts'],
    detailPaths: [`/rooms/${id}`],
  })

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
    buildingId?: string
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
  if (requestData.buildingId !== undefined) {
    updateData.buildingId = String(requestData.buildingId).trim()
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

  const targetBuildingId = updateData.buildingId ?? existingRoom.buildingId

  if (updateData.buildingId !== undefined) {
    if (!updateData.buildingId) {
      return NextResponse.json({ error: '楼栋ID不能为空' }, { status: 400 })
    }

    if (updateData.buildingId !== existingRoom.buildingId) {
      const building = await buildingQueries.findById(updateData.buildingId)
      if (!building) {
        return NextResponse.json({ error: '楼栋不存在' }, { status: 404 })
      }

      const reassignmentSafetyCheck =
        await performRoomBuildingReassignmentSafetyCheck(
          id,
          updateData.buildingId
        )

      if (!reassignmentSafetyCheck.canReassign) {
        return NextResponse.json(
          {
            error:
              'Cannot reassign room to another building with related business history',
            code: reassignmentSafetyCheck.errorCode,
            details: {
              currentBuildingId: reassignmentSafetyCheck.currentBuildingId,
              targetBuildingId: reassignmentSafetyCheck.targetBuildingId,
              contractCount: reassignmentSafetyCheck.contractCount,
              billCount: reassignmentSafetyCheck.billCount,
              meterCount: reassignmentSafetyCheck.meterCount,
              meterReadingCount: reassignmentSafetyCheck.meterReadingCount,
              billDetailCount: reassignmentSafetyCheck.billDetailCount,
              relatedDataTypes: reassignmentSafetyCheck.relatedDataTypes,
              blockingReasons: reassignmentSafetyCheck.blockingReasons,
            },
            suggestion: reassignmentSafetyCheck.suggestion,
          },
          { status: 400 }
        )
      }
    }
  }

  if (
    updateData.roomNumber &&
    (updateData.roomNumber !== existingRoom.roomNumber ||
      targetBuildingId !== existingRoom.buildingId)
  ) {
    const duplicateRoom = await prisma.room.findFirst({
      where: {
        buildingId: targetBuildingId,
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

  await revalidateMutationPaths({
    scopes: ['dashboard', 'rooms', 'contracts'],
    detailPaths: [`/rooms/${id}`],
  })

  return NextResponse.json(roomData)
}

export const PUT = withApiErrorHandler(handlePutRoom, {
  requireAuth: true,
  module: 'room-detail-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
