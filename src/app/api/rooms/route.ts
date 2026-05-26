import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { optimizedRoomQueries } from '@/lib/optimized-queries'
import { roomQueries } from '@/lib/queries'
import {
  formatBatchUpdateResponse,
  formatRoomSearchResponse,
  parseRoomQueryParams,
  transformRoomDecimalFields,
} from '@/lib/room-utils'
import {
  roomValidationRules,
  validateBusinessRules,
  validateRoomData,
} from '@/lib/validation'

/**
 * 获取房间列表API（支持搜索筛选）
 * GET /api/rooms
 */
async function handleGetRooms(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // 检查是否需要包含仪表信息
  const includeMeters = searchParams.get('includeMeters') === 'true'

  if (includeMeters) {
    const now = new Date()
    const rooms = await optimizedRoomQueries.findWithMeters()

    const roomsWithMeters = rooms.map((room) => {
      const activeContract =
        room.contracts.find(
          (contract: any) =>
            contract.status === 'ACTIVE' &&
            now >= new Date(contract.startDate) &&
            now <= new Date(contract.endDate)
        ) || null

      const metersData = room.meters.map((meter: any) => ({
        id: meter.id,
        displayName: meter.displayName,
        meterType: meter.meterType,
        unitPrice: Number(meter.unitPrice),
        unit: meter.unit,
        location: meter.location,
        isActive: meter.isActive,
        lastReading:
          meter.readings.length > 0
            ? Number(meter.readings[0].currentReading)
            : 0,
        lastReadingDate:
          meter.readings.length > 0 ? meter.readings[0].readingDate : null,
        contractId: activeContract?.id || null,
        contractNumber: activeContract?.contractNumber || null,
        renterName: activeContract?.renter?.name || null,
        contractStatus: activeContract?.status || null,
      }))

      return {
        ...room,
        rent: Number(room.rent),
        area: room.area ? Number(room.area) : null,
        building: {
          ...room.building,
          totalRooms: Number(room.building.totalRooms),
        },
        meters: metersData,
        activeContract: activeContract
          ? {
              id: activeContract.id,
              contractNumber: activeContract.contractNumber,
              renter: activeContract.renter,
              startDate: activeContract.startDate,
              endDate: activeContract.endDate,
              status: activeContract.status,
            }
          : null,
      }
    })

    return NextResponse.json(roomsWithMeters)
  }

  const params = parseRoomQueryParams(searchParams)
  const result = await roomQueries.searchRooms(params)

  const response = formatRoomSearchResponse({
    rooms: result.rooms,
    total: result.pagination.total,
    page: result.pagination.page,
    limit: result.pagination.limit,
    aggregations: result.aggregations,
  })

  return NextResponse.json(response)
}

export const GET = withApiErrorHandler(handleGetRooms, {
  requireAuth: true,
  module: 'rooms-api',
  errorType: ErrorType.DATABASE_ERROR,
})

/**
 * 创建房间API
 * POST /api/rooms
 */
async function handlePostRooms(request: NextRequest) {
  const validationRequest = request.clone() as NextRequest
  const validationError = await validateRoomData(roomValidationRules)(
    validationRequest
  )
  if (validationError) {
    return NextResponse.json(await validationError.json(), {
      status: validationError.status,
    })
  }

  const roomData = await request.json()

  const businessError = await validateBusinessRules()(request, roomData)
  if (businessError) {
    return NextResponse.json(await businessError.json(), {
      status: businessError.status,
    })
  }

  const newRoom = await roomQueries.create(roomData)
  const transformedRoom = transformRoomDecimalFields(newRoom)

  await revalidateMutationPaths({
    scopes: ['dashboard', 'rooms'],
    detailPaths: [`/rooms/${newRoom.id}`],
  })

  return NextResponse.json(transformedRoom, { status: 201 })
}

export const POST = withApiErrorHandler(handlePostRooms, {
  requireAuth: true,
  module: 'rooms-api',
  errorType: ErrorType.VALIDATION_ERROR,
})

/**
 * 批量更新房间状态API
 * PATCH /api/rooms
 */
async function handlePatchRooms(request: NextRequest) {
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

  return NextResponse.json(response)
}

export const PATCH = withApiErrorHandler(handlePatchRooms, {
  requireAuth: true,
  module: 'rooms-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
