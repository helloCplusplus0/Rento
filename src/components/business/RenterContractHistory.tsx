'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, DollarSign, FileText, Eye } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/format'

interface RenterContractHistoryProps {
  contracts: any[]
  onContractClick?: (contract: any) => void
}

export function RenterContractHistory({ contracts, onContractClick }: RenterContractHistoryProps) {
  if (!contracts || contracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">合同历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无合同记录</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'EXPIRED':
        return 'secondary'
      case 'TERMINATED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '生效中'
      case 'EXPIRED':
        return '已到期'
      case 'TERMINATED':
        return '已终止'
      default:
        return status
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">合同历史</CardTitle>
        <p className="text-sm text-gray-500">共 {contracts.length} 个合同</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">
                      {contract.contractNumber}
                    </h4>
                    <Badge variant={getStatusColor(contract.status)}>
                      {getStatusText(contract.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {contract.room.building.name} - {contract.room.roomNumber}
                  </div>
                </div>
                
                {onContractClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onContractClick(contract)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    查看
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">合同期限</div>
                    <div>
                      {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">月租金</div>
                    <div className="font-medium">
                      {formatCurrency(contract.monthlyRent)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">押金</div>
                    <div className="font-medium">
                      {formatCurrency(contract.deposit)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 账单统计 */}
              {contract.bills && contract.bills.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-500 mb-1">账单统计</div>
                  <div className="flex space-x-4 text-sm">
                    <span>总计: {contract.bills.length} 个</span>
                    <span className="text-green-600">
                      已付: {contract.bills.filter((b: any) => b.status === 'PAID').length} 个
                    </span>
                    <span className="text-red-600">
                      待付: {contract.bills.filter((b: any) => b.status === 'PENDING').length} 个
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}