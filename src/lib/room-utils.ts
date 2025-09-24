import type { RoomStatus } from '@prisma/client'

/**
 * 转换房间数据中的Decimal字段为number类型
 */
export function transformRoomDecimalFields(room: any): any {
  return {
    ...room,
    rent: Number(room.rent),
    area: room.area ? Number(room.area) : null,
    building: room.building ? {
      ...room.building,
      totalRooms: Number(room.building.totalRooms)
    } : undefined,
    contracts: room.contracts?.map((contract: any) => ({
      ...contract,
      monthlyRent: Number(contract.monthlyRent),
      totalRent: Number(contract.totalRent),
      deposit: Number(contract.deposit),
      keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
      cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
      bills: contract.bills?.map((bill: any) => ({
        ...bill,
        amount: Number(bill.amount),
        receivedAmount: Number(bill.receivedAmount),
        pendingAmount: Number(bill.pendingAmount)
      }))
    }))
  }
}

/**
 * 批量转换房间数据
 */
export function transformRoomsDecimalFields(rooms: any[]): any[] {
  return rooms.map(transformRoomDecimalFields)
}

/**
 * 解析房间查询参数
 */
export function parseRoomQueryParams(searchParams: URLSearchParams) {
  return {
    query: searchParams.get('search') || undefined,
    filters: {
      buildingIds: searchParams.get('buildingIds')?.split(',').filter(Boolean) || undefined,
      floorNumbers: searchParams.get('floorNumbers')?.split(',').map(Number).filter(n => !isNaN(n)) || undefined,
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean) as RoomStatus[] || undefined,
      roomTypes: searchParams.get('roomTypes')?.split(',').filter(Boolean) as ('SHARED' | 'WHOLE' | 'SINGLE')[] || undefined,
      rentRange: searchParams.get('rentRange')?.split(',').map(Number).filter(n => !isNaN(n)) as [number, number] || undefined,
      areaRange: searchParams.get('areaRange')?.split(',').map(Number).filter(n => !isNaN(n)) as [number, number] || undefined
    },
    pagination: {
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit: Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20')), 100)
    },
    sort: {
      field: searchParams.get('sortBy') || 'roomNumber',
      order: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
    }
  }
}

/**
 * 计算楼栋房间统计信息
 */
export function calculateBuildingRoomStats(rooms: any[]) {
  const floorMap = new Map<number, any[]>()
  
  // 按楼层分组
  rooms.forEach(room => {
    const floor = room.floorNumber
    if (!floorMap.has(floor)) {
      floorMap.set(floor, [])
    }
    floorMap.get(floor)!.push(room)
  })
  
  // 计算楼层统计
  const floorStats = Array.from(floorMap.entries()).map(([floor, floorRooms]) => ({
    floorNumber: floor,
    totalRooms: floorRooms.length,
    roomsByStatus: floorRooms.reduce((acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1
      return acc
    }, {} as Record<RoomStatus, number>)
  }))
  
  // 计算总体统计
  const statusCounts = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1
    return acc
  }, {} as Record<RoomStatus, number>)
  
  return {
    totalRooms: rooms.length,
    vacantRooms: statusCounts.VACANT || 0,
    occupiedRooms: statusCounts.OCCUPIED || 0,
    overdueRooms: statusCounts.OVERDUE || 0,
    maintenanceRooms: statusCounts.MAINTENANCE || 0,
    floorStats: floorStats.sort((a, b) => a.floorNumber - b.floorNumber)
  }
}

/**
 * 验证排序字段
 */
export function validateSortField(field: string): string {
  const validFields = ['roomNumber', 'floorNumber', 'rent', 'area', 'status', 'roomType', 'createdAt', 'updatedAt']
  return validFields.includes(field) ? field : 'roomNumber'
}

/**
 * 验证排序顺序
 */
export function validateSortOrder(order: string): 'asc' | 'desc' {
  return order === 'desc' ? 'desc' : 'asc'
}

/**
 * 构建房间搜索的WHERE条件
 */
export function buildRoomSearchWhere(params: {
  query?: string
  filters: {
    buildingIds?: string[]
    floorNumbers?: number[]
    statuses?: RoomStatus[]
    roomTypes?: ('SHARED' | 'WHOLE' | 'SINGLE')[]
    rentRange?: [number, number]
    areaRange?: [number, number]
  }
}) {
  const { query, filters } = params
  const where: any = {}
  
  // 构建搜索条件
  if (query) {
    where.OR = [
      { roomNumber: { contains: query } },
      { building: { name: { contains: query } } },
      { currentRenter: { contains: query } },
      {
        contracts: {
          some: {
            status: 'ACTIVE',
            renter: { name: { contains: query } }
          }
        }
      }
    ]
  }
  
  // 构建筛选条件
  if (filters.buildingIds?.length) {
    where.buildingId = { in: filters.buildingIds }
  }
  
  if (filters.floorNumbers?.length) {
    where.floorNumber = { in: filters.floorNumbers }
  }
  
  if (filters.statuses?.length) {
    where.status = { in: filters.statuses }
  }
  
  if (filters.roomTypes?.length) {
    where.roomType = { in: filters.roomTypes }
  }
  
  if (filters.rentRange && filters.rentRange.length === 2) {
    where.rent = {
      gte: filters.rentRange[0],
      lte: filters.rentRange[1]
    }
  }
  
  if (filters.areaRange && filters.areaRange.length === 2) {
    where.area = {
      gte: filters.areaRange[0],
      lte: filters.areaRange[1]
    }
  }
  
  return where
}

/**
 * 格式化房间搜索响应
 */
export function formatRoomSearchResponse(data: {
  rooms: any[]
  total: number
  page: number
  limit: number
  aggregations: any
}) {
  return {
    rooms: transformRoomsDecimalFields(data.rooms),
    pagination: {
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: Math.ceil(data.total / data.limit)
    },
    aggregations: data.aggregations
  }
}

/**
 * 格式化批量更新响应
 */
export function formatBatchUpdateResponse(result: {
  success: boolean
  updatedCount: number
  failedCount: number
  errors: any[]
  updatedRooms: any[]
}) {
  return {
    ...result,
    updatedRooms: transformRoomsDecimalFields(result.updatedRooms)
  }
}