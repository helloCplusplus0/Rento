'use client'

import type { BillWithContract } from '@/types/database'
import type { BillPresentationStats } from '@/lib/bill-semantics'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { billListMobileStyles } from '@/components/business/bill-list-mobile-styles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BillStatsOverviewProps {
  bills: BillWithContract[]
  presentationStats: BillPresentationStats
}

/**
 * 账单统计概览组件
 * 显示总应收、已收、待收、逾期金额等关键统计信息
 */
export function BillStatsOverview({
  bills,
  presentationStats,
}: BillStatsOverviewProps) {
  // 计算统计数据
  const stats = bills.reduce(
    (acc, bill) => {
      const amount = Number(bill.amount)
      const receivedAmount = Number(bill.receivedAmount)
      const pendingAmount = Number(bill.pendingAmount)

      acc.totalAmount += amount
      acc.receivedAmount += receivedAmount
      acc.pendingAmount += pendingAmount

      if (bill.status === 'OVERDUE') {
        acc.overdueAmount += pendingAmount
      }

      return acc
    },
    {
      totalAmount: 0,
      receivedAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
    }
  )

  const statsCards = [
    {
      title: '总应收金额',
      value: formatCurrency(stats.totalAmount),
      description: `共 ${bills.length} 笔账单`,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: '已收金额',
      value: formatCurrency(stats.receivedAmount),
      description: `已结清 ${presentationStats.settledCount} 笔`,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: '待收金额',
      value: formatCurrency(stats.pendingAmount),
      description: `待处理 ${presentationStats.openCount} 笔`,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: '逾期金额',
      value: formatCurrency(stats.overdueAmount),
      description: `已逾期 ${presentationStats.overdueCount} 笔`,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ]

  return (
    <Card className={billListMobileStyles.statsCard}>
      <CardHeader className={billListMobileStyles.statsHeader}>
        <CardTitle className={billListMobileStyles.statsTitle}>财务概览</CardTitle>
      </CardHeader>
      <CardContent className={billListMobileStyles.statsContent}>
        <div className={billListMobileStyles.statsGrid}>
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className={cn(billListMobileStyles.statsItem, stat.bgColor)}
            >
              <div className="text-center">
                <div
                  className={cn(
                    billListMobileStyles.statsValue,
                    stat.textColor
                  )}
                >
                  {stat.value}
                </div>
                <div className={billListMobileStyles.statsLabel}>
                  {stat.title}
                </div>
                <div className={billListMobileStyles.statsDescription}>
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
