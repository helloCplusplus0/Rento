'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Calendar, Clock, Eye, RefreshCw } from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardContractAlert {
  id: string
  contractId: string
  contractNumber: string
  renterName: string
  roomInfo: string
  endDate: Date
  daysUntilExpiry: number
  alertLevel: 'warning' | 'danger' | 'expired'
  monthlyRent: number
}

interface DashboardContractAlertsProps {
  onViewContract?: (contractId: string) => void
  onRenewContract?: (contractId: string) => void
  className?: string
}

/**
 * 工作台合同到期提醒组件
 * 显示即将到期和已到期的合同
 */
export function DashboardContractAlerts({
  onViewContract,
  onRenewContract,
  className,
}: DashboardContractAlertsProps) {
  const [alerts, setAlerts] = useState<DashboardContractAlert[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    warning: 0,
    danger: 0,
    expired: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取提醒数据
  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/contract-alerts')
      if (!response.ok) {
        throw new Error('获取提醒数据失败')
      }

      const data = await response.json()
      setAlerts(data.alerts || [])
      setSummary(
        data.summary || { total: 0, warning: 0, danger: 0, expired: 0 }
      )
    } catch (error) {
      console.error('获取合同到期提醒失败:', error)
      setError(error instanceof Error ? error.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'danger':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <Calendar className="h-4 w-4 text-orange-500" />
    }
  }

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'danger':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200'
    }
  }

  const getAlertText = (alert: DashboardContractAlert) => {
    if (alert.daysUntilExpiry < 0) {
      return `已逾期 ${Math.abs(alert.daysUntilExpiry)} 天`
    } else if (alert.daysUntilExpiry === 0) {
      return '今日到期'
    } else {
      return `${alert.daysUntilExpiry} 天后到期`
    }
  }

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">合同到期提醒</h4>
          <div className="h-4 w-4 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded bg-gray-100"
            ></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">合同到期提醒</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAlerts}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <div className="py-4 text-center text-sm text-red-500">{error}</div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">合同到期提醒</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAlerts}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <div className="py-4 text-center text-sm text-gray-500">
          暂无即将到期的合同
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">合同到期提醒</h4>
        <div className="flex items-center space-x-2">
          {summary.total > 0 && (
            <Badge variant="outline" className="text-xs">
              {summary.total} 个
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAlerts}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 提醒列表 */}
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {alerts.slice(0, 5).map((alert) => (
          <Card
            key={alert.id}
            className={cn(
              'border transition-all hover:shadow-sm',
              getAlertColor(alert.alertLevel)
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center space-x-2">
                  {getAlertIcon(alert.alertLevel)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="truncate text-sm font-medium">
                        {alert.renterName}
                      </span>
                      <span className="truncate text-xs text-gray-500">
                        {alert.roomInfo}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-xs text-gray-600">
                        {getAlertText(alert)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatCurrency(alert.monthlyRent)}/月
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-2 flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewContract?.(alert.contractId)}
                    className="h-6 w-6 p-0"
                    title="查看合同"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  {alert.alertLevel !== 'expired' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRenewContract?.(alert.contractId)}
                      className="h-6 w-6 p-0"
                      title="续约"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 查看更多 */}
      {alerts.length > 5 && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              (window.location.href = '/contracts?status=expiring_soon')
            }
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            查看全部 {alerts.length} 个提醒
          </Button>
        </div>
      )}

      {/* 统计信息 */}
      {summary.total > 0 && (
        <div className="flex justify-center space-x-4 border-t pt-2 text-xs text-gray-500">
          {summary.warning > 0 && (
            <span className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <span>{summary.warning} 个即将到期</span>
            </span>
          )}
          {summary.danger > 0 && (
            <span className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <span>{summary.danger} 个紧急</span>
            </span>
          )}
          {summary.expired > 0 && (
            <span className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-gray-500"></div>
              <span>{summary.expired} 个已逾期</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
