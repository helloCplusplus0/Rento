import { prisma } from './prisma'
import type { RoomStatus, ContractStatus, BillStatus } from '@prisma/client'

/**
 * 通用分页查询参数接口
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * 通用分页查询结果接口
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * 房间查询筛选参数接口
 */
export interface RoomQueryFilters {
  status?: RoomStatus
  buildingId?: string
  floorNumber?: number
  search?: string
  roomType?: string
  rentRange?: [number, number]
  areaRange?: [number, number]
}

/**
 * 租客查询筛选参数接口
 */
export interface RenterQueryFilters {
  search?: string
  contractStatus?: ContractStatus
  hasActiveContract?: boolean
  buildingId?: string
}

/**
 * 合同查询筛选参数接口
 */
export interface ContractQueryFilters {
  status?: ContractStatus
  search?: string
  buildingId?: string
  renterId?: string
  startDate?: Date
  endDate?: Date
  expiringDays?: number
}

/**
 * 优化的房间查询函数
 * 包含分页、索引优化和性能提升
 */
export const optimizedRoomQueries = {
  /**
   * 分页查询房间列表（优化版）
   * 使用复合索引和选择性字段查询
   */
  async findWithPagination(
    pagination: PaginationParams,
    filters: RoomQueryFilters = {}
  ): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination
    const { status, buildingId, floorNumber, search, roomType, rentRange, areaRange } = filters
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {}
    
    // 基础筛选条件（使用索引）
    if (status) where.status = status
    if (buildingId) where.buildingId = buildingId
    if (floorNumber) where.floorNumber = floorNumber
    if (roomType) where.roomType = roomType
    
    // 范围筛选
    if (rentRange) {
      where.monthlyRent = {
        gte: rentRange[0],
        lte: rentRange[1]
      }
    }
    
    if (areaRange) {
      where.area = {
        gte: areaRange[0],
        lte: areaRange[1]
      }
    }
    
    // 搜索条件
    if (search) {
      where.OR = [
        { roomNumber: { contains: search } },
        { currentRenter: { contains: search } },
        { building: { name: { contains: search } } }
      ]
    }

    // 并行查询数据和总数
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: {
          building: { 
            select: { 
              id: true, 
              name: true 
            } 
          },
          contracts: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              renter: { 
                select: { 
                  id: true, 
                  name: true, 
                  phone: true 
                } 
              }
            }
          }
        },
        orderBy: [
          { building: { name: 'asc' } },
          { floorNumber: 'asc' },
          { roomNumber: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.room.count({ where })
    ])

    return {
      data: rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  },

  /**
   * 获取房间状态统计（优化版）
   */
  async getStatusStats(filters: Omit<RoomQueryFilters, 'status'> = {}): Promise<{
    total: number
    vacant: number
    occupied: number
    overdue: number
    maintenance: number
  }> {
    const { buildingId, floorNumber, search } = filters
    const where: any = {}
    
    if (buildingId) where.buildingId = buildingId
    if (floorNumber) where.floorNumber = floorNumber
    if (search) {
      where.OR = [
        { roomNumber: { contains: search } },
        { currentRenter: { contains: search } },
        { building: { name: { contains: search } } }
      ]
    }

    const stats = await prisma.room.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    })

    const result = {
      total: 0,
      vacant: 0,
      occupied: 0,
      overdue: 0,
      maintenance: 0
    }

    stats.forEach(stat => {
      result.total += stat._count.status
      switch (stat.status) {
        case 'VACANT':
          result.vacant = stat._count.status
          break
        case 'OCCUPIED':
          result.occupied = stat._count.status
          break
        case 'OVERDUE':
          result.overdue = stat._count.status
          break
        case 'MAINTENANCE':
          result.maintenance = stat._count.status
          break
      }
    })

    return result
  }
}

/**
 * 优化的租客查询函数
 */
export const optimizedRenterQueries = {
  /**
   * 分页查询租客列表（优化版）
   */
  async findWithPagination(
    pagination: PaginationParams,
    filters: RenterQueryFilters = {}
  ): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination
    const { search, contractStatus, hasActiveContract, buildingId } = filters
    const skip = (page - 1) * limit

    const where: any = {}
    
    // 搜索条件
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { idNumber: { contains: search } }
      ]
    }
    
    // 合同状态筛选
    if (contractStatus || hasActiveContract !== undefined || buildingId) {
      where.contracts = {
        some: {
          ...(contractStatus && { status: contractStatus }),
          ...(hasActiveContract !== undefined && { 
            status: hasActiveContract ? 'ACTIVE' : { not: 'ACTIVE' } 
          }),
          ...(buildingId && { 
            room: { buildingId } 
          })
        }
      }
    }

    const [renters, total] = await Promise.all([
      prisma.renter.findMany({
        where,
        include: {
          contracts: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              room: {
                select: {
                  id: true,
                  roomNumber: true,
                  building: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.renter.count({ where })
    ])

    return {
      data: renters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  },

  /**
   * 获取租客统计（优化版）
   */
  async getStats(): Promise<{
    total: number
    withActiveContract: number
    withoutActiveContract: number
    newThisMonth: number
  }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [total, withActiveContract, newThisMonth] = await Promise.all([
      prisma.renter.count(),
      prisma.renter.count({
        where: {
          contracts: {
            some: {
              status: 'ACTIVE'
            }
          }
        }
      }),
      prisma.renter.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      })
    ])

    return {
      total,
      withActiveContract,
      withoutActiveContract: total - withActiveContract,
      newThisMonth
    }
  }
}

/**
 * 优化的合同查询函数
 */
export const optimizedContractQueries = {
  /**
   * 分页查询合同列表（优化版）
   */
  async findWithPagination(
    pagination: PaginationParams,
    filters: ContractQueryFilters = {}
  ): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination
    const { status, search, buildingId, renterId, startDate, endDate, expiringDays } = filters
    const skip = (page - 1) * limit

    const where: any = {}
    
    // 基础筛选条件
    if (status) where.status = status
    if (renterId) where.renterId = renterId
    if (buildingId) where.room = { buildingId }
    
    // 日期范围筛选
    if (startDate || endDate) {
      where.startDate = {}
      if (startDate) where.startDate.gte = startDate
      if (endDate) where.startDate.lte = endDate
    }
    
    // 即将到期筛选
    if (expiringDays) {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiringDays)
      where.endDate = {
        lte: expiryDate
      }
      where.status = 'ACTIVE'
    }
    
    // 搜索条件
    if (search) {
      where.OR = [
        { contractNumber: { contains: search } },
        { renter: { name: { contains: search } } },
        { room: { roomNumber: { contains: search } } },
        { room: { building: { name: { contains: search } } } }
      ]
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          renter: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              building: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.contract.count({ where })
    ])

    return {
      data: contracts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  },

  /**
   * 获取合同状态统计（优化版）
   */
  async getStatusStats(filters: Omit<ContractQueryFilters, 'status'> = {}): Promise<{
    total: number
    active: number
    expired: number
    terminated: number
    expiringIn30Days: number
  }> {
    const { buildingId, renterId } = filters
    const where: any = {}
    
    if (buildingId) where.room = { buildingId }
    if (renterId) where.renterId = renterId

    const stats = await prisma.contract.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    })

    // 计算30天内到期的合同
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const expiringIn30Days = await prisma.contract.count({
      where: {
        ...where,
        status: 'ACTIVE',
        endDate: {
          lte: thirtyDaysFromNow
        }
      }
    })

    const result = {
      total: 0,
      active: 0,
      expired: 0,
      terminated: 0,
      expiringIn30Days
    }

    stats.forEach(stat => {
      result.total += stat._count.status
      switch (stat.status) {
        case 'ACTIVE':
          result.active = stat._count.status
          break
        case 'EXPIRED':
          result.expired = stat._count.status
          break
        case 'TERMINATED':
          result.terminated = stat._count.status
          break
      }
    })

    return result
  }
}

// 导出所有优化查询
export const optimizedQueries = {
  rooms: optimizedRoomQueries,
  renters: optimizedRenterQueries,
  contracts: optimizedContractQueries
}

export default optimizedQueries