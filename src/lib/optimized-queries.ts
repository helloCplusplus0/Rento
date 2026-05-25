import {
  Prisma,
  BillStatus,
  BillType,
  ContractStatus,
  RoomStatus,
} from '@prisma/client'

import { prisma } from './prisma'

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
 * 账单查询筛选参数接口
 */
export interface BillQueryFilters {
  status?: BillStatus
  type?: BillType
  contractId?: string
  search?: string
  startDate?: Date
  endDate?: Date
  buildingId?: string
  renterId?: string
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
    const {
      status,
      buildingId,
      floorNumber,
      search,
      roomType,
      rentRange,
      areaRange,
    } = filters
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
      where.rent = {
        gte: rentRange[0],
        lte: rentRange[1],
      }
    }

    if (areaRange) {
      where.area = {
        gte: areaRange[0],
        lte: areaRange[1],
      }
    }

    // 搜索条件
    if (search) {
      where.OR = [
        { roomNumber: { contains: search } },
        { currentRenter: { contains: search } },
        { building: { name: { contains: search } } },
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
              name: true,
            },
          },
          contracts: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              renter: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: [
          { building: { name: 'asc' } },
          { floorNumber: 'asc' },
          { roomNumber: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.room.count({ where }),
    ])

    return {
      data: rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }
  },

  /**
   * 获取房间状态统计（优化版）
   */
  async getStatusStats(
    filters: Omit<RoomQueryFilters, 'status'> = {}
  ): Promise<{
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
        { building: { name: { contains: search } } },
      ]
    }

    const stats = await prisma.room.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
    })

    const result = {
      total: 0,
      vacant: 0,
      occupied: 0,
      overdue: 0,
      maintenance: 0,
    }

    stats.forEach((stat) => {
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
  },

  /**
   * 获取房间及仪表信息，避免逐房补查产生 N+1。
   */
  async findWithMeters(): Promise<any[]> {
    return prisma.room.findMany({
      include: {
        building: true,
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            renter: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
        meters: {
          include: {
            readings: {
              orderBy: { readingDate: 'desc' },
              take: 1,
              select: {
                currentReading: true,
                readingDate: true,
              },
            },
          },
          orderBy: [
            { meterType: 'asc' },
            { sortOrder: 'asc' },
            { displayName: 'asc' },
          ],
        },
      },
      orderBy: [
        { building: { name: 'asc' } },
        { floorNumber: 'asc' },
        { roomNumber: 'asc' },
      ],
    })
  },
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
    filters: RenterQueryFilters = {},
    sort: {
      field?: 'name' | 'phone' | 'moveInDate' | 'createdAt'
      order?: 'asc' | 'desc'
    } = {}
  ): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination
    const { search, contractStatus, hasActiveContract, buildingId } = filters
    const { field = 'name', order = 'asc' } = sort
    const skip = (page - 1) * limit

    const whereConditions: any[] = []

    // 搜索条件
    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { idCard: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    // 合同状态筛选
    if (contractStatus) {
      whereConditions.push({
        contracts: {
          some: { status: contractStatus },
        },
      })
    }

    if (hasActiveContract !== undefined) {
      whereConditions.push({
        contracts: hasActiveContract
          ? {
              some: { status: 'ACTIVE' },
            }
          : {
              none: { status: 'ACTIVE' },
            },
      })
    }

    if (buildingId) {
      whereConditions.push({
        contracts: {
          some: {
            room: { buildingId },
          },
        },
      })
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {}

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
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { [field]: order },
        skip,
        take: limit,
      }),
      prisma.renter.count({ where }),
    ])

    return {
      data: renters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
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
              status: 'ACTIVE',
            },
          },
        },
      }),
      prisma.renter.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
    ])

    return {
      total,
      withActiveContract,
      withoutActiveContract: total - withActiveContract,
      newThisMonth,
    }
  },
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
    const {
      status,
      search,
      buildingId,
      renterId,
      startDate,
      endDate,
      expiringDays,
    } = filters
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
        lte: expiryDate,
      }
      where.status = 'ACTIVE'
    }

    // 搜索条件
    if (search) {
      where.OR = [
        { contractNumber: { contains: search } },
        { renter: { name: { contains: search } } },
        { room: { roomNumber: { contains: search } } },
        { room: { building: { name: { contains: search } } } },
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
              phone: true,
            },
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              rent: true,
              area: true,
              building: {
                select: {
                  id: true,
                  name: true,
                  totalRooms: true,
                },
              },
            },
          },
          bills: {
            select: {
              id: true,
              billNumber: true,
              type: true,
              amount: true,
              receivedAmount: true,
              pendingAmount: true,
              dueDate: true,
              paidDate: true,
              period: true,
              status: true,
              contractId: true,
              paymentMethod: true,
              operator: true,
              remarks: true,
              aggregationType: true,
              meterReadingId: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { dueDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ])

    return {
      data: contracts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }
  },

  /**
   * 获取合同状态统计（优化版）
   */
  async getStatusStats(
    filters: Omit<ContractQueryFilters, 'status'> = {}
  ): Promise<{
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
        status: true,
      },
    })

    // 计算30天内到期的合同
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const expiringIn30Days = await prisma.contract.count({
      where: {
        ...where,
        status: 'ACTIVE',
        endDate: {
          lte: thirtyDaysFromNow,
        },
      },
    })

    const result = {
      total: 0,
      active: 0,
      expired: 0,
      terminated: 0,
      expiringIn30Days,
    }

    stats.forEach((stat) => {
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
  },
}

/**
 * 优化的账单查询函数
 */
export const optimizedBillQueries = {
  /**
   * 分页查询账单列表（优化版）
   */
  async findWithPagination(
    pagination: PaginationParams,
    filters: BillQueryFilters = {}
  ): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination
    const {
      status,
      type,
      contractId,
      search,
      startDate,
      endDate,
      buildingId,
      renterId,
    } = filters
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status
    if (type) where.type = type
    if (contractId) where.contractId = contractId

    if (startDate || endDate) {
      where.dueDate = {}
      if (startDate) where.dueDate.gte = startDate
      if (endDate) where.dueDate.lte = endDate
    }

    if (buildingId || renterId) {
      where.contract = {
        ...(buildingId ? { room: { buildingId } } : {}),
        ...(renterId ? { renterId } : {}),
      }
    }

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        {
          contract: {
            renter: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          contract: {
            room: {
              roomNumber: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          contract: {
            room: {
              building: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
      ]
    }

    const rawWhereClauses: Prisma.Sql[] = [Prisma.sql`1 = 1`]
    const searchPattern = search ? `%${search}%` : null

    if (status) rawWhereClauses.push(Prisma.sql`b."status" = ${status}`)
    if (type) rawWhereClauses.push(Prisma.sql`b."type" = ${type}`)
    if (contractId) rawWhereClauses.push(Prisma.sql`b."contractId" = ${contractId}`)
    if (startDate) rawWhereClauses.push(Prisma.sql`b."dueDate" >= ${startDate}`)
    if (endDate) rawWhereClauses.push(Prisma.sql`b."dueDate" <= ${endDate}`)
    if (buildingId)
      rawWhereClauses.push(Prisma.sql`room."buildingId" = ${buildingId}`)
    if (renterId)
      rawWhereClauses.push(Prisma.sql`contract."renterId" = ${renterId}`)
    if (searchPattern) {
      rawWhereClauses.push(Prisma.sql`
        (
          b."billNumber" ILIKE ${searchPattern}
          OR renter."name" ILIKE ${searchPattern}
          OR room."roomNumber" ILIKE ${searchPattern}
          OR building."name" ILIKE ${searchPattern}
        )
      `)
    }

    const [orderedBillIds, total] = await Promise.all([
      // Prisma 原生 orderBy 无法直接表达“未完结优先”的展示分组，分页列表改为数据库侧 CASE 排序。
      prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT b."id"
        FROM "bills" AS b
        INNER JOIN "contracts" AS contract ON contract."id" = b."contractId"
        INNER JOIN "rooms" AS room ON room."id" = contract."roomId"
        INNER JOIN "buildings" AS building ON building."id" = room."buildingId"
        INNER JOIN "renters" AS renter ON renter."id" = contract."renterId"
        WHERE ${Prisma.join(rawWhereClauses, ' AND ')}
        ORDER BY
          CASE
            WHEN b."status" IN ('PENDING', 'OVERDUE') AND b."pendingAmount" > 0.01 THEN 0
            ELSE 1
          END ASC,
          b."dueDate" ASC,
          b."createdAt" DESC
        OFFSET ${skip}
        LIMIT ${limit}
      `),
      prisma.bill.count({ where }),
    ])

    const billIds = orderedBillIds.map((row) => row.id)
    const bills =
      billIds.length === 0
        ? []
        : await prisma.bill.findMany({
            where: {
              id: {
                in: billIds,
              },
            },
            include: {
              contract: {
                select: {
                  id: true,
                  contractNumber: true,
                  monthlyRent: true,
                  totalRent: true,
                  deposit: true,
                  keyDeposit: true,
                  cleaningFee: true,
                  room: {
                    select: {
                      id: true,
                      roomNumber: true,
                      rent: true,
                      area: true,
                      building: {
                        select: {
                          id: true,
                          name: true,
                          totalRooms: true,
                        },
                      },
                    },
                  },
                  renter: {
                    select: {
                      id: true,
                      name: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          })

    const billMap = new Map(bills.map((bill) => [bill.id, bill]))
    const orderedBills = billIds
      .map((billId) => billMap.get(billId))
      .filter((bill): bill is NonNullable<typeof bill> => Boolean(bill))

    return {
      data: orderedBills,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }
  },
}

// 导出所有优化查询
export const optimizedQueries = {
  rooms: optimizedRoomQueries,
  renters: optimizedRenterQueries,
  contracts: optimizedContractQueries,
  bills: optimizedBillQueries,
}

export default optimizedQueries
