'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, UserX, UserPlus } from 'lucide-react'

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
      textColor: 'text-blue-600'
    },
    {
      title: '在租租客',
      value: stats.activeCount,
      description: '有活跃合同的租客',
      icon: UserCheck,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: '空闲租客',
      value: stats.inactiveCount,
      description: '无活跃合同的租客',
      icon: UserX,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: '本月新增',
      value: stats.newThisMonth,
      description: '本月新增的租客',
      icon: UserPlus,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ]
  
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => {
        const IconComponent = stat.icon
        
        return (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className={`pb-2 pt-3 px-4 ${stat.bgColor}`}>
              <CardTitle className="text-sm font-medium text-gray-600 leading-tight flex items-center">
                <IconComponent className="w-4 h-4 mr-2" />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-4 px-4">
              <div className={`text-xl lg:text-2xl font-bold mb-1 ${stat.textColor} leading-tight`}>
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 leading-tight">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}