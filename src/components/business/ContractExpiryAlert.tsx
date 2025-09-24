'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, XCircle, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/format'

interface ContractExpiryAlert {
  id: string
  contractId: string
  contractNumber: string
  renterName: string
  roomInfo: string
  endDate: Date
  daysUntilExpiry: number
  alertType: 'warning' | 'danger' | 'expired'
}

interface ContractExpiryAlertProps {
  alerts: ContractExpiryAlert[]
  onRenewContract?: (contractId: string) => void
  onDismissAlert?: (alertId: string) => void
}

export function ContractExpiryAlert({ 
  alerts, 
  onRenewContract,
  onDismissAlert 
}: ContractExpiryAlertProps) {
  if (alerts.length === 0) {
    return null
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-4 h-4" />
      case 'expired':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'border-red-200 bg-red-50'
      case 'expired':
        return 'border-gray-200 bg-gray-50'
      default:
        return 'border-orange-200 bg-orange-50'
    }
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'danger':
        return 'destructive'
      case 'expired':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getAlertText = (alert: ContractExpiryAlert) => {
    if (alert.daysUntilExpiry < 0) {
      return `已逾期 ${Math.abs(alert.daysUntilExpiry)} 天`
    } else if (alert.daysUntilExpiry === 0) {
      return '今日到期'
    } else {
      return `${alert.daysUntilExpiry} 天后到期`
    }
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            合同到期提醒
          </CardTitle>
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            {alerts.length} 个合同需要关注
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getAlertColor(alert.alertType)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getAlertIcon(alert.alertType)}
                    <span className="font-medium text-gray-900">
                      {alert.contractNumber}
                    </span>
                    <Badge variant={getBadgeVariant(alert.alertType)} className="text-xs">
                      {getAlertText(alert)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    租客: {alert.renterName} | 房间: {alert.roomInfo}
                  </div>
                  <div className="text-xs text-gray-500">
                    到期日期: {formatDate(alert.endDate)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {onRenewContract && alert.alertType !== 'expired' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRenewContract(alert.contractId)}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      续约
                    </Button>
                  )}
                  {onDismissAlert && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDismissAlert(alert.id)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      忽略
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {alerts.length > 3 && (
          <div className="mt-3 pt-3 border-t text-center">
            <Button variant="ghost" size="sm" className="text-xs text-gray-500">
              查看全部 {alerts.length} 个提醒
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}