import { prisma } from '@/lib/prisma'
import { OPEN_BILL_STATUSES, toBillAmount } from '@/lib/bill-semantics'

/**
 * phase10-03 查询层定位：
 * - 主角色：治理/辅助查询
 * - 仅承接 dashboard 总览统计，不反向定义合同/账单/房间/抄表主链读模型
 */
export const dashboardQueriesLayerPosition = {
  primaryRole: 'governance-query',
  canonicalReadScopes: ['dashboard-summary-stats'],
  notCanonicalFor: ['contracts', 'bills', 'rooms', 'meter-readings'],
} as const

/**
 * 增强的仪表板统计数据接口
 */
export interface EnhancedDashboardStats {
  // 基础统计
  pendingReceivables: number
  pendingPayables: number

  // 收款统计
  todayReceivables: {
    count: number
    amount: number
  }
  monthlyReceivables: {
    count: number
    amount: number
  }

  // 付款统计
  todayPayables: {
    count: number
    amount: number
  }
  monthlyPayables: {
    count: number
    amount: number
  }

  // 趋势数据
  trends: {
    receivablesChange: number // 相比上月变化百分比
    payablesChange: number
  }

  // 元数据
  lastUpdated: Date
  isLoading: boolean
  error?: string
}

/**
 * 获取今日统计数据
 */
async function getTodayStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  try {
    // 今日收款统计 - 统计今天点击确认收款的金额汇总
    const [todayPayments, todayPaymentAmount] = await Promise.all([
      // 统计今日有收款操作的账单数量
      prisma.bill.count({
        where: {
          paidDate: { gte: today, lt: tomorrow }, // 使用paidDate而不是updatedAt
          receivedAmount: { gt: 0 },
        },
      }),
      // 统计今日确认收款的总额（仅累计已确认入账金额）
      prisma.bill.aggregate({
        where: {
          paidDate: { gte: today, lt: tomorrow }, // 使用paidDate而不是updatedAt
          receivedAmount: { gt: 0 },
        },
        _sum: { receivedAmount: true },
      }),
    ])

    return {
      receivables: {
        count: todayPayments,
        amount: toBillAmount(todayPaymentAmount._sum.receivedAmount),
      },
      payables: {
        count: 0, // 暂时为0，后续扩展
        amount: 0,
      },
    }
  } catch (error) {
    console.error('获取今日统计失败:', error)
    return {
      receivables: { count: 0, amount: 0 },
      payables: { count: 0, amount: 0 },
    }
  }
}

/**
 * 获取30日统计数据
 */
async function getMonthlyStats() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  try {
    // 30日收款统计 - 统计30日内点击确认收款的金额汇总
    const [monthlyPayments, monthlyPaymentAmount] = await Promise.all([
      // 统计30日内有收款操作的账单数量
      prisma.bill.count({
        where: {
          paidDate: { gte: thirtyDaysAgo }, // 使用paidDate而不是updatedAt
          receivedAmount: { gt: 0 },
        },
      }),
      // 统计30日内确认收款的总额（仅累计已确认入账金额）
      prisma.bill.aggregate({
        where: {
          paidDate: { gte: thirtyDaysAgo }, // 使用paidDate而不是updatedAt
          receivedAmount: { gt: 0 },
        },
        _sum: { receivedAmount: true },
      }),
    ])

    return {
      receivables: {
        count: monthlyPayments,
        amount: toBillAmount(monthlyPaymentAmount._sum.receivedAmount),
      },
      payables: {
        count: 0, // 暂时为0，后续扩展
        amount: 0,
      },
    }
  } catch (error) {
    console.error('获取30日统计失败:', error)
    return {
      receivables: { count: 0, amount: 0 },
      payables: { count: 0, amount: 0 },
    }
  }
}

/**
 * 获取统计趋势数据
 */
async function getStatsTrends() {
  try {
    // 获取上月同期数据进行对比
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthStart = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1
    )
    const lastMonthEnd = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0
    )

    const thisMonth = new Date()
    const thisMonthStart = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth(),
      1
    )

    // 使用paidDate进行趋势对比，统计确认收款的金额
    const [lastMonthReceivables, thisMonthReceivables] = await Promise.all([
      prisma.bill.aggregate({
        where: {
          paidDate: { gte: lastMonthStart, lte: lastMonthEnd }, // 使用paidDate
          receivedAmount: { gt: 0 },
        },
        _sum: { receivedAmount: true },
      }),
      prisma.bill.aggregate({
        where: {
          paidDate: { gte: thisMonthStart }, // 使用paidDate
          receivedAmount: { gt: 0 },
        },
        _sum: { receivedAmount: true },
      }),
    ])

    const lastMonthAmount = toBillAmount(lastMonthReceivables._sum.receivedAmount)
    const thisMonthAmount = toBillAmount(thisMonthReceivables._sum.receivedAmount)

    const receivablesChange =
      lastMonthAmount > 0
        ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
        : 0

    return {
      receivablesChange,
      payablesChange: 0, // 暂时为0，后续扩展
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    return {
      receivablesChange: 0,
      payablesChange: 0,
    }
  }
}

/**
 * 获取增强的仪表板统计数据
 */
export async function getEnhancedDashboardStats(): Promise<EnhancedDashboardStats> {
  try {
    const [pendingReceivablesData, todayStats, monthlyStats, trends] =
      await Promise.all([
        // 待收金额统计 - 仅统计仍处于开放状态的待收金额
        prisma.bill.aggregate({
          where: {
            pendingAmount: { gt: 0 },
            status: { in: OPEN_BILL_STATUSES },
          },
          _sum: { pendingAmount: true },
        }),

        // 今日统计
        getTodayStats(),

        // 30日统计
        getMonthlyStats(),

        // 趋势数据
        getStatsTrends(),
      ])

    return {
      pendingReceivables: toBillAmount(pendingReceivablesData._sum?.pendingAmount),
      pendingPayables: 0, // 暂时设为0，后续可扩展为支出账单
      todayReceivables: todayStats.receivables,
      todayPayables: todayStats.payables,
      monthlyReceivables: monthlyStats.receivables,
      monthlyPayables: monthlyStats.payables,
      trends,
      lastUpdated: new Date(),
      isLoading: false,
    }
  } catch (error) {
    console.error('获取增强统计数据失败:', error)
    throw new Error('统计数据获取失败')
  }
}
