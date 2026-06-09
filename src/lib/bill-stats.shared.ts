/**
 * 纯 shared 账单统计语义：
 * 仅承接浏览器与服务端都可安全复用的 DTO、时间范围工具与展示辅助函数，
 * 禁止在这里引入 Prisma、数据库单例或其他 server-only 依赖。
 */

export interface BillStatsData {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  totalCount: number
  settledCount: number
  openCount: number
  overdueCount: number
  typeBreakdown: {
    RENT: { amount: number; count: number }
    DEPOSIT: { amount: number; count: number }
    UTILITIES: { amount: number; count: number }
    OTHER: { amount: number; count: number }
  }
  timeSeries: Array<{
    date: string
    totalAmount: number
    paidAmount: number
    pendingAmount: number
    count: number
  }>
  comparison?: {
    previousPeriod: Omit<BillStatsData, 'timeSeries' | 'comparison'>
    growthRate: number
    changeAmount: number
  }
  dateRange: {
    startDate: Date
    endDate: Date
  }
}

export interface DateRange {
  startDate: Date
  endDate: Date
  preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
}

export function calculateDateRange(preset: string): DateRange {
  const now = new Date()

  switch (preset) {
    case 'today':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        endDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        ),
        preset: 'today',
      }
    case 'week': {
      const startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay())
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)

      return {
        startDate,
        endDate,
        preset: 'week',
      }
    }
    case 'month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        preset: 'month',
      }
    case 'quarter':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        preset: 'quarter',
      }
    case 'year':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        preset: 'year',
      }
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        preset: 'month',
      }
  }
}

export function parseDateRange(params: {
  start?: string
  end?: string
  range?: string
}): DateRange {
  if (params.range) {
    return calculateDateRange(params.range)
  }

  if (params.start && params.end) {
    return {
      startDate: new Date(params.start),
      endDate: new Date(params.end),
      preset: 'custom',
    }
  }

  return calculateDateRange('month')
}

export function getBillTypeText(type: string): string {
  const typeMap = {
    RENT: '租金',
    DEPOSIT: '押金',
    UTILITIES: '水电费',
    OTHER: '其他',
  }

  return typeMap[type as keyof typeof typeMap] || type
}
