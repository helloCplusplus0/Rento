'use client'

import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { type BillStatsData } from '@/lib/bill-stats'
import { formatCurrency } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsSummaryProps {
  data: BillStatsData
  loading?: boolean
}

export function StatsSummary({ data, loading }: StatsSummaryProps) {
  if (loading) {
    return <StatsSummarySkeleton />
  }

  const statsCards = [
    {
      title: '总应收金额',
      value: formatCurrency(data.totalAmount),
      description: `共 ${data.totalCount} 笔账单`,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: '已收金额',
      value: formatCurrency(data.paidAmount),
      description: `已付 ${data.paidCount} 笔`,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: '待收金额',
      value: formatCurrency(data.pendingAmount),
      description: `待付 ${data.pendingCount} 笔`,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: '逾期金额',
      value: formatCurrency(data.overdueAmount),
      description: `逾期 ${data.overdueCount} 笔`,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ]

  // 计算收款率
  const collectionRate =
    data.totalAmount > 0
      ? ((data.paidAmount / data.totalAmount) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="space-y-6">
      {/* 主要统计卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className={`px-4 pt-3 pb-2 ${stat.bgColor}`}>
              <CardTitle className="text-sm leading-tight font-medium text-gray-600">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-3 pb-4">
              <div
                className={`mb-1 text-xl font-bold lg:text-2xl ${stat.textColor} leading-tight`}
              >
                {stat.value}
              </div>
              <p className="text-xs leading-tight text-gray-500">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 收款率和同期对比 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 收款率 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">收款率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {collectionRate}%
                </div>
                <p className="text-sm text-gray-500">已收 / 总应收</p>
              </div>
              <div className="relative h-16 w-16">
                <svg
                  className="h-16 w-16 -rotate-90 transform"
                  viewBox="0 0 36 36"
                >
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${collectionRate}, 100`}
                    strokeLinecap="round"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 同期对比 */}
        {data.comparison && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">同期对比</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">总应收金额</span>
                  <div className="flex items-center space-x-2">
                    {data.comparison.growthRate > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : data.comparison.growthRate < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-400" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        data.comparison.growthRate > 0
                          ? 'text-green-600'
                          : data.comparison.growthRate < 0
                            ? 'text-red-600'
                            : 'text-gray-400'
                      }`}
                    >
                      {data.comparison.growthRate > 0 ? '+' : ''}
                      {data.comparison.growthRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  上期:{' '}
                  {formatCurrency(data.comparison.previousPeriod.totalAmount)}
                </div>
                <div className="text-xs text-gray-500">
                  本期: {formatCurrency(data.totalAmount)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

/**
 * 统计摘要加载骨架屏
 */
function StatsSummarySkeleton() {
  return (
    <div className="space-y-6">
      {/* 主要统计卡片骨架 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="bg-gray-50 px-4 pt-3 pb-2">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
            </CardHeader>
            <CardContent className="px-4 pt-3 pb-4">
              <div className="mb-2 h-6 w-20 animate-pulse rounded bg-gray-200"></div>
              <div className="h-3 w-12 animate-pulse rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 收款率和对比骨架 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="h-5 w-12 animate-pulse rounded bg-gray-200"></div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 h-8 w-16 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
              </div>
              <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="h-5 w-16 animate-pulse rounded bg-gray-200"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-12 animate-pulse rounded bg-gray-200"></div>
              </div>
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
