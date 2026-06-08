'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  CreditCard,
  Edit,
  Eye,
  HelpCircle,
  Home,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import {
  DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS,
  DEFAULT_UPCOMING_MOVE_IN_ALERT_DAYS,
  EXPIRED_CONTRACT_ALERT_TITLE,
  formatContractExpiryAlertTitle,
  formatUpcomingMoveInAlertTitle,
} from '@/lib/contract-alert-semantics'
import { dashboardMobileStyles } from '@/components/business/dashboard-mobile-styles'
import { formatCurrency, formatDate } from '@/lib/format'
import { getAuxiliaryPageGovernance } from '@/lib/page-governance'
import { getWorkbenchSearchHref } from '@/lib/workbench-search'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { minixClientEnv } from '../../env'
import {
  navigateToMinixOrDocument,
  openDocumentPath,
} from '../../lib/route-navigation'

interface SearchBarProps {
  placeholder?: string
  className?: string
  showButton?: boolean
}

export function MinixSearchBar({
  placeholder = '搜索房源、合同',
  className,
  showButton = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = () => {
    const targetHref = getWorkbenchSearchHref(query)

    if (targetHref) {
      navigate(targetHref)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={cn(dashboardMobileStyles.quickSearchRow, className)}>
      <div className={dashboardMobileStyles.searchWrap}>
        <Search className={dashboardMobileStyles.searchIcon} />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className={dashboardMobileStyles.searchInput}
          onKeyDown={handleKeyDown}
        />
        {!showButton && (
          <button
            type="button"
            onClick={handleSearch}
            className={dashboardMobileStyles.searchSubmitIcon}
            disabled={!query.trim()}
            aria-label="执行搜索"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
      </div>
      {showButton && (
        <Button
          onClick={handleSearch}
          className={dashboardMobileStyles.searchButton}
          disabled={!query.trim()}
        >
          搜索
        </Button>
      )}
    </div>
  )
}

export function MinixSearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="relative flex-1">
        <div className="h-10 animate-pulse rounded-md bg-gray-200"></div>
      </div>
      <div className="h-10 w-12 animate-pulse rounded-md bg-gray-200"></div>
    </div>
  )
}

interface MinixNotificationEntryButtonProps {
  variant?: 'desktop' | 'hero'
  className?: string
}

const notificationEntryStyles = {
  desktop:
    'h-10 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  hero:
    'h-10 rounded-xl bg-white/15 px-3 text-sm font-medium text-white hover:bg-white/20',
} as const

export function MinixNotificationEntryButton({
  variant = 'desktop',
  className,
}: MinixNotificationEntryButtonProps) {
  return (
    <button
      type="button"
      onClick={() => openDocumentPath('/notifications')}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
        notificationEntryStyles[variant],
        className
      )}
      aria-label="打开通知中心"
    >
      <Bell className="h-4 w-4" />
      <span>通知</span>
    </button>
  )
}

interface FunctionItem {
  id: string
  title: string
  href: string
  icon: React.ReactNode
  color: string
  bgColor: string
  description?: string
}

const coreFeatures: FunctionItem[] = [
  {
    id: 'rooms',
    title: '房源管理',
    href: '/rooms',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
    description: '管理房间信息和状态',
  },
  {
    id: 'renters',
    title: '租客管理',
    href: '/renters',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    description: '管理租客信息和档案',
  },
  {
    id: 'contracts',
    title: '合同管理',
    href: '/contracts',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
    description: '处理租赁合同事务',
  },
  {
    id: 'bills',
    title: '账单管理',
    href: '/bills',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
    description: '管理收支和账单',
  },
  {
    id: 'settings',
    title: '设置',
    href: '/settings',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.14 12.94a7.49 7.49 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.4 7.4 0 00-1.63-.95l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.95l-2.39-.96a.5.5 0 00-.6.22L2.71 8.84a.5.5 0 00.12.64l2.03 1.58a7.49 7.49 0 000 1.88L2.83 14.52a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.5.4 1.05.72 1.63.95l.36 2.54a.5.5 0 00.5.42h3.84a.5.5 0 00.5-.42l.36-2.54c.58-.23 1.12-.55 1.63-.95l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-slate-500 to-slate-600',
    description: '系统设置和配置',
  },
  {
    id: 'batch-reading',
    title: '批量抄表',
    href: '/meter-readings/batch',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
    description: '批量录入仪表读数',
  },
  {
    id: 'meter-history',
    title: '抄表历史',
    href: '/meter-readings/history',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4-4h-2v10h2V7z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    description: '查看抄表历史记录',
  },
  {
    id: 'system-health',
    title: '系统监控',
    href: '/system-health',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
    description: '实时监控系统健康状态',
  },
  {
    id: 'performance-test',
    title: '性能测试',
    href: '/performance-test',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    description: '系统性能测试和验证',
  },
  {
    id: 'performance-benchmark',
    title: '性能基准',
    href: '/performance-benchmark',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
    description: '性能基准测试和评分',
  },
  {
    id: 'performance-analysis',
    title: '性能分析',
    href: '/performance-analysis',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-rose-500 to-rose-600',
    description: '页面跳转性能分析',
  },
]

const dashboardFeatures = coreFeatures.filter((feature) => {
  const governanceEntry = getAuxiliaryPageGovernance(feature.href)

  if (!governanceEntry) {
    return true
  }

  return governanceEntry.category === 'business-entry'
})

function FunctionGridItem({ feature }: { feature: FunctionItem }) {
  return (
    <Link
      to={feature.href}
      className={cn(dashboardMobileStyles.shortcutButton)}
      aria-label={`导航到${feature.title}页面`}
    >
      <div className="flex w-full flex-col items-center">
        <div
          className={cn(
            dashboardMobileStyles.shortcutIconBox,
            feature.bgColor,
            feature.color
          )}
        >
          <div className="h-4 w-4 sm:h-5 sm:w-5">{feature.icon}</div>
        </div>
        <div className="min-w-0">
          <div className={dashboardMobileStyles.shortcutTitleText}>
            {feature.title}
          </div>
          {feature.description && (
            <div className={dashboardMobileStyles.shortcutDescription}>
              {feature.description}
            </div>
          )}
        </div>
        <ArrowRight className={dashboardMobileStyles.shortcutArrow} />
      </div>
    </Link>
  )
}

export function MinixFunctionGrid({
  className,
  showTitle = true,
}: {
  className?: string
  showTitle?: boolean
}) {
  return (
    <Card className={cn(dashboardMobileStyles.shortcutCard, className)}>
      {showTitle && (
        <CardHeader className={dashboardMobileStyles.shortcutHeader}>
          <CardTitle className={dashboardMobileStyles.shortcutTitle}>
            快捷操作
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={dashboardMobileStyles.shortcutContent}>
        <div className={dashboardMobileStyles.shortcutGrid}>
          {dashboardFeatures.map((feature) => (
            <FunctionGridItem key={feature.id} feature={feature} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function MinixFunctionGridSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <Card className={cn(dashboardMobileStyles.shortcutCard, className)}>
      <CardHeader className={dashboardMobileStyles.shortcutHeader}>
        <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
      </CardHeader>
      <CardContent className={dashboardMobileStyles.shortcutContent}>
        <div className={dashboardMobileStyles.shortcutGrid}>
          {Array.from({ length: dashboardFeatures.length }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-start gap-2.5 rounded-lg border border-gray-100 bg-white p-3"
            >
              <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-200" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface AlertDetail {
  id: string
  type: string
  title: string
  description: string
  level: 'info' | 'warning' | 'danger' | 'success'
  data?: unknown
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

function buildMinixApiUrl(path: string) {
  const basePath = minixClientEnv.apiBaseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${basePath}${normalizedPath}`
}

export function MinixUnifiedAlertsPanel({ className }: { className?: string }) {
  const navigate = useNavigate()
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
      level: 'info',
      data: room,
      actionText: '查看详情',
      onAction: () => navigate(`/rooms/${room.id}`),
    }))

  const buildLeavingTenantDetails = (contracts: any[] = []): AlertDetail[] =>
    contracts.map((contract: any) => ({
      id: `leaving-${contract.id}`,
      type: 'lease_expiry',
      title: `${contract.renter.name} - ${contract.room.building.name}${contract.room.roomNumber}`,
      description: `合同到期: ${formatDate(contract.endDate)} | 租金: ${formatCurrency(contract.monthlyRent)}/月`,
      level: 'warning',
      data: contract,
      actionText: '联系租客',
      onAction: () => navigate(`/contracts/${contract.id}`),
    }))

  const buildUpcomingContractDetails = (
    contracts: any[] = []
  ): AlertDetail[] =>
    contracts.map((contract: any) => ({
      id: `upcoming-${contract.id}`,
      type: 'upcoming_contracts',
      title: `${contract.renter.name} - ${contract.room.building.name}${contract.room.roomNumber}`,
      description: `待入住生效: ${formatDate(contract.startDate)} | 租金: ${formatCurrency(contract.monthlyRent)}/月 | ${contract.daysUntilStart}天后入住`,
      level: 'info',
      data: contract,
      actionText: '查看合同',
      onAction: () => navigate(`/contracts/${contract.id}`),
    }))

  const buildContractExpiryDetails = (contractAlerts: any[] = []): AlertDetail[] =>
    contractAlerts.map((alert: any) => ({
      id: `contract-${alert.contractId}`,
      type: 'contract_expiry',
      title: `${alert.renterName} - ${alert.roomInfo}`,
      description:
        alert.daysUntilExpiry < 0
          ? `已到期 ${Math.abs(alert.daysUntilExpiry)} 天 | 租金: ${formatCurrency(alert.monthlyRent)}/月`
          : `${alert.daysUntilExpiry} 天后到期 | 租金: ${formatCurrency(alert.monthlyRent)}/月`,
      level:
        alert.daysUntilExpiry < 0
          ? 'danger'
          : alert.daysUntilExpiry <= 7
            ? 'danger'
            : 'warning',
      data: alert,
      actionText: alert.daysUntilExpiry < 0 ? '处理合同' : '续约',
      onAction: () => navigate(`/contracts/${alert.contractId}`),
    }))

  const fetchAlerts = async () => {
    try {
      if (alerts.length === 0) {
        setAlertsLoading(true)
      }
      setAlertsError(null)

      const [
        vacantRoomsRes,
        leavingTenantsRes,
        upcomingContractsRes,
        contractAlertsRes,
      ] = await Promise.all([
        fetch(buildMinixApiUrl('/dashboard/vacant-rooms')),
        fetch(buildMinixApiUrl('/dashboard/leaving-tenants')),
        fetch(buildMinixApiUrl('/dashboard/upcoming-contracts')),
        fetch(buildMinixApiUrl('/dashboard/contract-alerts')),
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
          title: contractAlertsTitle,
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

  useEffect(() => {
    fetchAlerts()
  }, [])

  useEffect(() => {
    selectedAlertRef.current = selectedAlert as AlertType | null
  }, [selectedAlert])

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

  const fetchVacantRoomDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch(buildMinixApiUrl('/dashboard/vacant-rooms'))
    if (!response.ok) throw new Error('获取空房数据失败')
    const data = await response.json()

    return buildVacantRoomDetails(data.data?.rooms)
  }

  const fetchLeavingTenantDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch(buildMinixApiUrl('/dashboard/leaving-tenants'))
    if (!response.ok) throw new Error('获取离店数据失败')
    const data = await response.json()

    return buildLeavingTenantDetails(data.data?.contracts)
  }

  const fetchUpcomingContractDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch(buildMinixApiUrl('/dashboard/upcoming-contracts'))
    if (!response.ok) throw new Error('获取搬入数据失败')
    const data = await response.json()

    return buildUpcomingContractDetails(data.data?.contracts)
  }

  const fetchContractExpiryDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch(buildMinixApiUrl('/dashboard/contract-alerts'))
    if (!response.ok) throw new Error('获取合同到期数据失败')
    const data = await response.json()

    return buildContractExpiryDetails(data.data?.alerts)
  }

  const handleAlertClick = (alertType: AlertType) => {
    if (selectedAlert === alertType) {
      setSelectedAlert(null)
      setAlertDetails([])
    } else {
      setSelectedAlert(alertType)
      fetchAlertDetails(alertType)
    }
  }

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
        return <Calendar className="h-4 w-4" />
    }
  }

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
    return <MinixUnifiedAlertsPanelSkeleton className={className} />
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
                  {alerts.find((item) => item.type === selectedAlert)?.title}详情
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
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-lg bg-gray-100"
                  ></div>
                ))}
              </div>
            ) : alertDetails.length > 0 ? (
              <div className={dashboardMobileStyles.alertDetailsList}>
                {alertDetails.slice(0, 10).map((detail) =>
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
                )}

                {alertDetails.length > 10 && (
                  <div className="pt-1 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-500"
                      onClick={() =>
                        navigate(getAlertViewAllHref(selectedAlert as AlertType))
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

export function MinixUnifiedAlertsPanelSkeleton({
  className,
}: {
  className?: string
}) {
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
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
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

interface UserProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MinixUserProfileSheet({
  open,
  onOpenChange,
}: UserProfileSheetProps) {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  const userInfo = {
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '138****8888',
    role: '管理员',
    joinDate: '2023-01-15',
    location: '北京市朝阳区',
    avatar: 'U',
    status: 'active',
  }

  const userStats = [
    { label: '管理房源', value: '12', color: 'text-blue-600' },
    { label: '活跃合同', value: '8', color: 'text-green-600' },
    { label: '待处理账单', value: '3', color: 'text-orange-600' },
    { label: '总租客数', value: '15', color: 'text-purple-600' },
  ]

  const quickActions = [
    {
      icon: Edit,
      label: '编辑资料',
      description: '修改个人信息',
      onClick: () => {
        onOpenChange(false)
        navigateToMinixOrDocument(navigate, '/profile')
      },
    },
    {
      icon: Settings,
      label: '系统设置',
      description: '应用配置和偏好',
      onClick: () => {
        onOpenChange(false)
        navigate('/settings')
      },
    },
    {
      icon: Bell,
      label: '通知设置',
      description: '管理消息通知',
      onClick: () => {
        onOpenChange(false)
        navigateToMinixOrDocument(navigate, '/notifications')
      },
    },
    {
      icon: Shield,
      label: '账户安全',
      description: '密码和安全设置',
      onClick: () => {
        console.log('账户安全')
      },
    },
    {
      icon: CreditCard,
      label: '账单管理',
      description: '查看账单和付款',
      onClick: () => {
        onOpenChange(false)
        navigate('/bills')
      },
    },
    {
      icon: HelpCircle,
      label: '帮助中心',
      description: '使用指南和支持',
      onClick: () => {
        console.log('帮助中心')
      },
    },
  ]

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      const response = await fetch(buildMinixApiUrl('/auth/logout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '退出登录失败，请稍后重试')
      }

      onOpenChange(false)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('退出登录失败', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'left' : 'right'}
        className={cn(
          'overflow-y-auto',
          isMobile
            ? 'w-[90vw] max-w-none'
            : 'w-[25vw] max-w-[400px] min-w-[320px]'
        )}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            个人中心
          </SheetTitle>
          <SheetDescription>管理您的个人信息和应用设置</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center space-x-4 rounded-lg bg-gray-50 p-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
              <span className="text-xl font-bold text-white">
                {userInfo.avatar}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-gray-900">
                  {userInfo.name}
                </h3>
                <Badge
                  variant={
                    userInfo.status === 'active' ? 'default' : 'secondary'
                  }
                  className="text-xs"
                >
                  {userInfo.status === 'active' ? '活跃' : '非活跃'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{userInfo.role}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">联系信息</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="truncate text-gray-900">{userInfo.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="text-gray-900">{userInfo.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="text-gray-900">
                  加入于 {userInfo.joinDate}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="truncate text-gray-900">
                  {userInfo.location}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">数据概览</h4>
            <div className="grid grid-cols-2 gap-3">
              {userStats.map((stat, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-gray-50 p-3 text-center"
                >
                  <div className={`text-xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">快捷操作</h4>
            <div className="space-y-2">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <IconComponent className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {action.label}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {action.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full justify-start border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? '退出中...' : '退出登录'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
