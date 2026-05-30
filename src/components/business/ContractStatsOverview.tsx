'use client'

import {
  AlertTriangle,
  CheckCircle,
  FileText,
  FileClock,
} from 'lucide-react'

import { contractListMobileStyles } from '@/components/business/contract-list-mobile-styles'
import { Card, CardContent } from '@/components/ui/card'

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
      title: '待生效',
      value: stats.statusDistribution.pending,
      icon: FileClock,
      color: 'text-sky-600',
      bgColor: 'bg-sky-100',
    },
    {
      title: '即将到期',
      value: stats.expiringSoonCount,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className={contractListMobileStyles.statsGrid}>
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card key={index} className={contractListMobileStyles.statsCard}>
            <CardContent className={contractListMobileStyles.statsContent}>
              <div className={contractListMobileStyles.statsInner}>
                <div>
                  <p className={contractListMobileStyles.statsLabel}>{stat.title}</p>
                  <p className={contractListMobileStyles.statsValue}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${contractListMobileStyles.statsIconBox} ${stat.bgColor}`}
                >
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
