import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns'

import {
  calculateDateRange,
  getBillTypeText,
  parseDateRange,
  type BillStatsData,
  type DateRange,
} from './bill-stats.shared'
import { buildBillPresentationStats } from './bill-semantics.shared'
import { billStatsCache } from './bill-cache'
import { prisma } from './prisma'

/**
 * server-only 账单统计宿主：
 * 承接 Prisma 读查询、缓存与聚合计算。
 * 浏览器侧若只需要 DTO、时间范围工具或类型文本，请改用 bill-stats.shared。
 */
export type { BillStatsData, DateRange } from './bill-stats.shared'
export { calculateDateRange, getBillTypeText, parseDateRange } from './bill-stats.shared'

/**
 * 高级账单统计计算模块（优化版）
 */
export const advancedBillStats = {
  /**
   * 获取详细统计数据（带缓存）
   */
  async getDetailedStats(params: {
    startDate: Date
    endDate: Date
    groupBy?: 'day' | 'week' | 'month'
    includeComparison?: boolean
  }): Promise<BillStatsData> {
    const {
      startDate,
      endDate,
      groupBy = 'day',
      includeComparison = false,
    } = params

    // 使用缓存获取统计数据
    return billStatsCache.getCachedStats(
      {
        type: 'detailed',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        groupBy,
        filters: { includeComparison },
      },
      async () => {
        // 获取基础统计数据
        const bills = await prisma.bill.findMany({
          where: {
            dueDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            contract: {
              include: {
                room: { include: { building: true } },
                renter: true,
              },
            },
          },
        })

        // 计算基础统计
        const baseStats = this.calculateBaseStats(bills)

        // 计算时间序列数据
        const timeSeries = await this.getTimeSeries({
          startDate,
          endDate,
          interval: groupBy,
          bills,
        })

        // 计算类型分布
        const typeBreakdown = this.calculateTypeBreakdown(bills)

        let comparison
        if (includeComparison) {
          comparison = await this.getComparison(startDate, endDate)
        }

        return {
          ...baseStats,
          typeBreakdown,
          timeSeries,
          comparison,
          dateRange: { startDate, endDate },
        }
      }
    )
  },

  /**
   * 获取快速概览统计（带缓存）
   */
  async getOverviewStats(): Promise<{
    today: BillStatsData
    thisWeek: BillStatsData
    thisMonth: BillStatsData
  }> {
    const now = new Date()
    const today = { startDate: startOfDay(now), endDate: endOfDay(now) }
    const thisWeek = { startDate: startOfWeek(now), endDate: endOfWeek(now) }
    const thisMonth = { startDate: startOfMonth(now), endDate: endOfMonth(now) }

    // 并行获取所有统计数据
    const [todayStats, weekStats, monthStats] = await Promise.all([
      billStatsCache.getCachedStats(
        {
          type: 'overview',
          startDate: today.startDate.toISOString(),
          endDate: today.endDate.toISOString(),
          groupBy: 'day',
        },
        () => this.getDetailedStats({ ...today, groupBy: 'day' })
      ),
      billStatsCache.getCachedStats(
        {
          type: 'overview',
          startDate: thisWeek.startDate.toISOString(),
          endDate: thisWeek.endDate.toISOString(),
          groupBy: 'day',
        },
        () => this.getDetailedStats({ ...thisWeek, groupBy: 'day' })
      ),
      billStatsCache.getCachedStats(
        {
          type: 'overview',
          startDate: thisMonth.startDate.toISOString(),
          endDate: thisMonth.endDate.toISOString(),
          groupBy: 'week',
        },
        () => this.getDetailedStats({ ...thisMonth, groupBy: 'week' })
      ),
    ])

    return {
      today: todayStats,
      thisWeek: weekStats,
      thisMonth: monthStats,
    }
  },

  /**
   * 计算基础统计
   */
  calculateBaseStats(
    bills: any[]
  ): Omit<
    BillStatsData,
    'typeBreakdown' | 'timeSeries' | 'comparison' | 'dateRange'
  > {
    const presentationStats = buildBillPresentationStats(bills)
    const totalAmount = bills.reduce(
      (sum, bill) => sum + Number(bill.amount),
      0
    )
    const paidAmount = bills.reduce(
      (sum, bill) => sum + Number(bill.receivedAmount),
      0
    )
    const pendingAmount = totalAmount - paidAmount

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount: presentationStats.overdueAmount,
      totalCount: presentationStats.totalCount,
      settledCount: presentationStats.settledCount,
      openCount: presentationStats.openCount,
      overdueCount: presentationStats.overdueCount,
    }
  },

  /**
   * 获取时间序列数据（优化版）
   */
  async getTimeSeries(params: {
    startDate: Date
    endDate: Date
    interval: 'day' | 'week' | 'month'
    bills?: any[]
  }) {
    const { startDate, endDate, interval, bills } = params

    let intervals: Date[]
    let formatStr: string

    switch (interval) {
      case 'day':
        intervals = eachDayOfInterval({ start: startDate, end: endDate })
        formatStr = 'yyyy-MM-dd'
        break
      case 'week':
        intervals = eachWeekOfInterval({ start: startDate, end: endDate })
        formatStr = 'yyyy-MM-dd'
        break
      case 'month':
        intervals = eachMonthOfInterval({ start: startDate, end: endDate })
        formatStr = 'yyyy-MM'
        break
    }

    // 如果没有提供bills数据，从数据库获取
    const billsData =
      bills ||
      (await prisma.bill.findMany({
        where: {
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }))

    return intervals.map((date) => {
      const dateStr = format(date, formatStr)
      const periodBills = billsData.filter((bill) => {
        const billDate = format(new Date(bill.dueDate), formatStr)
        return billDate === dateStr
      })

      const totalAmount = periodBills.reduce(
        (sum, bill) => sum + Number(bill.amount),
        0
      )
      const paidAmount = periodBills.reduce(
        (sum, bill) => sum + Number(bill.receivedAmount),
        0
      )

      return {
        date: dateStr,
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
        count: periodBills.length,
      }
    })
  },

  /**
   * 计算类型分布
   */
  calculateTypeBreakdown(bills: any[]) {
    const breakdown = {
      RENT: { amount: 0, count: 0 },
      DEPOSIT: { amount: 0, count: 0 },
      UTILITIES: { amount: 0, count: 0 },
      OTHER: { amount: 0, count: 0 },
    }

    bills.forEach((bill) => {
      const type = bill.type as keyof typeof breakdown
      if (breakdown[type]) {
        breakdown[type].amount += Number(bill.amount)
        breakdown[type].count += 1
      }
    })

    return breakdown
  },

  /**
   * 获取同期对比数据（优化版）
   */
  async getComparison(startDate: Date, endDate: Date) {
    const duration = endDate.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - duration)
    const prevEndDate = new Date(endDate.getTime() - duration)

    // 使用缓存获取上期数据
    const previousStats = await billStatsCache.getCachedStats(
      {
        type: 'detailed',
        startDate: prevStartDate.toISOString(),
        endDate: prevEndDate.toISOString(),
        groupBy: 'day',
      },
      async () => {
        const prevBills = await prisma.bill.findMany({
          where: {
            dueDate: {
              gte: prevStartDate,
              lte: prevEndDate,
            },
          },
        })

        return {
          ...this.calculateBaseStats(prevBills),
          typeBreakdown: this.calculateTypeBreakdown(prevBills),
          timeSeries: [],
          dateRange: { startDate: prevStartDate, endDate: prevEndDate },
        }
      }
    )

    const currentAmount = await this.getCurrentPeriodAmount(startDate, endDate)
    const changeAmount = currentAmount - previousStats.totalAmount
    const growthRate =
      previousStats.totalAmount > 0
        ? (changeAmount / previousStats.totalAmount) * 100
        : 0

    return {
      previousPeriod: previousStats,
      growthRate,
      changeAmount,
    }
  },

  /**
   * 获取当前期间总金额
   */
  async getCurrentPeriodAmount(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.bill.aggregate({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    return Number(result._sum.amount || 0)
  },
}

/**
 * 便捷函数：获取今日统计
 */
export async function getTodayStats(): Promise<BillStatsData> {
  const now = new Date()
  return advancedBillStats.getDetailedStats({
    startDate: startOfDay(now),
    endDate: endOfDay(now),
    groupBy: 'day',
  })
}

/**
 * 便捷函数：获取本月统计
 */
export async function getThisMonthStats(): Promise<BillStatsData> {
  const now = new Date()
  return advancedBillStats.getDetailedStats({
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
    groupBy: 'week',
    includeComparison: true,
  })
}
