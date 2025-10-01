import type { DashboardStats as StatsType } from '@/types/database'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
          <CardTitle className="text-muted-foreground text-sm font-medium">
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
          <CardTitle className="text-muted-foreground text-sm font-medium">
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
          <CardTitle className="text-muted-foreground text-sm font-medium">
            今日收付款
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {stats.todayStats.receivables}
              </div>
              <div className="text-muted-foreground text-xs">收款笔数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {stats.todayStats.payables}
              </div>
              <div className="text-muted-foreground text-xs">付款笔数</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 30日统计 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            30日收付款
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {stats.monthlyStats.receivables}
              </div>
              <div className="text-muted-foreground text-xs">收款笔数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {stats.monthlyStats.payables}
              </div>
              <div className="text-muted-foreground text-xs">付款笔数</div>
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
export function SimpleDashboardStats({
  stats,
  className,
}: DashboardStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {/* 待收逾期金额 */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="mb-1 text-sm font-medium text-red-600">
              待收逾期
            </div>
            <div className="text-xl font-bold text-red-700">
              {formatCurrency(stats.pendingReceivables)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 待付逾期金额 */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="mb-1 text-sm font-medium text-orange-600">
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
  className,
}: StatCardProps) {
  const colorClasses = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600',
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="text-center">
          <div className="text-muted-foreground mb-1 text-sm font-medium">
            {title}
          </div>
          <div className={cn('text-2xl font-bold', colorClasses[color])}>
            {typeof value === 'number' ? formatCurrency(value) : value}
          </div>
          {subtitle && (
            <div className="text-muted-foreground mt-1 text-xs">{subtitle}</div>
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
export function DashboardStatsSkeleton({
  simple = false,
}: {
  simple?: boolean
}) {
  if (simple) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2 text-center">
                <div className="mx-auto h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="mx-auto h-6 w-20 animate-pulse rounded bg-gray-200" />
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
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
