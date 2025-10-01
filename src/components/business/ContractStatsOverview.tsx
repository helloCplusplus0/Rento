'use client'

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ContractStats {
  totalCount: number
  activeCount: number
  expiredCount: number
  terminatedCount: number
  expiringSoonCount: number
  newThisMonth: number
  statusDistribution: {
    pending: number
    active: number
    expired: number
    terminated: number
  }
}

interface ContractStatsOverviewProps {
  stats: ContractStats
}

export function ContractStatsOverview({ stats }: ContractStatsOverviewProps) {
  const statsCards = [
    {
      title: '总合同数',
      value: stats.totalCount,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '生效中',
      value: stats.activeCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: '即将到期',
      value: stats.expiringSoonCount,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: '本月新增',
      value: stats.newThisMonth,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="space-y-4">
      {/* 主要统计卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`h-10 w-10 rounded-full ${stat.bgColor} flex items-center justify-center`}
                  >
                    <IconComponent className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 简化的状态分布 - 只显示关键信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">合同状态概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm sm:flex sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 flex-shrink-0 rounded-full bg-green-500"></div>
                <span className="whitespace-nowrap">
                  生效中 {stats.activeCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 flex-shrink-0 rounded-full bg-red-500"></div>
                <span className="whitespace-nowrap">
                  已到期 {stats.expiredCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 flex-shrink-0 rounded-full bg-gray-500"></div>
                <span className="whitespace-nowrap">
                  已终止 {stats.terminatedCount}
                </span>
              </div>
            </div>
            <div className="text-center text-gray-500 sm:text-right">
              <span className="whitespace-nowrap">
                活跃率{' '}
                {stats.totalCount > 0
                  ? Math.round((stats.activeCount / stats.totalCount) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
