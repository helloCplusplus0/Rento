'use client'

import {
  AlertCircle,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import { dashboardMobileStyles } from '@/components/business/dashboard-mobile-styles'
import type { EnhancedDashboardStats } from '@/types/dashboard'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon: React.ReactNode
  color: 'blue' | 'green' | 'orange' | 'purple'
  isLoading?: boolean
  error?: string
}

/**
 * 单个统计卡片组件
 * 支持加载状态、错误状态、趋势显示
 */
export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color,
  isLoading,
  error,
}: StatCardProps) {
  if (isLoading) {
    return <StatCardSkeleton />
  }

  if (error) {
    return <StatCardError title={title} error={error} />
  }

  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
  }

  return (
    <Card className={dashboardMobileStyles.statsCard}>
      <CardHeader className={dashboardMobileStyles.statsHeader}>
        <CardTitle className={dashboardMobileStyles.statsTitle}>
          {title}
        </CardTitle>
        <div className={cn(dashboardMobileStyles.statsIconBox, colorClasses[color])}>
          <div className="h-3 w-3 sm:h-4 sm:w-4">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className={dashboardMobileStyles.statsContent}>
        <div className={dashboardMobileStyles.statsValue}>
          {typeof value === 'number' ? formatCurrency(value) : value}
        </div>
        {subtitle && (
          <p className={dashboardMobileStyles.statsSubtitle}>
            {subtitle}
          </p>
        )}
        {trend && (
          <div className={dashboardMobileStyles.statsTrend}>
            {trend.isPositive ? (
              <TrendingUp className="mr-1 h-3 w-3 flex-shrink-0 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 flex-shrink-0 text-red-500" />
            )}
            <span
              className={cn(
                'font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value.toFixed(1)}%
            </span>
            <span className="ml-1 hidden text-gray-500 sm:inline">较上月</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 统计卡片骨架屏
 */
export function StatCardSkeleton() {
  return (
    <Card className={dashboardMobileStyles.statsCard}>
      <CardHeader className={dashboardMobileStyles.statsHeader}>
        <Skeleton className="h-3 w-16 sm:h-4 sm:w-20" />
        <Skeleton className="h-6 w-6 rounded-lg sm:h-8 sm:w-8" />
      </CardHeader>
      <CardContent className={dashboardMobileStyles.statsContent}>
        <Skeleton className="mb-1 h-5 w-16 sm:h-8 sm:w-24" />
        <Skeleton className="mb-1 h-3 w-24 sm:mb-2 sm:w-32" />
        <Skeleton className="h-3 w-12 sm:w-16" />
      </CardContent>
    </Card>
  )
}

/**
 * 统计卡片错误状态
 */
export function StatCardError({
  title,
  error,
}: {
  title: string
  error: string
}) {
  return (
    <Card className="border-red-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <AlertCircle className="h-4 w-4 text-red-500" />
      </CardHeader>
      <CardContent>
        <div className="text-sm text-red-600">{error}</div>
      </CardContent>
    </Card>
  )
}

/**
 * 统计卡片网格骨架屏
 */
export function StatisticsCardsSkeleton() {
  return (
    <div className={dashboardMobileStyles.statsGrid}>
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  )
}

interface StatisticsCardsProps {
  stats?: EnhancedDashboardStats | null
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
}

/**
 * 统计卡片网格组件
 * 展示完整的财务统计数据
 */
export function StatisticsCards({
  stats,
  isLoading = false,
  error = null,
  onRefresh,
}: StatisticsCardsProps) {
  const headerContent = (
    <div className={dashboardMobileStyles.sectionHeader}>
      <div className="flex min-w-0 items-center gap-2.5">
        <h2 className={dashboardMobileStyles.sectionTitle}>财务统计</h2>
        <div className={dashboardMobileStyles.sectionMetaRow}>
          <span className={dashboardMobileStyles.sectionSubtle}>
            工作台财务概览
          </span>
        </div>
      </div>
      {onRefresh && (
        <div className={dashboardMobileStyles.sectionActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className={dashboardMobileStyles.sectionRefreshButton}
          >
            <RefreshCw
              className={cn('mr-1.5 h-4 w-4', isLoading && 'animate-spin')}
            />
            刷新
          </Button>
        </div>
      )}
    </div>
  )

  if (error && !stats) {
    return (
      <div className={dashboardMobileStyles.section}>
        <div className={dashboardMobileStyles.sectionHeader}>
          <div className="flex min-w-0 items-center gap-2.5">
            <h2 className={dashboardMobileStyles.sectionTitle}>财务统计</h2>
            <div className={dashboardMobileStyles.sectionMetaRow}>
              <span className={dashboardMobileStyles.sectionSubtle}>
                工作台财务概览
              </span>
            </div>
          </div>
          {onRefresh && (
            <div className={dashboardMobileStyles.sectionActions}>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className={dashboardMobileStyles.sectionRefreshButton}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" />
                重试
              </Button>
            </div>
          )}
        </div>
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
            <p className="mb-4 text-red-600">{error}</p>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                重新加载
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={dashboardMobileStyles.section}>
        {headerContent}
        <StatisticsCardsSkeleton />
      </div>
    )
  }

  return (
    <div className={dashboardMobileStyles.section}>
      <div className={dashboardMobileStyles.sectionHeader}>
        <div className="flex min-w-0 items-center gap-2.5">
          <h2 className={dashboardMobileStyles.sectionTitle}>财务统计</h2>
          <div className={dashboardMobileStyles.sectionMetaRow}>
            <span className={dashboardMobileStyles.sectionSubtle}>
              {error
                ? '刷新失败，当前展示上次可用数据'
                : `更新时间: ${new Date(stats.lastUpdated).toLocaleTimeString()}`}
            </span>
          </div>
        </div>
        {onRefresh && (
          <div className={dashboardMobileStyles.sectionActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className={dashboardMobileStyles.sectionRefreshButton}
            >
              <RefreshCw
                className={cn('mr-1.5 h-4 w-4', isLoading && 'animate-spin')}
              />
              刷新
            </Button>
          </div>
        )}
      </div>

      <div className={dashboardMobileStyles.statsGrid}>
        {/* 待收逾期金额 - 修正为待收金额 */}
        <StatCard
          title="待收金额"
          value={stats.pendingReceivables}
          subtitle="所有待收金额"
          trend={{
            value: stats.trends?.receivablesChange || 0,
            isPositive: (stats.trends?.receivablesChange || 0) <= 0,
          }}
          icon={<DollarSign />}
          color="orange"
        />

        {/* 待付逾期金额 - 修正为待付金额 */}
        <StatCard
          title="待付金额"
          value={stats.pendingPayables}
          subtitle="所有待付金额"
          trend={{
            value: stats.trends?.payablesChange || 0,
            isPositive: (stats.trends?.payablesChange || 0) <= 0, // 付款减少是好事
          }}
          icon={<CreditCard />}
          color="purple"
        />

        {/* 今日收款统计 */}
        <StatCard
          title="今日收款"
          value={stats.todayReceivables.amount}
          subtitle={`共 ${stats.todayReceivables.count} 笔收款`}
          icon={<Calendar />}
          color="green"
        />

        {/* 30日收款统计 */}
        <StatCard
          title="30日收款"
          value={stats.monthlyReceivables.amount}
          subtitle={`共 ${stats.monthlyReceivables.count} 笔收款`}
          icon={<Clock />}
          color="blue"
        />
      </div>
    </div>
  )
}
