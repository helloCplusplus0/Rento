'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

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
      bgColor: 'bg-blue-100'
    },
    {
      title: '生效中',
      value: stats.activeCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: '即将到期',
      value: stats.expiringSoonCount,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: '本月新增',
      value: stats.newThisMonth,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <div className="space-y-4">
      {/* 主要统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${stat.color}`} />
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
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between text-sm">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="whitespace-nowrap">生效中 {stats.activeCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="whitespace-nowrap">已到期 {stats.expiredCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full flex-shrink-0"></div>
                <span className="whitespace-nowrap">已终止 {stats.terminatedCount}</span>
              </div>
            </div>
            <div className="text-gray-500 text-center sm:text-right">
              <span className="whitespace-nowrap">活跃率 {stats.totalCount > 0 ? Math.round((stats.activeCount / stats.totalCount) * 100) : 0}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}