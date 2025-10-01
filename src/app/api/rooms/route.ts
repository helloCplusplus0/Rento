import { NextRequest } from 'next/server'

import { meterQueries, roomQueries } from '@/lib/queries'
import {
  formatBatchUpdateResponse,
  formatRoomSearchResponse,
  parseRoomQueryParams,
  transformRoomDecimalFields,
} from '@/lib/room-utils'
import {
  roomValidationRules,
  validateBatchUpdateData,
  validateBusinessRules,
  validateRoomData,
} from '@/lib/validation'

/**
 * 获取房间列表API（支持搜索筛选）
 * GET /api/rooms
 *
 * 查询参数:
 * - search: 关键词搜索
 * - buildingIds: 楼栋ID列表（逗号分隔）
 * - floorNumbers: 楼层号列表（逗号分隔）
 * - statuses: 状态列表（逗号分隔）
 * - roomTypes: 房间类型列表（逗号分隔）
 * - rentRange: 租金范围（逗号分隔，如：1000,3000）
 * - areaRange: 面积范围（逗号分隔，如：20,50）
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20，最大100）
 * - sortBy: 排序字段（默认roomNumber）
 * - sortOrder: 排序顺序（asc/desc，默认asc）
 * - includeMeters: 是否包含仪表信息（true/false）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 检查是否需要包含仪表信息
    const includeMeters = searchParams.get('includeMeters') === 'true'

    if (includeMeters) {
      // 获取所有房间及其仪表信息和有效合同
      const rooms = await roomQueries.findAll()

      // 为每个房间加载仪表数据和有效合同
      const roomsWithMeters = await Promise.all(
        rooms.map(async (room) => {
          try {
            // 直接使用meterQueries获取仪表数据
            const meters = await meterQueries.findByRoom(room.id)

            // 获取房间的有效合同（状态为ACTIVE且在有效期内）
            const activeContract = room.contracts.find(
              (contract) =>
                contract.status === 'ACTIVE' &&
                new Date() >= new Date(contract.startDate) &&
                new Date() <= new Date(contract.endDate)
            )

            // 转换仪表数据格式
            const metersData = meters.map((meter: any) => ({
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
                meter.readings.length > 0
                  ? meter.readings[0].readingDate
                  : null,
              // 优化：关联的有效合同ID和详细信息
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
              // 新增：有效合同信息
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
          } catch (error) {
            console.error(`Failed to load meters for room ${room.id}:`, error)
            return {
              ...room,
              rent: Number(room.rent),
              area: room.area ? Number(room.area) : null,
              building: {
                ...room.building,
                totalRooms: Number(room.building.totalRooms),
              },
              meters: [],
              activeContract: null,
            }
          }
        })
      )

      return Response.json(roomsWithMeters)
    }

    // 原有的搜索逻辑
    const params = parseRoomQueryParams(searchParams)
    const result = await roomQueries.searchRooms(params)

    const response = formatRoomSearchResponse({
      rooms: result.rooms,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      aggregations: result.aggregations,
    })

    return Response.json(response)
  } catch (error) {
    console.error('Failed to search rooms:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * 创建房间API
 * POST /api/rooms
 *
 * 请求体:
 * {
 *   "roomNumber": "101",
 *   "floorNumber": 1,
 *   "buildingId": "building-id",
 *   "roomType": "SHARED",
 *   "area": 25,
 *   "rent": 1500
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 数据验证
    const validationError = await validateRoomData(roomValidationRules)(request)
    if (validationError) return validationError

    const roomData = await request.json()

    // 业务规则验证
    const businessError = await validateBusinessRules()(request, roomData)
    if (businessError) return businessError

    // 创建房间
    const newRoom = await roomQueries.create(roomData)

    // 转换 Decimal 类型
    const transformedRoom = transformRoomDecimalFields(newRoom)

    return Response.json(transformedRoom, { status: 201 })
  } catch (error) {
    console.error('Failed to create room:', error)

    // 检查是否是数据库约束错误
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return Response.json(
        { error: 'Room number already exists in this building' },
        { status: 409 }
      )
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * 批量更新房间状态API
 * PATCH /api/rooms
 *
 * 请求体:
 * {
 *   "roomIds": ["room-id-1", "room-id-2"],
 *   "status": "VACANT",
 *   "operator": "admin"
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // 先获取请求体数据
    const body = await request.json()
    const { roomIds, status, operator } = body

    // 基础验证
    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      return Response.json(
        { error: 'Room IDs must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!['VACANT', 'OCCUPIED', 'OVERDUE', 'MAINTENANCE'].includes(status)) {
      return Response.json({ error: 'Invalid room status' }, { status: 400 })
    }

    // 限制批量操作数量
    if (roomIds.length > 100) {
      return Response.json(
        { error: 'Cannot update more than 100 rooms at once' },
        { status: 400 }
      )
    }

    // 执行批量更新
    const result = await roomQueries.batchUpdateStatus(
      roomIds,
      status,
      operator
    )

    // 格式化响应
    const response = formatBatchUpdateResponse(result)

    return Response.json(response)
  } catch (error) {
    console.error('Failed to batch update rooms:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
