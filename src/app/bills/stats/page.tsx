import type { Metadata } from 'next'
import { BillStatsPage } from '@/components/pages/BillStatsPage'
import { advancedBillStats, parseDateRange } from '@/lib/bill-stats'

export const metadata: Metadata = {
  title: '账单统计',
  description: '查看账单收支统计和趋势分析'
}

interface BillStatsPageProps {
  searchParams: Promise<{
    start?: string
    end?: string
    range?: string
  }>
}

export default async function BillStatsRoute({ searchParams }: BillStatsPageProps) {
  const params = await searchParams
  
  try {
    // 解析时间范围参数
    const dateRange = parseDateRange(params)
    
    // 获取统计数据
    const statsData = await advancedBillStats.getDetailedStats({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy: 'day',
      includeComparison: true
    })
    
    // 转换 Decimal 类型为 number
    const clientStatsData = {
      ...statsData,
      totalAmount: Number(statsData.totalAmount),
      paidAmount: Number(statsData.paidAmount),
      pendingAmount: Number(statsData.pendingAmount),
      overdueAmount: Number(statsData.overdueAmount),
      timeSeries: statsData.timeSeries.map(item => ({
        ...item,
        totalAmount: Number(item.totalAmount),
        paidAmount: Number(item.paidAmount),
        pendingAmount: Number(item.pendingAmount)
      })),
      typeBreakdown: {
        RENT: { amount: 0, count: 0 },
        DEPOSIT: { amount: 0, count: 0 },
        UTILITIES: { amount: 0, count: 0 },
        OTHER: { amount: 0, count: 0 },
        ...Object.fromEntries(
          Object.entries(statsData.typeBreakdown).map(([key, value]) => [
            key,
            {
              amount: Number(value.amount),
              count: Number(value.count)
            }
          ])
        )
      },
      comparison: statsData.comparison ? {
        ...statsData.comparison,
        previousPeriod: {
          ...statsData.comparison.previousPeriod,
          totalAmount: Number(statsData.comparison.previousPeriod.totalAmount),
          paidAmount: Number(statsData.comparison.previousPeriod.paidAmount),
          pendingAmount: Number(statsData.comparison.previousPeriod.pendingAmount),
          overdueAmount: Number(statsData.comparison.previousPeriod.overdueAmount)
        }
      } : undefined
    }
    
    return <BillStatsPage initialData={clientStatsData} initialRange={dateRange} />
  } catch (error) {
    console.error('Failed to load bill stats:', error)
    
    // 返回空数据的默认页面
    const defaultRange = parseDateRange({})
    const emptyData = {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      totalCount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
      typeBreakdown: {
        RENT: { amount: 0, count: 0 },
        DEPOSIT: { amount: 0, count: 0 },
        UTILITIES: { amount: 0, count: 0 },
        OTHER: { amount: 0, count: 0 }
      },
      timeSeries: [],
      dateRange: defaultRange
    }
    
    return <BillStatsPage initialData={emptyData} initialRange={defaultRange} />
  }
}