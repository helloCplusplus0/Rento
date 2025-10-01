import { NextRequest } from 'next/server'

import { advancedBillStats, parseDateRange } from '@/lib/bill-stats'

/**
 * 获取账单统计数据API
 * GET /api/bills/stats
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const range = searchParams.get('range')
    const groupBy =
      (searchParams.get('groupBy') as 'day' | 'week' | 'month') || 'day'
    const includeComparison = searchParams.get('comparison') === 'true'

    // 解析时间范围参数
    const dateRange = parseDateRange({
      start: start || undefined,
      end: end || undefined,
      range: range || undefined,
    })

    // 获取详细统计数据
    const statsData = await advancedBillStats.getDetailedStats({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy,
      includeComparison,
    })

    // 转换 Decimal 类型为 number（如果需要）
    const responseData = {
      ...statsData,
      totalAmount: Number(statsData.totalAmount),
      paidAmount: Number(statsData.paidAmount),
      pendingAmount: Number(statsData.pendingAmount),
      overdueAmount: Number(statsData.overdueAmount),
      timeSeries: statsData.timeSeries.map((item) => ({
        ...item,
        totalAmount: Number(item.totalAmount),
        paidAmount: Number(item.paidAmount),
        pendingAmount: Number(item.pendingAmount),
      })),
      typeBreakdown: Object.fromEntries(
        Object.entries(statsData.typeBreakdown).map(([key, value]) => [
          key,
          {
            amount: Number(value.amount),
            count: Number(value.count),
          },
        ])
      ),
    }

    return Response.json(responseData)
  } catch (error) {
    console.error('Failed to fetch bill stats:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
