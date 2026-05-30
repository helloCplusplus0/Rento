'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Clock,
  Eye,
  Home,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS,
  DEFAULT_UPCOMING_MOVE_IN_ALERT_DAYS,
  EXPIRED_CONTRACT_ALERT_TITLE,
  formatContractExpiryAlertTitle,
  formatUpcomingMoveInAlertTitle,
} from '@/lib/contract-alert-semantics'
import { dashboardMobileStyles } from '@/components/business/dashboard-mobile-styles'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

type AlertType =
  | 'room_check'
  | 'lease_expiry'
  | 'upcoming_contracts'
  | 'contract_expiry'

type AlertDetailsByType = Record<AlertType, AlertDetail[]>

const EMPTY_ALERT_DETAILS: AlertDetailsByType = {
  room_check: [],
  lease_expiry: [],
  upcoming_contracts: [],
  contract_expiry: [],
}

/**
 * 统一提醒面板组件
 * 整合所有类型的提醒信息，提供详细展示和快捷操作
 */
export function UnifiedAlertsPanel({ className }: UnifiedAlertsPanelProps) {
  const router = useRouter()
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)
  const [alertDetails, setAlertDetails] = useState<AlertDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [alertsError, setAlertsError] = useState<string | null>(null)
  const [alertDetailsByType, setAlertDetailsByType] =
    useState<AlertDetailsByType>(EMPTY_ALERT_DETAILS)
  const selectedAlertRef = useRef<AlertType | null>(null)

  const buildVacantRoomDetails = (rooms: any[] = []): AlertDetail[] =>
    rooms.map((room: any) => ({
      id: `vacant-${room.id}`,
      type: 'room_check',
      title: `${room.building.name} - ${room.roomNumber}`,
      description: `租金: ${formatCurrency(room.rent)}/月 | 面积: ${room.area || '未知'}㎡`,
      level: 'info' as const,
      data: room,
      actionText: '查看详情',
      onAction: () => router.push(`/rooms/${room.id}`),
    }))

  const buildLeavingTenantDetails = (contracts: any[] = []): AlertDetail[] =>
    contracts.map((contract: any) => ({
      id: `leaving-${contract.id}`,
      type: 'lease_expiry',
      title: `${contract.renter.name} - ${contract.room.building.name}${contract.room.roomNumber}`,
      description: `合同到期: ${formatDate(contract.endDate)} | 租金: ${formatCurrency(contract.monthlyRent)}/月`,
      level: 'warning' as const,
      data: contract,
      actionText: '联系租客',
      onAction: () => router.push(`/contracts/${contract.id}`),
    }))

  const buildUpcomingContractDetails = (
    contracts: any[] = []
  ): AlertDetail[] =>
    contracts.map((contract: any) => ({
      id: `upcoming-${contract.id}`,
      type: 'upcoming_contracts',
      title: `${contract.renter.name} - ${contract.room.building.name}${contract.room.roomNumber}`,
      description: `待入住生效: ${formatDate(contract.startDate)} | 租金: ${formatCurrency(contract.monthlyRent)}/月 | ${contract.daysUntilStart}天后入住`,
      level: 'info' as const,
      data: contract,
      actionText: '查看合同',
      onAction: () => router.push(`/contracts/${contract.id}`),
    }))

  const buildContractExpiryDetails = (alerts: any[] = []): AlertDetail[] =>
    alerts.map((alert: any) => ({
      id: `contract-${alert.contractId}`,
      type: 'contract_expiry',
      title: `${alert.renterName} - ${alert.roomInfo}`,
      description:
        alert.daysUntilExpiry < 0
          ? `已到期 ${Math.abs(alert.daysUntilExpiry)} 天 | 租金: ${formatCurrency(alert.monthlyRent)}/月`
          : `${alert.daysUntilExpiry} 天后到期 | 租金: ${formatCurrency(alert.monthlyRent)}/月`,
      level:
        alert.daysUntilExpiry < 0
          ? ('danger' as const)
          : alert.daysUntilExpiry <= 7
            ? ('danger' as const)
            : ('warning' as const),
      data: alert,
      actionText: alert.daysUntilExpiry < 0 ? '处理合同' : '续约',
      onAction: () => router.push(`/contracts/${alert.contractId}`),
    }))

  // 获取动态提醒数据
  const fetchAlerts = async () => {
    try {
      if (alerts.length === 0) {
        setAlertsLoading(true)
      }
      setAlertsError(null)

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

      const nextAlertDetailsByType: AlertDetailsByType = {
        room_check: buildVacantRoomDetails(vacantRooms.data?.rooms),
        lease_expiry: buildLeavingTenantDetails(
          leavingTenants.data?.contracts
        ),
        upcoming_contracts: buildUpcomingContractDetails(
          upcomingContracts.data?.contracts
        ),
        contract_expiry: buildContractExpiryDetails(contractAlerts.data?.alerts),
      }

      const leavingTenantsTitle =
        leavingTenants.data?.title ||
        formatContractExpiryAlertTitle(DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS)
      const upcomingContractsTitle =
        upcomingContracts.data?.title ||
        formatUpcomingMoveInAlertTitle(DEFAULT_UPCOMING_MOVE_IN_ALERT_DAYS)
      const contractAlertsTitle =
        contractAlerts.data?.title || EXPIRED_CONTRACT_ALERT_TITLE

      const dynamicAlerts: AlertItem[] = [
        {
          id: 'room_check',
          type: 'room_check',
          title: '空房快查',
          count: vacantRooms.data?.total || 0,
          color: (vacantRooms.data?.total || 0) > 0 ? 'blue' : 'gray',
        },
        {
          id: 'lease_expiry',
          type: 'lease_expiry',
          title: leavingTenantsTitle,
          count: leavingTenants.data?.total || 0,
          color: (leavingTenants.data?.total || 0) > 0 ? 'orange' : 'gray',
        },
        {
          id: 'upcoming_contracts',
          type: 'upcoming_contracts',
          title: upcomingContractsTitle,
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
      setAlertDetailsByType(nextAlertDetailsByType)
      if (
        selectedAlertRef.current &&
        selectedAlertRef.current in nextAlertDetailsByType
      ) {
        setAlertDetails(
          nextAlertDetailsByType[
            selectedAlertRef.current as keyof AlertDetailsByType
          ]
        )
      }
    } catch (error) {
      console.error('获取提醒数据失败:', error)
      setAlertsError(
        alerts.length > 0
          ? '提醒刷新失败，当前展示上次可用数据'
          : '提醒数据暂时不可用，请稍后重试'
      )
      if (alerts.length === 0) {
        setAlerts([
          {
            id: 'room_check',
            type: 'room_check',
            title: '空房快查',
            count: 0,
            color: 'gray',
          },
          {
            id: 'lease_expiry',
            type: 'lease_expiry',
            title: formatContractExpiryAlertTitle(
              DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS
            ),
            count: 0,
            color: 'gray',
          },
          {
            id: 'upcoming_contracts',
            type: 'upcoming_contracts',
            title: formatUpcomingMoveInAlertTitle(
              DEFAULT_UPCOMING_MOVE_IN_ALERT_DAYS
            ),
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
      }
    } finally {
      setAlertsLoading(false)
    }
  }

  // 组件挂载时获取提醒数据
  useEffect(() => {
    fetchAlerts()
  }, [])

  useEffect(() => {
    selectedAlertRef.current = selectedAlert as AlertType | null
  }, [selectedAlert])

  // 获取指定类型的详细提醒数据
  const fetchAlertDetails = async (
    alertType: AlertType,
    forceRefresh = false
  ) => {
    if (!forceRefresh) {
      const cachedDetails = alertDetailsByType[alertType]
      setAlertDetails(cachedDetails)
      return
    }

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

      if (selectedAlertRef.current !== alertType) {
        return
      }

      setAlertDetails(details)
      setAlertDetailsByType((current) => ({
        ...current,
        [alertType]: details,
      }))
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

    return buildVacantRoomDetails(data.data?.rooms)
  }

  // 获取统一提醒窗口内的离店详情
  const fetchLeavingTenantDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/leaving-tenants')
    if (!response.ok) throw new Error('获取离店数据失败')
    const data = await response.json()

    return buildLeavingTenantDetails(data.data?.contracts)
  }

  // 获取待入住合同详情
  const fetchUpcomingContractDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/upcoming-contracts')
    if (!response.ok) throw new Error('获取搬入数据失败')
    const data = await response.json()

    return buildUpcomingContractDetails(data.data?.contracts)
  }

  // 获取合同到期详情
  const fetchContractExpiryDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/contract-alerts')
    if (!response.ok) throw new Error('获取合同到期数据失败')
    const data = await response.json()

    return buildContractExpiryDetails(data.data?.alerts)
  }

  // 处理提醒卡片点击
  const handleAlertClick = (alertType: AlertType) => {
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

  const getAlertViewAllHref = (alertType: AlertType) => {
    switch (alertType) {
      case 'room_check':
        return '/rooms?status=VACANT'
      case 'lease_expiry':
      case 'upcoming_contracts':
      case 'contract_expiry':
        return '/contracts'
      default:
        return '/contracts'
    }
  }

  if (alertsLoading && alerts.length === 0) {
    return (
      <Card className={cn(dashboardMobileStyles.alertsCard, className)}>
        <CardHeader className={dashboardMobileStyles.alertsHeader}>
          <CardTitle className={dashboardMobileStyles.alertsTitle}>
            提醒
          </CardTitle>
        </CardHeader>
        <CardContent className={dashboardMobileStyles.alertsContent}>
          <div className="animate-pulse">
            <div className={dashboardMobileStyles.alertsGrid}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-100 p-2.5 text-center"
                >
                  <div className="mx-auto mb-1.5 h-9 w-9 rounded-lg bg-gray-200 sm:h-10 sm:w-10"></div>
                  <div className="mx-auto h-3 w-16 rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(dashboardMobileStyles.alertsCard, className)}>
      <CardHeader className={dashboardMobileStyles.alertsHeader}>
        <div className={dashboardMobileStyles.sectionHeader}>
          <div className={dashboardMobileStyles.sectionTitleWrap}>
            <div className={dashboardMobileStyles.alertsTitleRow}>
              <CardTitle className={dashboardMobileStyles.alertsTitle}>
                提醒
              </CardTitle>
              <div className={dashboardMobileStyles.alertsTitleDot}></div>
            </div>
            <div className={dashboardMobileStyles.sectionSubtle}>
              {alertsError || '工作台需优先关注的房源与合同提醒'}
            </div>
          </div>
          <div className={dashboardMobileStyles.sectionActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAlerts}
              disabled={alertsLoading}
              className="h-8 w-8 p-0"
              aria-label="刷新提醒"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', alertsLoading && 'animate-spin')}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={dashboardMobileStyles.alertsContent}>
        <div className={dashboardMobileStyles.alertsGrid}>
          {alerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => handleAlertClick(alert.type)}
              className={cn(
                dashboardMobileStyles.alertButton,
                selectedAlert === alert.type &&
                  dashboardMobileStyles.alertButtonActive
              )}
            >
              <div
                className={cn(
                  dashboardMobileStyles.alertCountPanel,
                  alert.color === 'red'
                    ? 'bg-red-50'
                    : alert.color === 'orange'
                      ? 'bg-orange-50'
                      : alert.color === 'blue'
                        ? 'bg-blue-50'
                        : alert.color === 'green'
                          ? 'bg-green-50'
                          : 'bg-gray-100'
                )}
              >
                <div className={dashboardMobileStyles.alertCountBox}>
                  {alert.count}
                </div>
              </div>
              <div className={dashboardMobileStyles.alertLabel}>{alert.title}</div>
            </button>
          ))}
        </div>

        {selectedAlert && (
          <div className={dashboardMobileStyles.alertDetailsSection}>
            <div className={dashboardMobileStyles.alertDetailsHeader}>
              <h4 className={dashboardMobileStyles.alertDetailsTitle}>
                {getAlertIcon(selectedAlert)}
                <span className="break-words">
                  {alerts.find((a) => a.type === selectedAlert)?.title}详情
                </span>
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  fetchAlertDetails(selectedAlert as AlertType, true)
                }
                disabled={loading}
                className="h-8 w-8 p-0"
                aria-label="刷新提醒详情"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              </Button>
            </div>

            {loading ? (
              <div className={dashboardMobileStyles.alertDetailsList}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-gray-100"
                  ></div>
                ))}
              </div>
            ) : alertDetails.length > 0 ? (
              <div className={dashboardMobileStyles.alertDetailsList}>
                {alertDetails.slice(0, 10).map((detail) => (
                  detail.onAction ? (
                    <button
                      key={detail.id}
                      type="button"
                      onClick={detail.onAction}
                      className={cn(
                        dashboardMobileStyles.alertDetailsCard,
                        'w-full border text-left hover:bg-gray-50',
                        getLevelColor(detail.level)
                      )}
                    >
                      <CardContent className={dashboardMobileStyles.alertDetailsContent}>
                        <div className={dashboardMobileStyles.alertDetailsTop}>
                          <div className={dashboardMobileStyles.alertDetailsMain}>
                            <div className={dashboardMobileStyles.alertDetailsCardTitle}>
                              {detail.title}
                            </div>
                            <div className={dashboardMobileStyles.alertDetailsCardText}>
                              {detail.description}
                            </div>
                          </div>
                          <div className={dashboardMobileStyles.alertDetailsAction}>
                            <Eye className="h-3 w-3" />
                            <span>{detail.actionText}</span>
                          </div>
                        </div>
                      </CardContent>
                    </button>
                  ) : (
                    <Card
                      key={detail.id}
                      className={cn(
                        dashboardMobileStyles.alertDetailsCard,
                        'border',
                        getLevelColor(detail.level)
                      )}
                    >
                      <CardContent className={dashboardMobileStyles.alertDetailsContent}>
                        <div className={dashboardMobileStyles.alertDetailsTop}>
                          <div className={dashboardMobileStyles.alertDetailsMain}>
                            <div className={dashboardMobileStyles.alertDetailsCardTitle}>
                              {detail.title}
                            </div>
                            <div className={dashboardMobileStyles.alertDetailsCardText}>
                              {detail.description}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}

                {alertDetails.length > 10 && (
                  <div className="pt-1 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-500"
                      onClick={() =>
                        router.push(getAlertViewAllHref(selectedAlert as AlertType))
                      }
                    >
                      查看全部 {alertDetails.length} 项
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className={dashboardMobileStyles.alertEmpty}>暂无相关提醒</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
