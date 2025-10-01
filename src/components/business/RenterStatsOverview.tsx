'use client'

import { UserCheck, UserPlus, Users, UserX } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RenterStatsOverviewProps {
  stats: {
    totalCount: number
    activeCount: number
    inactiveCount: number
    newThisMonth: number
  }
}

export function RenterStatsOverview({ stats }: RenterStatsOverviewProps) {
  const statsCards = [
    {
      title: '总租客数',
      value: stats.totalCount,
      description: '系统中的租客总数',
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: '在租租客',
      value: stats.activeCount,
      description: '有活跃合同的租客',
      icon: UserCheck,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: '空闲租客',
      value: stats.inactiveCount,
      description: '无活跃合同的租客',
      icon: UserX,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: '本月新增',
      value: stats.newThisMonth,
      description: '本月新增的租客',
      icon: UserPlus,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {statsCards.map((stat) => {
        const IconComponent = stat.icon

        return (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className={`px-4 pt-3 pb-2 ${stat.bgColor}`}>
              <CardTitle className="flex items-center text-sm leading-tight font-medium text-gray-600">
                <IconComponent className="mr-2 h-4 w-4" />
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
        )
      })}
    </div>
  )
}
