import { prisma } from '@/lib/prisma'

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
          receivedAmount: { gt: 0 }
        }
      }),
      // 统计今日确认收款的总额
      prisma.bill.aggregate({
        where: { 
          paidDate: { gte: today, lt: tomorrow }, // 使用paidDate而不是updatedAt
          receivedAmount: { gt: 0 }
        },
        _sum: { receivedAmount: true }
      })
    ])

    return {
      receivables: {
        count: todayPayments,
        amount: Number(todayPaymentAmount._sum.receivedAmount || 0)
      },
      payables: {
        count: 0, // 暂时为0，后续扩展
        amount: 0
      }
    }
  } catch (error) {
    console.error('获取今日统计失败:', error)
    return {
      receivables: { count: 0, amount: 0 },
      payables: { count: 0, amount: 0 }
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
          receivedAmount: { gt: 0 }
        }
      }),
      // 统计30日内确认收款的总额
      prisma.bill.aggregate({
        where: { 
          paidDate: { gte: thirtyDaysAgo }, // 使用paidDate而不是updatedAt
          receivedAmount: { gt: 0 }
        },
        _sum: { receivedAmount: true }
      })
    ])

    return {
      receivables: {
        count: monthlyPayments,
        amount: Number(monthlyPaymentAmount._sum.receivedAmount || 0)
      },
      payables: {
        count: 0, // 暂时为0，后续扩展
        amount: 0
      }
    }
  } catch (error) {
    console.error('获取30日统计失败:', error)
    return {
      receivables: { count: 0, amount: 0 },
      payables: { count: 0, amount: 0 }
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
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
    
    const thisMonth = new Date()
    const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
    
    // 使用paidDate进行趋势对比，统计确认收款的金额
    const [lastMonthReceivables, thisMonthReceivables] = await Promise.all([
      prisma.bill.aggregate({
        where: {
          paidDate: { gte: lastMonthStart, lte: lastMonthEnd }, // 使用paidDate
          receivedAmount: { gt: 0 }
        },
        _sum: { receivedAmount: true }
      }),
      prisma.bill.aggregate({
        where: {
          paidDate: { gte: thisMonthStart }, // 使用paidDate
          receivedAmount: { gt: 0 }
        },
        _sum: { receivedAmount: true }
      })
    ])

    const lastMonthAmount = Number(lastMonthReceivables._sum.receivedAmount || 0)
    const thisMonthAmount = Number(thisMonthReceivables._sum.receivedAmount || 0)
    
    const receivablesChange = lastMonthAmount > 0 
      ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 
      : 0

    return {
      receivablesChange,
      payablesChange: 0 // 暂时为0，后续扩展
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    return {
      receivablesChange: 0,
      payablesChange: 0
    }
  }
}

/**
 * 获取增强的仪表板统计数据
 */
export async function getEnhancedDashboardStats(): Promise<EnhancedDashboardStats> {
  try {
    const [
      pendingReceivablesData,
      todayStats,
      monthlyStats,
      trends
    ] = await Promise.all([
      // 待收金额统计 - 统计所有待收金额（包括未逾期的）
      prisma.bill.aggregate({
        where: {
          pendingAmount: { gt: 0 },
          status: { in: ['PENDING', 'OVERDUE', 'PAID'] } // 包括部分付款状态
        },
        _sum: { pendingAmount: true }
      }),
      
      // 今日统计
      getTodayStats(),
      
      // 30日统计
      getMonthlyStats(),
      
      // 趋势数据
      getStatsTrends()
    ])

    return {
      pendingReceivables: Number(pendingReceivablesData._sum?.pendingAmount || 0),
      pendingPayables: 0, // 暂时设为0，后续可扩展为支出账单
      todayReceivables: todayStats.receivables,
      todayPayables: todayStats.payables,
      monthlyReceivables: monthlyStats.receivables,
      monthlyPayables: monthlyStats.payables,
      trends,
      lastUpdated: new Date(),
      isLoading: false
    }
  } catch (error) {
    console.error('获取增强统计数据失败:', error)
    throw new Error('统计数据获取失败')
  }
}

/**
 * 获取提醒数据
 */
export async function getDashboardAlerts() {
  try {
    // 空房查询
    const vacantRooms = await prisma.room.count({
      where: { status: 'VACANT' }
    })

    // 30天离店 (合同即将到期)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const expiringContracts = await prisma.contract.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        }
      }
    })

    // 30天搬入 (即将生效的合同)
    const today = new Date()
    const upcomingContracts = await prisma.contract.count({
      where: {
        status: 'PENDING',
        startDate: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      }
    })

    // 合同到期 (已到期但未处理的合同)
    const contractsExpiring = await prisma.contract.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: today
        }
      }
    })

    return [
      { 
        id: 'room_check', 
        type: 'room_check' as const, 
        title: '空房查询', 
        count: vacantRooms, 
        color: vacantRooms > 0 ? 'blue' as const : 'gray' as const 
      },
      { 
        id: 'lease_expiry', 
        type: 'lease_expiry' as const, 
        title: '30天离店', 
        count: expiringContracts, 
        color: expiringContracts > 0 ? 'orange' as const : 'gray' as const 
      },
      { 
        id: 'upcoming_contracts', 
        type: 'upcoming_contracts' as const, 
        title: '30天搬入', 
        count: upcomingContracts, 
        color: upcomingContracts > 0 ? 'green' as const : 'gray' as const 
      },
      { 
        id: 'contract_expiry', 
        type: 'contract_expiry' as const, 
        title: '合同到期', 
        count: contractsExpiring, 
        color: contractsExpiring > 0 ? 'red' as const : 'gray' as const 
      }
    ]
  } catch (error) {
    console.error('获取提醒数据失败:', error)
    // 返回默认提醒数据
    return [
      { id: 'room_check', type: 'room_check' as const, title: '空房查询', count: 0, color: 'gray' as const },
      { id: 'lease_expiry', type: 'lease_expiry' as const, title: '30天离店', count: 0, color: 'gray' as const },
      { id: 'upcoming_contracts', type: 'upcoming_contracts' as const, title: '30天搬入', count: 0, color: 'gray' as const },
      { id: 'contract_expiry', type: 'contract_expiry' as const, title: '合同到期', count: 0, color: 'gray' as const }
    ]
  }
}