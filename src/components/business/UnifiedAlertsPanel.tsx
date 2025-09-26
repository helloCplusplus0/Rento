'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Eye, RefreshCw, Calendar, Home, Users, CreditCard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/format'
import { defaultAlerts } from './dashboard-home'

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
        case 'overdue_payment':
          details = await fetchOverduePaymentDetails()
          break
        case 'contract_expiry':
          details = await fetchContractExpiryDetails()
          break
        case 'unpaid_rent':
          details = await fetchUnpaidRentDetails()
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
    
    return data.rooms?.map((room: any) => ({
      id: `vacant-${room.id}`,
      type: 'room_check',
      title: `${room.building.name} - ${room.roomNumber}`,
      description: `租金: ${formatCurrency(room.rent)}/月 | 面积: ${room.area || '未知'}㎡`,
      level: 'info' as const,
      data: room,
      actionText: '查看详情',
      onAction: () => window.location.href = `/rooms/${room.id}`
    })) || []
  }

  // 获取30天离店详情
  const fetchLeavingTenantDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/leaving-tenants')
    if (!response.ok) throw new Error('获取离店数据失败')
    const data = await response.json()
    
    return data.contracts?.map((contract: any) => ({
      id: `leaving-${contract.id}`,
      type: 'lease_expiry',
      title: `${contract.renter.name} - ${contract.room.building.name}${contract.room.roomNumber}`,
      description: `合同到期: ${formatDate(contract.endDate)} | 租金: ${formatCurrency(contract.monthlyRent)}/月`,
      level: 'warning' as const,
      data: contract,
      actionText: '联系租客',
      onAction: () => window.location.href = `/contracts/${contract.id}`
    })) || []
  }

  // 获取逾期付款详情
  const fetchOverduePaymentDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/overdue-payments')
    if (!response.ok) throw new Error('获取逾期数据失败')
    const data = await response.json()
    
    return data.bills?.map((bill: any) => ({
      id: `overdue-${bill.id}`,
      type: 'overdue_payment',
      title: `${bill.contract.renter.name} - ${bill.billNumber}`,
      description: `逾期金额: ${formatCurrency(bill.pendingAmount)} | 逾期天数: ${Math.ceil((Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24))}天`,
      level: 'danger' as const,
      data: bill,
      actionText: '催收',
      onAction: () => window.location.href = `/bills/${bill.id}`
    })) || []
  }

  // 获取合同到期详情
  const fetchContractExpiryDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/contract-alerts')
    if (!response.ok) throw new Error('获取合同到期数据失败')
    const data = await response.json()
    
    return data.alerts?.map((alert: any) => ({
      id: `contract-${alert.contractId}`,
      type: 'contract_expiry',
      title: `${alert.renterName} - ${alert.roomInfo}`,
      description: alert.daysUntilExpiry < 0 
        ? `已逾期 ${Math.abs(alert.daysUntilExpiry)} 天 | 租金: ${formatCurrency(alert.monthlyRent)}/月`
        : `${alert.daysUntilExpiry} 天后到期 | 租金: ${formatCurrency(alert.monthlyRent)}/月`,
      level: alert.daysUntilExpiry < 0 ? 'danger' as const : 
             alert.daysUntilExpiry <= 7 ? 'danger' as const : 'warning' as const,
      data: alert,
      actionText: alert.daysUntilExpiry < 0 ? '处理逾期' : '续约',
      onAction: () => window.location.href = `/contracts/${alert.contractId}`
    })) || []
  }

  // 获取退租未结详情
  const fetchUnpaidRentDetails = async (): Promise<AlertDetail[]> => {
    const response = await fetch('/api/dashboard/unpaid-rent')
    if (!response.ok) throw new Error('获取退租数据失败')
    const data = await response.json()
    
    return data.contracts?.map((contract: any) => ({
      id: `unpaid-${contract.id}`,
      type: 'unpaid_rent',
      title: `${contract.renter.name} - ${contract.room.building.name}${contract.room.roomNumber}`,
      description: `退租日期: ${formatDate(contract.endDate)} | 待结算: ${formatCurrency(contract.pendingAmount || 0)}`,
      level: 'warning' as const,
      data: contract,
      actionText: '结算',
      onAction: () => window.location.href = `/contracts/${contract.id}`
    })) || []
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
        return <Home className="w-4 h-4" />
      case 'lease_expiry':
        return <Users className="w-4 h-4" />
      case 'overdue_payment':
        return <CreditCard className="w-4 h-4" />
      case 'contract_expiry':
        return <AlertTriangle className="w-4 h-4" />
      case 'unpaid_rent':
        return <LogOut className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
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

  return (
    <div className={cn('bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        提醒
        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
      </h3>
      
      {/* 提醒概览网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {defaultAlerts.map(alert => (
          <button
            key={alert.id}
            onClick={() => handleAlertClick(alert.type)}
            className={cn(
              'text-center p-3 rounded-lg transition-all hover:shadow-md',
              selectedAlert === alert.type 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            )}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl mb-2 mx-auto ${
              alert.color === 'red' ? 'bg-red-500' :
              alert.color === 'orange' ? 'bg-orange-500' :
              alert.color === 'blue' ? 'bg-blue-500' :
              alert.color === 'green' ? 'bg-green-500' :
              'bg-gray-500'
            }`}>
              {alert.count}
            </div>
            <div className="text-xs text-gray-600">
              {alert.title}
            </div>
          </button>
        ))}
      </div>

      {/* 详细信息展示区域 */}
      {selectedAlert && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              {getAlertIcon(selectedAlert)}
              {defaultAlerts.find(a => a.type === selectedAlert)?.title}详情
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchAlertDetails(selectedAlert)}
              disabled={loading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : alertDetails.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alertDetails.slice(0, 10).map((detail) => (
                <Card
                  key={detail.id}
                  className={cn('border transition-all hover:shadow-sm', getLevelColor(detail.level))}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {detail.title}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {detail.description}
                        </div>
                      </div>
                      
                      {detail.onAction && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={detail.onAction}
                          className="ml-2 text-xs"
                        >
                          {detail.actionText}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {alertDetails.length > 10 && (
                <div className="text-center pt-2">
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
            <div className="text-center py-4 text-gray-500 text-sm">
              暂无相关提醒
            </div>
          )}
        </div>
      )}
    </div>
  )
}