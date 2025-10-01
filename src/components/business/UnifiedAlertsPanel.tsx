'use client'

import { Suspense, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Clock,
  CreditCard,
  Eye,
  Home,
  LogOut,
  RefreshCw,
  Users,
} from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AlertDetail {
  id: string
  type: string
  title: string
  description: string
  level: 'info' | 'warning' | 'danger' | 'success'
  data?: any
  actionText?: string
  onAction?: () => void
}

interface AlertItem {
  id: string
  type: 'room_check' | 'lease_expiry' | 'upcoming_contracts' | 'contract_expiry'
  title: string
  count: number
  color: 'red' | 'orange' | 'blue' | 'green' | 'gray'
}

interface UnifiedAlertsPanelProps {
  className?: string
}

/**
 * 统一提醒面板组件
 * 整合所有类型的提醒信息，提供详细展示和快捷操作
 */
export function UnifiedAlertsPanel({ className }: UnifiedAlertsPanelProps) {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)
  const [alertDetails, setAlertDetails] = useState<AlertDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)

  // 获取动态提醒数据
  const fetchAlerts = async () => {
    try {
      setAlertsLoading(true)

      // 并行获取所有提醒数据
      const [
        vacantRoomsRes,
        leavingTenantsRes,
        upcomingContractsRes,
        contractAlertsRes,
      ] = await Promise.all([
        fetch('/api/dashboard/vacant-rooms'),
        fetch('/api/dashboard/leaving-tenants'),
        fetch('/api/dashboard/upcoming-contracts'),
        fetch('/api/dashboard/contract-alerts'),
      ])

      const [vacantRooms, leavingTenants, upcomingContracts, contractAlerts] =
        await Promise.all([
          vacantRoomsRes.ok ? vacantRoomsRes.json() : { data: { total: 0 } },
          leavingTenantsRes.ok
            ? leavingTenantsRes.json()
            : { data: { total: 0 } },
          upcomingContractsRes.ok
            ? upcomingContractsRes.json()
            : { data: { total: 0 } },
          contractAlertsRes.ok
            ? contractAlertsRes.json()
            : { data: { total: 0 } },
        ])

      const dynamicAlerts: AlertItem[] = [
        {
          id: 'room_check',
          type: 'room_check',
          title: '空房查询',
          count: vacantRooms.data?.total || 0,
          color: (vacantRooms.data?.total || 0) > 0 ? 'blue' : 'gray',
        },
        {
          id: 'lease_expiry',
          type: 'lease_expiry',
          title: '30天离店',
          count: leavingTenants.data?.total || 0,
          color: (leavingTenants.data?.total || 0) > 0 ? 'orange' : 'gray',
        },
        {
          id: 'upcoming_contracts',
          type: 'upcoming_contracts',
          title: '30天搬入',
          count: upcomingContracts.data?.total || 0,
          color: (upcomingContracts.data?.total || 0) > 0 ? 'green' : 'gray',
        },
        {
          id: 'contract_expiry',
          type: 'contract_expiry',
          title: '合同到期',
          count: contractAlerts.data?.total || 0,
          color: (contractAlerts.data?.total || 0) > 0 ? 'red' : 'gray',
        },
      ]

      setAlerts(dynamicAlerts)
    } catch (error) {
      console.error('获取提醒数据失败:', error)
      // 使用默认数据作为fallback
      setAlerts([
        {
          id: 'room_check',
          type: 'room_check',
          title: '空房查询',
          count: 0,
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
          count: 0,
          color: 'gray',
        },
      ])
    } finally {
      setAlertsLoading(false)
    }
  }

  // 组件挂载时获取提醒数据
  useEffect(() => {
    fetchAlerts()
  }, [])

  // 获取指定类型的详细提醒数据
  const fetchAlertDetails = async (alertType: string) => {
    setLoading(true)
    try {
      let details: AlertDetail[] = []

      switch (alertType) {
        case 'room_check':
          details = await fetchVacantRoomDetails()
          break
        case 'lease_expiry':
          details = await fetchLeavingTenantDetails()
          break
        case 'upcoming_contracts':
          details = await fetchUpcomingContractDetails()
          break
        case 'contract_expiry':
          details = await fetchContractExpiryDetails()
          break
      }

      setAlertDetails(details)
    } catch (error) {
      console.error('获取提醒详情失败:', error)
      setAlertDetails([])
    } finally {
      setLoading(false)
    }
  }

  // 获取空房详情
  const fetchVacantRoomDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/vacant-rooms')
    if (!response.ok) throw new Error('获取空房数据失败')
    const data = await response.json()

    return (
      data.data?.rooms?.map((room: any) => ({
        id: `vacant-${room.id}`,
        type: 'room_check',
        title: `${room.building.name} - ${room.roomNumber}`,
        description: `租金: ${formatCurrency(room.rent)}/月 | 面积: ${room.area || '未知'}㎡`,
        level: 'info' as const,
        data: room,
        actionText: '查看详情',
        onAction: () => (window.location.href = `/rooms/${room.id}`),
      })) || []
    )
  }

  // 获取30天离店详情
  const fetchLeavingTenantDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/leaving-tenants')
    if (!response.ok) throw new Error('获取离店数据失败')
    const data = await response.json()

    return (
      data.data?.contracts?.map((contract: any) => ({
        id: `leaving-${contract.id}`,
        type: 'lease_expiry',
        title: `${contract.renter.name} - ${contract.room.building.name}${contract.room.roomNumber}`,
        description: `合同到期: ${formatDate(contract.endDate)} | 租金: ${formatCurrency(contract.monthlyRent)}/月`,
        level: 'warning' as const,
        data: contract,
        actionText: '联系租客',
        onAction: () => (window.location.href = `/contracts/${contract.id}`),
      })) || []
    )
  }

  // 获取30天搬入详情
  const fetchUpcomingContractDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/upcoming-contracts')
    if (!response.ok) throw new Error('获取搬入数据失败')
    const data = await response.json()

    return (
      data.data?.contracts?.map((contract: any) => ({
        id: `upcoming-${contract.id}`,
        type: 'upcoming_contracts',
        title: `${contract.renter.name} - ${contract.room.building.name}${contract.room.roomNumber}`,
        description: `合同生效: ${formatDate(contract.startDate)} | 租金: ${formatCurrency(contract.monthlyRent)}/月 | ${contract.daysUntilStart}天后生效`,
        level: 'info' as const,
        data: contract,
        actionText: '查看合同',
        onAction: () => (window.location.href = `/contracts/${contract.id}`),
      })) || []
    )
  }

  // 获取合同到期详情
  const fetchContractExpiryDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/contract-alerts')
    if (!response.ok) throw new Error('获取合同到期数据失败')
    const data = await response.json()

    return (
      data.data?.alerts?.map((alert: any) => ({
        id: `contract-${alert.contractId}`,
        type: 'contract_expiry',
        title: `${alert.renterName} - ${alert.roomInfo}`,
        description:
          alert.daysUntilExpiry < 0
            ? `已逾期 ${Math.abs(alert.daysUntilExpiry)} 天 | 租金: ${formatCurrency(alert.monthlyRent)}/月`
            : `${alert.daysUntilExpiry} 天后到期 | 租金: ${formatCurrency(alert.monthlyRent)}/月`,
        level:
          alert.daysUntilExpiry < 0
            ? ('danger' as const)
            : alert.daysUntilExpiry <= 7
              ? ('danger' as const)
              : ('warning' as const),
        data: alert,
        actionText: alert.daysUntilExpiry < 0 ? '处理逾期' : '续约',
        onAction: () =>
          (window.location.href = `/contracts/${alert.contractId}`),
      })) || []
    )
  }

  // 处理提醒卡片点击
  const handleAlertClick = (alertType: string) => {
    if (selectedAlert === alertType) {
      setSelectedAlert(null)
      setAlertDetails([])
    } else {
      setSelectedAlert(alertType)
      fetchAlertDetails(alertType)
    }
  }

  // 获取图标
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'room_check':
        return <Home className="h-4 w-4" />
      case 'lease_expiry':
        return <Users className="h-4 w-4" />
      case 'upcoming_contracts':
        return <Calendar className="h-4 w-4" />
      case 'contract_expiry':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // 获取详情级别颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  if (alertsLoading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6',
          className
        )}
      >
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/4 rounded bg-gray-200"></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-2 h-10 w-10 rounded-lg bg-gray-200 sm:h-12 sm:w-12"></div>
                <div className="mx-auto h-3 w-16 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          提醒
          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchAlerts}
          disabled={alertsLoading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw
            className={cn('h-3 w-3', alertsLoading && 'animate-spin')}
          />
        </Button>
      </div>

      {/* 提醒概览网格 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            onClick={() => handleAlertClick(alert.type)}
            className={cn(
              'rounded-lg p-3 text-center transition-all hover:shadow-md',
              selectedAlert === alert.type
                ? 'bg-blue-50 ring-2 ring-blue-500'
                : 'hover:bg-gray-50'
            )}
          >
            <div
              className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white sm:h-12 sm:w-12 sm:text-xl ${
                alert.color === 'red'
                  ? 'bg-red-500'
                  : alert.color === 'orange'
                    ? 'bg-orange-500'
                    : alert.color === 'blue'
                      ? 'bg-blue-500'
                      : alert.color === 'green'
                        ? 'bg-green-500'
                        : 'bg-gray-500'
              }`}
            >
              {alert.count}
            </div>
            <div className="text-xs text-gray-600">{alert.title}</div>
          </button>
        ))}
      </div>

      {/* 详细信息展示区域 */}
      {selectedAlert && (
        <div className="border-t border-gray-100 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {getAlertIcon(selectedAlert)}
              {alerts.find((a) => a.type === selectedAlert)?.title}详情
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchAlertDetails(selectedAlert)}
              disabled={loading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded bg-gray-100"
                ></div>
              ))}
            </div>
          ) : alertDetails.length > 0 ? (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {alertDetails.slice(0, 10).map((detail) => (
                <Card
                  key={detail.id}
                  className={cn(
                    'cursor-pointer border transition-all hover:shadow-md',
                    getLevelColor(detail.level),
                    detail.onAction && 'hover:bg-gray-50'
                  )}
                  onClick={detail.onAction}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {detail.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {detail.description}
                        </div>
                      </div>

                      {detail.onAction && (
                        <div className="ml-2 flex items-center gap-1 text-xs text-gray-400">
                          <Eye className="h-3 w-3" />
                          <span className="hidden sm:inline">
                            {detail.actionText}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {alertDetails.length > 10 && (
                <div className="pt-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500"
                  >
                    查看全部 {alertDetails.length} 项
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-gray-500">
              暂无相关提醒
            </div>
          )}
        </div>
      )}
    </div>
  )
}
