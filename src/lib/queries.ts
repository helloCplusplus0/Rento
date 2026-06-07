import type {
  BillStatus,
  ContractStatus,
  MeterReadingRecordType,
  RoomStatus,
} from '@prisma/client'

import { createContractExpiryAlertDeadline } from './contract-alert-semantics'
import { createBillStatusCountMap, sortBillsForDisplay } from './bill-semantics'
import { globalSettings } from './global-settings'
import { prisma } from './prisma'

/**
 * phase10-03 查询层定位：
 * - 主角色：legacy compat 查询承接位
 * - 当前仍承接的 canonical read path：合同/账单/房间详情，房间 SSR 列表，抄表列表
 * - 必须继续退出的职责：create/update/delete/batch 等写语义
 * - 不再被视为长期正式统一读入口；分页列表优先收口到 optimized-queries.ts，
 *   抄表详情与 related bills 已迁到 src/lib/domain/meters
 */
export const queriesLayerPosition = {
  primaryRole: 'legacy-compat-query',
  canonicalReadScopes: [
    'contract-detail',
    'bill-detail',
    'room-list-ssr',
    'room-detail',
    'meter-reading-list',
  ],
  retainedReasons: [
    '承接旧 src/app/api/* 与 SSR 页面仍在使用的详情读取',
    '为 phase10-03 冻结后的过渡期 canonical detail read 提供单一入口',
  ],
  mustExitResponsibilities: [
    'query-layer-create',
    'query-layer-update',
    'query-layer-delete',
    'query-layer-batch-write',
  ],
} as const

function createRestrictedDeleteError(entityName: string, suggestion: string) {
  return new Error(
    `${entityName}默认删除入口已禁用，请改用受门禁保护的详情 API 或专用业务流程。${suggestion}`
  )
}

export const meterReadingDeletePolicy = {
  allowed: false,
  reason:
    '抄表记录会影响账单与历史追溯，当前阶段不支持删除历史抄表记录。',
} as const

// 楼栋相关查询
export const buildingQueries = {
  // 查找所有楼栋
  findAll: () =>
    prisma.building.findMany({
      include: {
        rooms: {
          include: {
            contracts: {
              where: { status: 'ACTIVE' },
              include: { renter: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),

  // 根据ID查找楼栋
  findById: (id: string) =>
    prisma.building.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            contracts: {
              where: { status: 'ACTIVE' },
              include: { renter: true },
            },
          },
        },
      },
    }),

  // 创建楼栋
  create: (data: { name: string; address?: string; description?: string }) =>
    prisma.building.create({
      data: {
        ...data,
        totalRooms: 0,
      },
    }),

  // 更新楼栋
  update: (
    id: string,
    data: {
      name?: string
      address?: string
      description?: string
    }
  ) =>
    prisma.building.update({
      where: { id },
      data,
    }),

  // 删除楼栋
  delete: (id: string) =>
    prisma.building.delete({
      where: { id },
    }),
}

// 房间相关查询
export const roomQueries = {
  // 根据楼栋查找房间
  findByBuilding: (buildingId: string) =>
    prisma.room.findMany({
      where: { buildingId },
      include: {
        building: true,
        contracts: {
          where: { status: 'ACTIVE' },
          include: { renter: true },
        },
      },
      orderBy: [{ floorNumber: 'asc' }, { roomNumber: 'asc' }],
    }),

  // 根据状态查找房间
  findByStatus: (status: RoomStatus) =>
    prisma.room.findMany({
      where: { status },
      include: {
        building: true,
        contracts: {
          where: { status: 'ACTIVE' },
          include: { renter: true },
        },
      },
      orderBy: { roomNumber: 'asc' },
    }),

  // 查找所有房间
  findAll: () =>
    prisma.room.findMany({
      include: {
        building: true,
        contracts: {
          where: { status: 'ACTIVE' },
          include: { renter: true },
        },
      },
      orderBy: [
        { building: { name: 'asc' } },
        { floorNumber: 'asc' },
        { roomNumber: 'asc' },
      ],
    }),

  // 根据ID查找房间
  findById: (id: string) =>
    prisma.room.findUnique({
      where: { id },
      include: {
        building: true,
        contracts: {
          include: {
            renter: true,
            bills: true,
          },
          orderBy: { createdAt: 'desc' }, // 按创建时间倒序，最新的合同在前
        },
      },
    }),

  // 创建房间
  create: (data: {
    roomNumber: string
    floorNumber: number
    buildingId: string
    roomType: 'SHARED' | 'WHOLE' | 'SINGLE'
    area?: number
    rent: number
  }) =>
    prisma.room.create({
      data,
      include: { building: true },
    }),

  // 更新房间
  update: (
    id: string,
    data: {
      roomNumber?: string
      floorNumber?: number
      buildingId?: string
      roomType?: 'SHARED' | 'WHOLE' | 'SINGLE'
      area?: number
      rent?: number
      status?: RoomStatus
      currentRenter?: string
      overdueDays?: number
    }
  ) =>
    prisma.$transaction(async (tx) => {
      const existingRoom = await tx.room.findUnique({
        where: { id },
        select: { buildingId: true },
      })

      if (!existingRoom) {
        throw new Error(`房间不存在: ${id}`)
      }

      const updatedRoom = await tx.room.update({
        where: { id },
        data,
        include: { building: true },
      })

      if (data.buildingId && data.buildingId !== existingRoom.buildingId) {
        await Promise.all([
          tx.building.update({
            where: { id: existingRoom.buildingId },
            data: {
              totalRooms: {
                decrement: 1,
              },
            },
          }),
          tx.building.update({
            where: { id: data.buildingId },
            data: {
              totalRooms: {
                increment: 1,
              },
            },
          }),
        ])
      }

      return updatedRoom
    }),

  // 删除房间
  delete: (id: string) =>
    Promise.reject(
      createRestrictedDeleteError(
        '房间',
        '房间存在合同、账单、仪表或抄表历史时必须优先拦截或归档。'
      )
    ),

  // 高效的楼栋房间查询（带统计信息）
  findByBuildingWithStats: async (buildingId: string) => {
    const rooms = await prisma.room.findMany({
      where: { buildingId },
      include: {
        building: true,
        contracts: {
          where: { status: 'ACTIVE' },
          include: { renter: true },
        },
      },
      orderBy: [{ floorNumber: 'asc' }, { roomNumber: 'asc' }],
    })

    // 计算统计信息
    const floorMap = new Map<number, any[]>()

    // 按楼层分组
    rooms.forEach((room) => {
      const floor = room.floorNumber
      if (!floorMap.has(floor)) {
        floorMap.set(floor, [])
      }
      floorMap.get(floor)!.push(room)
    })

    // 计算楼层统计
    const floorStats = Array.from(floorMap.entries()).map(
      ([floor, floorRooms]) => ({
        floorNumber: floor,
        totalRooms: floorRooms.length,
        roomsByStatus: floorRooms.reduce(
          (acc, room) => {
            acc[room.status] = (acc[room.status] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
      })
    )

    // 计算总体统计
    const statusCounts = rooms.reduce(
      (acc, room) => {
        acc[room.status] = (acc[room.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const stats = {
      totalRooms: rooms.length,
      vacantRooms: statusCounts.VACANT || 0,
      occupiedRooms: statusCounts.OCCUPIED || 0,
      overdueRooms: statusCounts.OVERDUE || 0,
      maintenanceRooms: statusCounts.MAINTENANCE || 0,
      floorStats: floorStats.sort((a, b) => a.floorNumber - b.floorNumber),
    }

    return { rooms, stats }
  },

  // 楼层房间查询
  findByFloor: (buildingId: string, floorNumber: number) =>
    prisma.room.findMany({
      where: { buildingId, floorNumber },
      include: {
        building: true,
        contracts: {
          where: { status: 'ACTIVE' },
          include: { renter: true },
        },
      },
      orderBy: { roomNumber: 'asc' },
    }),

  // 高级搜索查询
  searchRooms: async (params: {
    query?: string
    filters: {
      buildingIds?: string[]
      floorNumbers?: number[]
      statuses?: RoomStatus[]
      roomTypes?: ('SHARED' | 'WHOLE' | 'SINGLE')[]
      rentRange?: [number, number]
      areaRange?: [number, number]
    }
    pagination: {
      page: number
      limit: number
    }
    sort: {
      field: string
      order: 'asc' | 'desc'
    }
  }) => {
    const { query, filters, pagination, sort } = params

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
              renter: { name: { contains: query } },
            },
          },
        },
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

    if (filters.rentRange) {
      where.rent = {
        gte: filters.rentRange[0],
        lte: filters.rentRange[1],
      }
    }

    if (filters.areaRange) {
      where.area = {
        gte: filters.areaRange[0],
        lte: filters.areaRange[1],
      }
    }

    // 执行查询
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: {
          building: true,
          contracts: {
            where: { status: 'ACTIVE' },
            include: { renter: true },
          },
        },
        orderBy: { [sort.field]: sort.order },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.room.count({ where }),
    ])

    // 计算聚合数据
    const aggregations = await prisma.room
      .groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      })
      .then((results) => ({
        statusCounts: results.reduce(
          (acc, item) => {
            acc[item.status] = item._count.status
            return acc
          },
          {} as Record<string, number>
        ),
      }))

    return {
      rooms,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
      aggregations,
    }
  },

  // 批量更新房间状态
  batchUpdateStatus: async (
    roomIds: string[],
    status: RoomStatus,
    operator?: string
  ) => {
    const results = []
    const errors = []

    for (const roomId of roomIds) {
      try {
        const updatedRoom = await prisma.room.update({
          where: { id: roomId },
          data: {
            status,
            updatedAt: new Date(),
          },
          include: { building: true },
        })
        results.push(updatedRoom)
      } catch (error: any) {
        errors.push({
          roomId,
          error: error.message,
          reason: 'Update failed',
        })
      }
    }

    return {
      success: errors.length === 0,
      updatedCount: results.length,
      failedCount: errors.length,
      errors,
      updatedRooms: results,
    }
  },
}

// 租客相关查询
export const renterQueries = {
  // 查找所有租客
  findAll: () =>
    prisma.renter.findMany({
      include: {
        contracts: {
          include: {
            room: {
              include: { building: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),

  // 根据ID查找租客
  findById: (id: string) =>
    prisma.renter.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            room: {
              include: { building: true },
            },
            bills: true,
          },
        },
      },
    }),

  // 根据手机号查找租客
  findByPhone: (phone: string) =>
    prisma.renter.findUnique({
      where: { phone },
      include: {
        contracts: {
          include: {
            room: {
              include: { building: true },
            },
          },
        },
      },
    }),

  // 创建租客
  create: (data: {
    name: string
    gender?: string
    phone: string
    idCard?: string
    emergencyContact?: string
    emergencyPhone?: string
    occupation?: string
    company?: string
    moveInDate?: Date
    tenantCount?: number
    remarks?: string
  }) =>
    prisma.renter.create({
      data,
    }),

  // 更新租客
  update: (
    id: string,
    data: {
      name?: string
      gender?: string
      phone?: string
      idCard?: string
      emergencyContact?: string
      emergencyPhone?: string
      occupation?: string
      company?: string
      moveInDate?: Date
      tenantCount?: number
      remarks?: string
    }
  ) =>
    prisma.renter.update({
      where: { id },
      data,
    }),

  // 删除租客
  delete: (id: string) =>
    prisma.renter.delete({
      where: { id },
    }),

  // 高级搜索功能
  searchRenters: async (params: {
    query?: string
    filters: {
      contractStatus?: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | null
      hasActiveContract?: boolean
      buildingId?: string | null
      moveInDateRange?: [Date, Date]
    }
    pagination: {
      page: number
      limit: number
    }
    sort: {
      field: 'name' | 'phone' | 'moveInDate' | 'createdAt'
      order: 'asc' | 'desc'
    }
  }) => {
    const { query, filters, pagination, sort } = params

    const whereConditions: any[] = []

    // 关键词搜索
    if (query) {
      whereConditions.push({
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } },
          { idCard: { contains: query } },
        ],
      })
    }

    // 合同状态筛选
    if (filters.contractStatus) {
      whereConditions.push({
        contracts: {
          some: { status: filters.contractStatus },
        },
      })
    }

    // 活跃合同筛选
    if (filters.hasActiveContract !== undefined) {
      whereConditions.push({
        contracts: filters.hasActiveContract
          ? {
              some: { status: 'ACTIVE' },
            }
          : {
              none: { status: 'ACTIVE' },
            },
      })
    }

    // 楼栋筛选
    if (filters.buildingId) {
      whereConditions.push({
        contracts: {
          some: {
            room: { buildingId: filters.buildingId },
          },
        },
      })
    }

    // 入住时间范围
    if (filters.moveInDateRange) {
      whereConditions.push({
        moveInDate: {
          gte: filters.moveInDateRange[0],
          lte: filters.moveInDateRange[1],
        },
      })
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {}

    const [renters, total] = await Promise.all([
      prisma.renter.findMany({
        where,
        include: {
          contracts: {
            include: {
              room: { include: { building: true } },
              bills: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { [sort.field]: sort.order },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.renter.count({ where }),
    ])

    return {
      renters,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    }
  },

  // 获取租客统计
  getRenterStats: async () => {
    const [total, withActiveContract, newThisMonth] = await Promise.all([
      prisma.renter.count(),
      prisma.renter.count({
        where: {
          contracts: {
            some: { status: 'ACTIVE' },
          },
        },
      }),
      prisma.renter.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ])

    return {
      totalCount: total,
      activeCount: withActiveContract,
      inactiveCount: total - withActiveContract,
      newThisMonth,
    }
  },
}

// 合同相关查询
export const contractQueries = {
  // 查找所有合同
  findAll: () =>
    prisma.contract.findMany({
      include: {
        room: {
          include: { building: true },
        },
        renter: true,
        bills: true,
      },
      orderBy: { createdAt: 'desc' },
    }),

  // 根据状态查找合同
  findByStatus: (status: ContractStatus) =>
    prisma.contract.findMany({
      where: { status },
      include: {
        room: {
          include: { building: true },
        },
        renter: true,
        bills: true,
      },
      orderBy: { endDate: 'asc' },
    }),

  // 根据ID查找合同
  findById: (id: string) =>
    prisma.contract.findUnique({
      where: { id },
      include: {
        room: {
          include: { building: true },
        },
        renter: true,
        bills: {
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        },
      },
    }),

  // 创建合同
  // 创建合同
  create: async (data: {
    contractNumber: string
    roomId: string
    renterId: string
    startDate: Date
    endDate: Date
    monthlyRent: number
    totalRent: number
    deposit: number
    keyDeposit?: number
    cleaningFee?: number
    paymentMethod?: string
    paymentTiming?: string
    signedBy?: string
    signedDate?: Date
  }) => {
    // 使用事务确保数据一致性
    return await prisma.$transaction(async (tx) => {
      // 智能设置合同初始状态：根据开始日期判断
      const today = new Date()
      today.setHours(0, 0, 0, 0) // 设置为当天开始时间
      const startDate = new Date(data.startDate)
      startDate.setHours(0, 0, 0, 0) // 设置为开始日期的开始时间

      // 如果开始日期是未来日期，设为PENDING；否则设为ACTIVE
      const initialStatus = startDate > today ? 'PENDING' : 'ACTIVE'

      // 创建合同
      const contract = await tx.contract.create({
        data: {
          ...data,
          status: initialStatus,
        },
        include: {
          room: {
            include: { building: true },
          },
          renter: true,
        },
      })

      // 同步更新房间状态：只有ACTIVE合同才占用房间
      if (initialStatus === 'ACTIVE') {
        await tx.room.update({
          where: { id: data.roomId },
          data: {
            status: 'OCCUPIED',
            currentRenter: data.renterId,
          },
        })
      }

      return contract
    })
  },

  // 更新合同
  update: async (
    id: string,
    data: {
      status?: ContractStatus
      isExtended?: boolean
      endDate?: Date
      businessStatus?: string
      signedBy?: string
      signedDate?: Date
    }
  ) => {
    // 使用事务确保数据一致性
    return await prisma.$transaction(async (tx) => {
      // 获取合同信息
      const existingContract = await tx.contract.findUnique({
        where: { id },
        include: { room: true },
      })

      if (!existingContract) {
        throw new Error(`合同不存在: ${id}`)
      }

      // 更新合同
      const updatedContract = await tx.contract.update({
        where: { id },
        data,
        include: {
          room: {
            include: { building: true },
          },
          renter: true,
        },
      })

      // 如果合同状态变为TERMINATED，同步更新房间状态为VACANT
      if (data.status === 'TERMINATED') {
        await tx.room.update({
          where: { id: existingContract.roomId },
          data: {
            status: 'VACANT',
            currentRenter: null,
          },
        })
      }

      return updatedContract
    })
  },

  // 删除合同
  delete: (id: string) =>
    Promise.reject(
      createRestrictedDeleteError(
        '合同',
        '合同是租务事实锚点，默认不得通过查询层清空账单或抄表历史。'
      )
    ),

  // 获取合同统计
  getContractStats: async () => {
    const contractAlertSettingsLoadResult =
      await globalSettings.getContractAlertSettings()
    const contractExpiryAlertDays =
      contractAlertSettingsLoadResult.settings.contractExpiryAlertDays
    const expiryAlertDeadline = createContractExpiryAlertDeadline(
      contractExpiryAlertDays
    )

    const [total, active, expired, terminated, expiringSoon, newThisMonth] =
      await Promise.all([
        prisma.contract.count(),
        prisma.contract.count({ where: { status: 'ACTIVE' } }),
        prisma.contract.count({ where: { status: 'EXPIRED' } }),
        prisma.contract.count({ where: { status: 'TERMINATED' } }),
        prisma.contract.count({
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: new Date(),
              lte: expiryAlertDeadline,
            },
          },
        }),
        prisma.contract.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ])

    const pending = total - active - expired - terminated

    return {
      totalCount: total,
      activeCount: active,
      expiredCount: expired,
      terminatedCount: terminated,
      expiringSoonCount: expiringSoon,
      newThisMonth,
      statusDistribution: {
        pending,
        active,
        expired,
        terminated,
      },
    }
  },

  // 获取到期提醒
  getExpiryAlerts: async () => {
    const contractAlertSettingsLoadResult =
      await globalSettings.getContractAlertSettings()
    const contractExpiryAlertDays =
      contractAlertSettingsLoadResult.settings.contractExpiryAlertDays
    const expiryAlertDeadline = createContractExpiryAlertDeadline(
      contractExpiryAlertDays
    )

    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          // 统一提醒窗口内到期的活跃合同
          {
            status: 'ACTIVE',
            endDate: {
              gte: new Date(),
              lte: expiryAlertDeadline,
            },
          },
          // 已到期但未处理的合同
          {
            status: 'ACTIVE',
            endDate: { lt: new Date() },
          },
        ],
      },
      include: {
        room: { include: { building: true } },
        renter: true,
      },
      orderBy: { endDate: 'asc' },
    })

    return contracts.map((contract) => {
      const daysUntilExpiry = Math.ceil(
        (contract.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: `alert-${contract.id}`,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        renterName: contract.renter.name,
        roomInfo: `${contract.room.building.name} - ${contract.room.roomNumber}`,
        endDate: contract.endDate,
        daysUntilExpiry,
        alertType:
          daysUntilExpiry < 0
            ? ('expired' as const)
            : daysUntilExpiry <= 7
              ? ('danger' as const)
              : ('warning' as const),
      }
    })
  },
}

// 账单相关查询
export const billQueries = {
  // 查找所有账单
  findAll: async () => {
    const bills = await prisma.bill.findMany({
      include: {
        contract: {
          include: {
            room: {
              include: { building: true },
            },
            renter: true,
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    })

    return sortBillsForDisplay(bills)
  },

  // 根据状态查找账单
  findByStatus: (status: BillStatus) =>
    prisma.bill.findMany({
      where: { status },
      include: {
        contract: {
          include: {
            room: {
              include: { building: true },
            },
            renter: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    }),

  // 根据合同查找账单
  findByContract: (contractId: string) =>
    prisma.bill.findMany({
      where: { contractId },
      include: {
        contract: {
          include: {
            room: {
              include: { building: true },
            },
            renter: true,
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    }),

  // 根据ID查找账单
  findById: (id: string) =>
    prisma.bill.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            room: {
              include: { building: true },
            },
            renter: true,
          },
        },
      },
    }),

  // 创建账单
  create: (data: {
    billNumber: string
    type: 'RENT' | 'DEPOSIT' | 'UTILITIES' | 'OTHER'
    amount: number
    pendingAmount: number
    dueDate: Date
    period?: string
    itemLabel?: string
    contractId: string
    paymentMethod?: string
    operator?: string
    remarks?: string
  }) =>
    prisma.bill.create({
      data,
      include: {
        contract: {
          include: {
            room: {
              include: { building: true },
            },
            renter: true,
          },
        },
      },
    }),

  // 更新账单
  update: (
    id: string,
    data: {
      status?: BillStatus
      amount?: number
      receivedAmount?: number
      pendingAmount?: number
      dueDate?: Date
      period?: string
      itemLabel?: string
      paidDate?: Date
      paymentMethod?: string
      operator?: string
      remarks?: string
    }
  ) =>
    prisma.bill.update({
      where: { id },
      data,
      include: {
        contract: {
          include: {
            room: {
              include: { building: true },
            },
            renter: true,
          },
        },
      },
    }),

  // 删除账单
  delete: (id: string) =>
    Promise.reject(
      createRestrictedDeleteError(
        '账单',
        '账单删除必须先经过状态、金额和历史追溯门禁校验。'
      )
    ),
}

// 统计查询
export const statsQueries = {
  // 获取房间统计
  getRoomStats: async () => {
    const totalRooms = await prisma.room.count()
    const vacantRooms = await prisma.room.count({ where: { status: 'VACANT' } })
    const occupiedRooms = await prisma.room.count({
      where: { status: 'OCCUPIED' },
    })
    const overdueRooms = await prisma.room.count({
      where: { status: 'OVERDUE' },
    })
    const maintenanceRooms = await prisma.room.count({
      where: { status: 'MAINTENANCE' },
    })

    return {
      total: totalRooms,
      vacant: vacantRooms,
      occupied: occupiedRooms,
      overdue: overdueRooms,
      maintenance: maintenanceRooms,
      occupancyRate:
        totalRooms > 0
          ? (((occupiedRooms + overdueRooms) / totalRooms) * 100).toFixed(1)
          : '0',
    }
  },

  // 获取账单统计
  getBillStats: async (startDate?: Date, endDate?: Date) => {
    const whereClause =
      startDate && endDate
        ? {
            dueDate: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}

    const [billSummary, statusStats] = await Promise.all([
      prisma.bill.aggregate({
        where: whereClause,
        _sum: {
          amount: true,
          receivedAmount: true,
          pendingAmount: true,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.bill.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
          status: true,
        },
      }),
    ])

    const statusCounts = createBillStatusCountMap()

    statusStats.forEach((item) => {
      statusCounts[item.status] = item._count.status
    })

    return {
      totalAmount: Number(billSummary._sum.amount || 0),
      receivedAmount: Number(billSummary._sum.receivedAmount || 0),
      pendingAmount: Number(billSummary._sum.pendingAmount || 0),
      billCount: billSummary._count._all,
      paidBills: statusCounts.PAID + statusCounts.COMPLETED,
      overdueBills: statusCounts.OVERDUE,
    }
  },
}

// 仪表相关查询
export const meterQueries = {
  // 查找房间的所有仪表（包括禁用的）
  findByRoom: (roomId: string) =>
    prisma.meter.findMany({
      where: { roomId }, // 移除 isActive: true 限制，显示所有仪表
      include: {
        room: { include: { building: true } },
        readings: {
          orderBy: { readingDate: 'desc' },
          take: 1, // 最新读数
        },
      },
      orderBy: [
        { meterType: 'asc' },
        { sortOrder: 'asc' },
        { displayName: 'asc' },
      ],
    }),

  // 按类型查找仪表
  findByType: (
    meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS',
    isActive = true
  ) =>
    prisma.meter.findMany({
      where: { meterType, isActive },
      include: {
        room: { include: { building: true } },
        readings: {
          orderBy: { readingDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { displayName: 'asc' },
    }),

  // 根据ID查找仪表
  findById: (id: string) =>
    prisma.meter.findUnique({
      where: { id },
      include: {
        room: { include: { building: true } },
        readings: {
          orderBy: { readingDate: 'desc' },
          take: 10, // 最近10次读数
        },
      },
    }),

  // 创建仪表
  create: (data: {
    meterNumber: string
    displayName: string
    meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
    roomId: string
    unitPrice: number
    unit: string
    location?: string
    installDate?: Date
    sortOrder?: number
    remarks?: string
  }) =>
    prisma.meter.create({
      data,
      include: {
        room: { include: { building: true } },
      },
    }),

  // 更新仪表
  update: (
    id: string,
    data: {
      displayName?: string
      unitPrice?: number
      unit?: string
      location?: string
      isActive?: boolean
      sortOrder?: number
      remarks?: string
    }
  ) =>
    prisma.meter.update({
      where: { id },
      data,
      include: {
        room: { include: { building: true } },
        readings: {
          orderBy: { readingDate: 'desc' },
          take: 1,
        },
      },
    }),

  // 删除仪表 (真正删除)
  delete: (id: string) =>
    Promise.reject(
      createRestrictedDeleteError(
        '仪表',
        '仪表属于独立资产，默认应优先停用或走专用解绑流程。'
      )
    ),

  // 软删除仪表 (设置为禁用)
  softDelete: (id: string) =>
    prisma.meter.update({
      where: { id },
      data: { isActive: false },
    }),

  // 批量更新排序
  updateSortOrder: async (
    updates: Array<{ id: string; sortOrder: number }>
  ) => {
    const operations = updates.map(({ id, sortOrder }) =>
      prisma.meter.update({
        where: { id },
        data: { sortOrder },
      })
    )
    return prisma.$transaction(operations)
  },

  // 获取仪表统计
  getMeterStats: async () => {
    const totalMeters = await prisma.meter.count({ where: { isActive: true } })
    const electricityMeters = await prisma.meter.count({
      where: { meterType: 'ELECTRICITY', isActive: true },
    })
    const coldWaterMeters = await prisma.meter.count({
      where: { meterType: 'COLD_WATER', isActive: true },
    })
    const hotWaterMeters = await prisma.meter.count({
      where: { meterType: 'HOT_WATER', isActive: true },
    })
    const gasMeters = await prisma.meter.count({
      where: { meterType: 'GAS', isActive: true },
    })

    return {
      total: totalMeters,
      electricity: electricityMeters,
      coldWater: coldWaterMeters,
      hotWater: hotWaterMeters,
      gas: gasMeters,
    }
  },
}

// 抄表记录相关查询
export const meterReadingQueries = {
  // 查找仪表的抄表记录
  findByMeter: (meterId: string, limit = 50) =>
    prisma.meterReading.findMany({
      where: { meterId },
      include: {
        meter: {
          include: { room: { include: { building: true } } },
        },
        contract: {
          include: { renter: true },
        },
        bills: true,
      },
      orderBy: { readingDate: 'desc' },
      take: limit,
    }),

  // 按正式抄表的业务周期查重，兼容历史 period 为空时按同月 readingDate 回退判重
  findRegularReadingByMeterAndPeriod: (
    meterId: string,
    period: string,
    readingDate: Date
  ) => {
    const legacyPeriods = Array.from(
      new Set([
        period,
        `${readingDate.getFullYear()}-${readingDate.getMonth() + 1}`,
        `${readingDate.getFullYear()}-${String(readingDate.getMonth() + 1).padStart(2, '0')}`,
      ])
    )
    const monthStart = new Date(
      readingDate.getFullYear(),
      readingDate.getMonth(),
      1
    )
    const monthEnd = new Date(
      readingDate.getFullYear(),
      readingDate.getMonth() + 1,
      1
    )

    return prisma.meterReading.findFirst({
      where: {
        meterId,
        recordType: 'REGULAR_READING',
        OR: [
          {
            period: {
              in: legacyPeriods,
            },
          },
          {
            OR: [{ period: null }, { period: '' }],
            readingDate: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
        ],
      },
      select: {
        id: true,
        currentReading: true,
        readingDate: true,
        period: true,
      },
    })
  },

  // 查找所有抄表记录 - 支持筛选条件
  findAll: (
    options: {
      limit?: number
      status?: string
      meterType?: string
      recordType?: MeterReadingRecordType | string
      search?: string
      operator?: string
      startDate?: string
      endDate?: string
    } = {}
  ) => {
    const {
      limit = 50,
      status,
      meterType,
      recordType,
      search,
      operator,
      startDate,
      endDate,
    } = options

    // 构建查询条件
    const where: any = {}

    // 状态筛选
    if (status && status !== 'all') {
      where.status = status
    }

    // 仪表类型筛选
    if (meterType && meterType !== 'all') {
      where.meter = {
        meterType: meterType,
      }
    }

    if (recordType && recordType !== 'all') {
      where.recordType = recordType
    }

    // 操作员筛选
    if (operator && operator !== 'all') {
      where.operator = operator
    }

    // 搜索条件 - 房间号或租客姓名
    if (search) {
      where.OR = [
        {
          meter: {
            room: {
              roomNumber: {
                contains: search,
              },
            },
          },
        },
        {
          contract: {
            renter: {
              name: {
                contains: search,
              },
            },
          },
        },
        {
          remarks: {
            contains: search,
          },
        },
      ]
    }

    // 时间范围筛选
    if (startDate || endDate) {
      where.readingDate = {}
      if (startDate) {
        where.readingDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.readingDate.lte = new Date(endDate)
      }
    }

    return prisma.meterReading.findMany({
      where,
      include: {
        meter: {
          include: { room: { include: { building: true } } },
        },
        contract: {
          include: { renter: true },
        },
        bills: true,
      },
      orderBy: { readingDate: 'desc' },
      take: limit,
    })
  },

  // 查找合同的抄表记录
  findByContract: (contractId: string) =>
    prisma.meterReading.findMany({
      where: { contractId },
      include: {
        meter: true,
        bills: true,
      },
      orderBy: { readingDate: 'desc' },
    }),

  // 根据ID查找抄表记录
  findById: (id: string) =>
    prisma.meterReading.findUnique({
      where: { id },
      include: {
        meter: {
          include: { room: { include: { building: true } } },
        },
        contract: {
          include: { renter: true },
        },
        bills: true,
      },
    }),

  // 创建抄表记录
  create: (data: {
    meterId: string
    contractId?: string
    previousReading?: number
    currentReading: number
    usage: number
    recordType?: MeterReadingRecordType
    readingDate: Date
    period?: string
    unitPrice: number
    amount: number
    operator?: string
    remarks?: string
  }) =>
    prisma.meterReading.create({
      data,
      include: {
        meter: {
          include: { room: { include: { building: true } } },
        },
        contract: {
          include: { renter: true },
        },
      },
    }),

  // 更新抄表记录
  update: (
    id: string,
    data: {
      currentReading?: number
      usage?: number
      amount?: number
      status?: 'PENDING' | 'CONFIRMED' | 'BILLED' | 'CANCELLED'
      isBilled?: boolean
      operator?: string
      remarks?: string
      isAbnormal?: boolean
      abnormalReason?: string
    }
  ) =>
    prisma.meterReading.update({
      where: { id },
      data,
      include: {
        meter: {
          include: { room: { include: { building: true } } },
        },
        contract: {
          include: { renter: true },
        },
        bills: true,
      },
    }),

  // 删除抄表记录
  delete: (id: string) =>
    Promise.reject(
      createRestrictedDeleteError(
        '抄表记录',
        meterReadingDeletePolicy.reason
      )
    ),

  // 获取仪表最新读数
  getLatestReading: (meterId: string) =>
    prisma.meterReading.findFirst({
      where: { meterId },
      orderBy: { readingDate: 'desc' },
    }),

  // 检测异常用量
  detectAbnormalUsage: async (meterId: string, currentUsage: number) => {
    const recentReadings = await prisma.meterReading.findMany({
      where: { meterId },
      orderBy: { readingDate: 'desc' },
      take: 6, // 最近6次读数
    })

    if (recentReadings.length < 3) return false

    const avgUsage =
      recentReadings.reduce((sum, r) => sum + Number(r.usage), 0) /
      recentReadings.length
    const abnormalMultiplier = 3 // 异常用量倍数
    return currentUsage > avgUsage * abnormalMultiplier
  },

  // 获取抄表统计
  getReadingStats: async (
    startDate?: Date,
    endDate?: Date,
    options: {
      includeInactiveMeters?: boolean // 是否包含已移除仪表的历史数据
    } = {}
  ) => {
    const { includeInactiveMeters = true } = options

    const whereClause: any = {}

    // 时间范围筛选
    if (startDate && endDate) {
      whereClause.readingDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    // 是否包含已移除仪表的数据
    if (!includeInactiveMeters) {
      whereClause.meter = {
        isActive: true,
      }
    }

    const readings = await prisma.meterReading.findMany({
      where: whereClause,
      select: {
        amount: true,
        usage: true,
        status: true,
        meter: {
          select: {
            meterType: true,
            isActive: true,
            displayName: true,
          },
        },
      },
    })

    const totalAmount = readings.reduce(
      (sum, reading) => sum + Number(reading.amount),
      0
    )
    const totalUsage = readings.reduce(
      (sum, reading) => sum + Number(reading.usage),
      0
    )

    // 分别统计活跃和已移除仪表的数据
    const activeReadings = readings.filter((r) => r.meter.isActive)
    const inactiveReadings = readings.filter((r) => !r.meter.isActive)

    return {
      totalReadings: readings.length,
      totalAmount,
      totalUsage,
      confirmedReadings: readings.filter((r) => r.status === 'CONFIRMED')
        .length,
      billedReadings: readings.filter((r) => r.status === 'BILLED').length,
      electricityReadings: readings.filter(
        (r) => r.meter.meterType === 'ELECTRICITY'
      ).length,
      waterReadings: readings.filter(
        (r) =>
          r.meter.meterType === 'COLD_WATER' ||
          r.meter.meterType === 'HOT_WATER'
      ).length,
      gasReadings: readings.filter((r) => r.meter.meterType === 'GAS').length,
      // 新增：活跃和已移除仪表的数据分析
      activeMetersData: {
        readings: activeReadings.length,
        amount: activeReadings.reduce((sum, r) => sum + Number(r.amount), 0),
        usage: activeReadings.reduce((sum, r) => sum + Number(r.usage), 0),
      },
      removedMetersData: {
        readings: inactiveReadings.length,
        amount: inactiveReadings.reduce((sum, r) => sum + Number(r.amount), 0),
        usage: inactiveReadings.reduce((sum, r) => sum + Number(r.usage), 0),
      },
      dataIntegrity: {
        includesRemovedMeters: includeInactiveMeters,
        removedMeterContribution:
          inactiveReadings.length > 0
            ? Math.round(
                (inactiveReadings.length / readings.length) * 100 * 100
              ) / 100
            : 0,
      },
    }
  },

  // 新增：获取包含已移除仪表的完整历史统计
  getCompleteHistoryStats: async (startDate?: Date, endDate?: Date) => {
    return meterReadingQueries.getReadingStats(startDate, endDate, {
      includeInactiveMeters: true,
    })
  },

  // 新增：仅获取活跃仪表的统计
  getActiveMetersStats: async (startDate?: Date, endDate?: Date) => {
    return meterReadingQueries.getReadingStats(startDate, endDate, {
      includeInactiveMeters: false,
    })
  },
}
