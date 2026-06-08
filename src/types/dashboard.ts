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
    receivablesChange: number
    payablesChange: number
  }

  // 元数据
  lastUpdated: Date
  isLoading: boolean
  error?: string
}
