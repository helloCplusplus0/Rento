'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, DollarSign, Calendar, Clock, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EnhancedDashboardStats } from '@/lib/dashboard-queries'

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
  error 
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
    purple: 'text-purple-600 bg-purple-50'
  }

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate">
          {title}
        </CardTitle>
        <div className={cn('p-1 sm:p-2 rounded-lg', colorClasses[color])}>
          <div className="w-3 h-3 sm:w-4 sm:h-4">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
        <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? formatCurrency(value) : value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 mb-1 sm:mb-2 line-clamp-2">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center text-xs">
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500 mr-1 flex-shrink-0" />
            )}
            <span className={cn(
              'font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-1 hidden sm:inline">较上月</span>
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
        <Skeleton className="h-3 w-16 sm:h-4 sm:w-20" />
        <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg" />
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
        <Skeleton className="h-5 w-16 sm:h-8 sm:w-24 mb-1" />
        <Skeleton className="h-3 w-24 sm:w-32 mb-1 sm:mb-2" />
        <Skeleton className="h-3 w-12 sm:w-16" />
      </CardContent>
    </Card>
  )
}

/**
 * 统计卡片错误状态
 */
export function StatCardError({ title, error }: { title: string; error: string }) {
  return (
    <Card className="border-red-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <AlertCircle className="h-4 w-4 text-red-500" />
      </CardHeader>
      <CardContent>
        <div className="text-sm text-red-600">
          {error}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 统计卡片网格骨架屏
 */
export function StatisticsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
  onRefresh 
}: StatisticsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">财务统计</h2>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
              刷新
            </Button>
          )}
        </div>
        <StatisticsCardsSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">财务统计</h2>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          )}
        </div>
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">{error}</p>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">财务统计</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            更新时间: {new Date(stats.lastUpdated).toLocaleTimeString()}
          </span>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
              刷新
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* 待收逾期金额 */}
        <StatCard
          title="待收逾期"
          value={stats.pendingReceivables}
          subtitle="逾期未收金额"
          trend={{
            value: stats.trends?.receivablesChange || 0,
            isPositive: (stats.trends?.receivablesChange || 0) >= 0
          }}
          icon={<DollarSign />}
          color="orange"
        />

        {/* 待付逾期金额 */}
        <StatCard
          title="待付逾期"
          value={stats.pendingPayables}
          subtitle="逾期未付金额"
          trend={{
            value: stats.trends?.payablesChange || 0,
            isPositive: (stats.trends?.payablesChange || 0) <= 0 // 付款减少是好事
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