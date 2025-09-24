'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import type { BillWithContract } from '@/types/database'

interface BillStatsOverviewProps {
  bills: BillWithContract[]
  statusCounts: Record<string, number>
}

/**
 * 账单统计概览组件
 * 显示总应收、已收、待收、逾期金额等关键统计信息
 */
export function BillStatsOverview({ bills, statusCounts }: BillStatsOverviewProps) {
  // 计算统计数据
  const stats = bills.reduce((acc, bill) => {
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
  }, {
    totalAmount: 0,
    receivedAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0
  })
  
  const statsCards = [
    {
      title: '总应收金额',
      value: formatCurrency(stats.totalAmount),
      description: `共 ${bills.length} 笔账单`,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: '已收金额',
      value: formatCurrency(stats.receivedAmount),
      description: `已付 ${statusCounts.PAID || 0} 笔`,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: '待收金额',
      value: formatCurrency(stats.pendingAmount),
      description: `待付 ${statusCounts.PENDING || 0} 笔`,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: '逾期金额',
      value: formatCurrency(stats.overdueAmount),
      description: `逾期 ${statusCounts.OVERDUE || 0} 笔`,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ]
  
  return (
    <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => (
        <Card key={stat.title} className="overflow-hidden">
          <CardHeader className={`pb-1 pt-2 px-3 ${stat.bgColor}`}>
            <CardTitle className="text-xs font-medium text-gray-600 leading-tight">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-3 px-3">
            <div className={`text-lg lg:text-2xl font-bold mb-1 ${stat.textColor} leading-tight`}>
              {stat.value}
            </div>
            <p className="text-xs text-gray-500 leading-tight">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}