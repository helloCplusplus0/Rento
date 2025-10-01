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
    <Card>
      <CardHeader>
        <CardTitle>财务概览</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <div key={index} className={`p-4 rounded-lg ${stat.bgColor}`}>
              <div className="text-center">
                <div className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {stat.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
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