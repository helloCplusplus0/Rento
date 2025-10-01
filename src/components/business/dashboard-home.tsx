import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStats {
  pendingReceivables: number
  pendingPayables: number
  todayReceivables: number
  todayPayables: number
  monthlyReceivables: number
  monthlyPayables: number
}

interface AlertItem {
  id: string
  type: 'room_check' | 'lease_expiry' | 'upcoming_contracts' | 'contract_expiry'
  title: string
  count: number
  color: 'red' | 'orange' | 'blue' | 'green' | 'gray'
}

interface QuickAction {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  bgColor: string
  onClick?: () => void
}

interface DashboardHomeProps {
  stats: DashboardStats
  alerts: AlertItem[]
  quickActions: QuickAction[]
  className?: string
}

/**
 * 主页仪表板组件
 * 展示统计数据、提醒事项和快捷操作
 */
export function DashboardHome({
  stats,
  alerts,
  quickActions,
  className,
}: DashboardHomeProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-blue-600">
                  {formatCurrency(stats.pendingReceivables)}
                </div>
                <div className="text-sm text-gray-600">待收通期 (万元)</div>
                <div className="mt-1 text-xs text-gray-500">
                  今日 {stats.todayReceivables} 笔，30日内{' '}
                  {stats.monthlyReceivables} 笔
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-orange-600">
                  {formatCurrency(stats.pendingPayables)}
                </div>
                <div className="text-sm text-gray-600">待付通期 (万元)</div>
                <div className="mt-1 text-xs text-gray-500">
                  今日 {stats.todayPayables} 笔，30日内 {stats.monthlyPayables}{' '}
                  笔
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快捷操作网格 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg p-3 transition-all hover:scale-105 active:scale-95 sm:p-4',
                    action.bgColor
                  )}
                >
                  <div
                    className={cn(
                      'mb-1 h-6 w-6 sm:mb-2 sm:h-8 sm:w-8',
                      action.color
                    )}
                  >
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium text-white sm:text-sm">
                    {action.title}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 提醒面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">提醒</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="text-center">
                  <div
                    className={cn(
                      'mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white sm:h-12 sm:w-12 sm:text-xl',
                      alert.color === 'red'
                        ? 'bg-red-500'
                        : alert.color === 'orange'
                          ? 'bg-orange-500'
                          : alert.color === 'blue'
                            ? 'bg-blue-500'
                            : alert.color === 'green'
                              ? 'bg-green-500'
                              : 'bg-gray-500'
                    )}
                  >
                    {alert.count}
                  </div>
                  <div className="text-xs text-gray-600">{alert.title}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 工单区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              工单
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-gray-500">暂无工单</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * 预定义的快捷操作数据
 */
export const defaultQuickActions: QuickAction[] = [
  {
    id: 'rooms',
    title: '房源管理',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
    onClick: () => (window.location.href = '/rooms'),
  },
  {
    id: 'contracts',
    title: '合同管理',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
    onClick: () => (window.location.href = '/contracts'),
  },
  {
    id: 'bills',
    title: '账单管理',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
    onClick: () => (window.location.href = '/bills'),
  },
  {
    id: 'system-health',
    title: '系统监控',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
    onClick: () => (window.location.href = '/system-health'),
  },
]

/**
 * 预定义的提醒数据
 */
export const defaultAlerts: AlertItem[] = [
  {
    id: 'room_check',
    type: 'room_check',
    title: '空房查询',
    count: 2,
    color: 'gray',
  },
  {
    id: 'lease_expiry',
    type: 'lease_expiry',
    title: '30天离店',
    count: 0,
    color: 'gray',
  },
  {
    id: 'upcoming_contracts',
    type: 'upcoming_contracts',
    title: '30天搬入',
    count: 0,
    color: 'gray',
  },
  {
    id: 'contract_expiry',
    type: 'contract_expiry',
    title: '合同到期',
    count: 13,
    color: 'orange',
  },
]

/**
 * 仪表板骨架屏
 */
export function DashboardHomeSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 搜索栏骨架 */}
      <div className="border-b bg-white px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-4">
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-200"></div>
            <div className="h-10 w-10 animate-pulse rounded bg-gray-200"></div>
            <div className="h-10 w-10 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* 统计卡片骨架 */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2 text-center">
                  <div className="mx-auto h-8 w-24 animate-pulse rounded bg-gray-200"></div>
                  <div className="mx-auto h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                  <div className="mx-auto h-3 w-40 animate-pulse rounded bg-gray-200"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 快捷操作骨架 */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center p-4"
                >
                  <div className="mb-2 h-8 w-8 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
