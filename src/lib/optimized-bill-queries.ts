import { prisma } from './prisma'
import type { BillStatus, BillType } from '@prisma/client'

/**
 * 分页查询参数接口
 */
export interface PaginationParams {
  page: number
  limit: number
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
 * 分页查询结果接口
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
 * 优化的账单查询函数
 * 包含分页、索引优化和性能提升
 */
export const optimizedBillQueries = {
  /**
   * 分页查询账单列表（优化版）
   * 使用复合索引和选择性字段查询
   */
  async findWithPagination(
    pagination: PaginationParams,
    filters: BillQueryFilters = {}
  ): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination
    const { status, type, contractId, search, startDate, endDate, buildingId, renterId } = filters
    
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const where: any = {}
    
    // 基础筛选条件（使用索引）
    if (status) where.status = status
    if (type) where.type = type
    if (contractId) where.contractId = contractId
    
    // 日期范围筛选（使用索引）
    if (startDate || endDate) {
      where.dueDate = {}
      if (startDate) where.dueDate.gte = startDate
      if (endDate) where.dueDate.lte = endDate
    }
    
    // 关联筛选条件
    if (buildingId || renterId || search) {
      where.contract = {}
      
      if (buildingId) {
        where.contract.room = { buildingId }
      }
      
      if (renterId) {
        where.contract.renterId = renterId
      }
      
      if (search) {
        where.OR = [
          { billNumber: { contains: search } },
          { contract: { 
            renter: { name: { contains: search } },
            room: { roomNumber: { contains: search } }
          }}
        ]
      }
    }
    
    // 并行执行查询和计数（性能优化）
    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: {
          contract: {
            select: {
              id: true,
              contractNumber: true,
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
            }
          }
        },
        orderBy: [
          { status: 'asc' },  // 优先显示待处理账单
          { dueDate: 'desc' }  // 按到期日期倒序
        ],
        skip,
        take: limit
      }),
      prisma.bill.count({ where })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return {
      data: bills,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  },

  /**
   * 快速状态统计查询（优化版）
   * 使用索引和聚合查询
   */
  async getStatusStats(filters: Omit<BillQueryFilters, 'status'> = {}): Promise<{
    total: number
    pending: number
    paid: number
    overdue: number
    completed: number
    totalAmount: number
    paidAmount: number
    pendingAmount: number
  }> {
    const { type, contractId, startDate, endDate, buildingId, renterId } = filters
    
    // 构建基础查询条件
    const baseWhere: any = {}
    if (type) baseWhere.type = type
    if (contractId) baseWhere.contractId = contractId
    
    if (startDate || endDate) {
      baseWhere.dueDate = {}
      if (startDate) baseWhere.dueDate.gte = startDate
      if (endDate) baseWhere.dueDate.lte = endDate
    }
    
    if (buildingId || renterId) {
      baseWhere.contract = {}
      if (buildingId) baseWhere.contract.room = { buildingId }
      if (renterId) baseWhere.contract.renterId = renterId
    }
    
    // 并行执行所有统计查询
    const [
      totalCount,
      pendingCount,
      paidCount,
      overdueCount,
      completedCount,
      amountStats
    ] = await Promise.all([
      prisma.bill.count({ where: baseWhere }),
      prisma.bill.count({ where: { ...baseWhere, status: 'PENDING' } }),
      prisma.bill.count({ where: { ...baseWhere, status: 'PAID' } }),
      prisma.bill.count({ where: { ...baseWhere, status: 'OVERDUE' } }),
      prisma.bill.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
      prisma.bill.aggregate({
        where: baseWhere,
        _sum: {
          amount: true,
          receivedAmount: true,
          pendingAmount: true
        }
      })
    ])
    
    return {
      total: totalCount,
      pending: pendingCount,
      paid: paidCount,
      overdue: overdueCount,
      completed: completedCount,
      totalAmount: Number(amountStats._sum.amount || 0),
      paidAmount: Number(amountStats._sum.receivedAmount || 0),
      pendingAmount: Number(amountStats._sum.pendingAmount || 0)
    }
  },

  /**
   * 按合同查询账单（优化版）
   * 使用索引和限制返回字段
   */
  async findByContract(
    contractId: string,
    options: {
      limit?: number
      includeDetails?: boolean
    } = {}
  ): Promise<any[]> {
    const { limit = 50, includeDetails = false } = options
    
    return prisma.bill.findMany({
      where: { contractId },
      include: includeDetails ? {
        contract: {
          include: {
            room: { include: { building: true } },
            renter: true
          }
        },
        billDetails: true
      } : {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            renter: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { dueDate: 'desc' },
      take: limit
    })
  },

  /**
   * 搜索账单（优化版）
   * 使用全文搜索和索引优化
   */
  async searchBills(
    query: string,
    pagination: PaginationParams,
    filters: Omit<BillQueryFilters, 'search'> = {}
  ): Promise<PaginatedResult<any>> {
    if (!query.trim()) {
      return this.findWithPagination(pagination, filters)
    }
    
    const searchFilters: BillQueryFilters = {
      ...filters,
      search: query.trim()
    }
    
    return this.findWithPagination(pagination, searchFilters)
  },

  /**
   * 获取逾期账单（优化版）
   * 使用日期索引和状态索引
   */
  async getOverdueBills(
    pagination: PaginationParams,
    options: {
      overdueDays?: number
      includeDetails?: boolean
    } = {}
  ): Promise<PaginatedResult<any>> {
    const { overdueDays = 0, includeDetails = false } = options
    const { page, limit } = pagination
    const skip = (page - 1) * limit
    
    const overdueDate = new Date()
    overdueDate.setDate(overdueDate.getDate() - overdueDays)
    
    const where = {
      status: { in: ['PENDING', 'OVERDUE'] as BillStatus[] },
      dueDate: { lt: overdueDate }
    }
    
    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: includeDetails ? {
          contract: {
            include: {
              room: { include: { building: true } },
              renter: true
            }
          }
        } : {
          contract: {
            select: {
              id: true,
              contractNumber: true,
              renter: { select: { id: true, name: true, phone: true } },
              room: { 
                select: { 
                  id: true, 
                  roomNumber: true,
                  building: { select: { id: true, name: true } }
                }
              }
            }
          }
        },
        orderBy: { dueDate: 'asc' }, // 最早逾期的在前
        skip,
        take: limit
      }),
      prisma.bill.count({ where })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return {
      data: bills,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  },

  /**
   * 批量更新账单状态（优化版）
   * 使用事务和批量操作
   */
  async batchUpdateStatus(
    billIds: string[],
    status: BillStatus,
    updateData: {
      receivedAmount?: number
      paidDate?: Date
      paymentMethod?: string
      operator?: string
    } = {}
  ): Promise<{ updated: number; failed: string[] }> {
    const result = { updated: 0, failed: [] as string[] }
    
    try {
      const updateResult = await prisma.bill.updateMany({
        where: { id: { in: billIds } },
        data: {
          status,
          ...updateData,
          updatedAt: new Date()
        }
      })
      
      result.updated = updateResult.count
      
      // 如果更新数量不匹配，找出失败的ID
      if (updateResult.count < billIds.length) {
        const updatedBills = await prisma.bill.findMany({
          where: { 
            id: { in: billIds },
            status,
            updatedAt: { gte: new Date(Date.now() - 1000) } // 1秒内更新的
          },
          select: { id: true }
        })
        
        const updatedIds = new Set(updatedBills.map(b => b.id))
        result.failed = billIds.filter(id => !updatedIds.has(id))
      }
      
    } catch (error) {
      result.failed = billIds
    }
    
    return result
  }
}

/**
 * 导出优化查询函数的便捷别名
 */
export const {
  findWithPagination,
  getStatusStats,
  findByContract,
  searchBills,
  getOverdueBills,
  batchUpdateStatus
} = optimizedBillQueries