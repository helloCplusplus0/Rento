import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardStats as StatsType } from '@/types/database'

interface DashboardStatsProps {
  stats: StatsType
  className?: string
}

/**
 * 仪表板统计面板组件
 * 显示待收/待付金额和收付款统计
 */
export function DashboardStats({ stats, className }: DashboardStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {/* 待收逾期金额 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            待收逾期
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.pendingReceivables)}
          </div>
        </CardContent>
      </Card>

      {/* 待付逾期金额 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            待付逾期
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(stats.pendingPayables)}
          </div>
        </CardContent>
      </Card>

      {/* 今日统计 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            今日收付款
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {stats.todayStats.receivables}
              </div>
              <div className="text-xs text-muted-foreground">收款笔数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {stats.todayStats.payables}
              </div>
              <div className="text-xs text-muted-foreground">付款笔数</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 30日统计 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            30日收付款
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {stats.monthlyStats.receivables}
              </div>
              <div className="text-xs text-muted-foreground">收款笔数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {stats.monthlyStats.payables}
              </div>
              <div className="text-xs text-muted-foreground">付款笔数</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 简化版统计面板
 * 只显示核心的待收/待付金额
 */
export function SimpleDashboardStats({ stats, className }: DashboardStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {/* 待收逾期金额 */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-sm text-red-600 font-medium mb-1">
              待收逾期
            </div>
            <div className="text-xl font-bold text-red-700">
              {formatCurrency(stats.pendingReceivables)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 待付逾期金额 */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-sm text-orange-600 font-medium mb-1">
              待付逾期
            </div>
            <div className="text-xl font-bold text-orange-700">
              {formatCurrency(stats.pendingPayables)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 统计卡片组件
 * 可复用的单个统计项
 */
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: 'red' | 'orange' | 'green' | 'blue' | 'gray'
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  color = 'gray',
  className 
}: StatCardProps) {
  const colorClasses = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600'
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground font-medium mb-1">
            {title}
          </div>
          <div className={cn('text-2xl font-bold', colorClasses[color])}>
            {typeof value === 'number' ? formatCurrency(value) : value}
          </div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 统计面板骨架屏
 * 用于加载状态
 */
export function DashboardStatsSkeleton({ simple = false }: { simple?: boolean }) {
  if (simple) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16 mx-auto animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-20 mx-auto animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}