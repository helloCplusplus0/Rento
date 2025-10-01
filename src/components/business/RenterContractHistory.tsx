'use client'

import { Calendar, DollarSign, Eye, FileText, MapPin } from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RenterContractHistoryProps {
  contracts: any[]
  onContractClick?: (contract: any) => void
}

export function RenterContractHistory({
  contracts,
  onContractClick,
}: RenterContractHistoryProps) {
  if (!contracts || contracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">合同历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
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
              className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">
                      {contract.contractNumber}
                    </h4>
                    <Badge variant={getStatusColor(contract.status)}>
                      {getStatusText(contract.status)}
                    </Badge>
                  </div>

                  <div className="mb-2 flex items-center text-sm text-gray-600">
                    <MapPin className="mr-1 h-4 w-4" />
                    {contract.room.building.name} - {contract.room.roomNumber}
                  </div>
                </div>

                {onContractClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onContractClick(contract)}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    查看
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="mr-2 h-4 w-4" />
                  <div>
                    <div className="text-xs text-gray-500">合同期限</div>
                    <div>
                      {formatDate(contract.startDate)} -{' '}
                      {formatDate(contract.endDate)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <DollarSign className="mr-2 h-4 w-4" />
                  <div>
                    <div className="text-xs text-gray-500">月租金</div>
                    <div className="font-medium">
                      {formatCurrency(contract.monthlyRent)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <DollarSign className="mr-2 h-4 w-4" />
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
                <div className="mt-3 border-t pt-3">
                  <div className="mb-1 text-xs text-gray-500">账单统计</div>
                  <div className="flex space-x-4 text-sm">
                    <span>总计: {contract.bills.length} 个</span>
                    <span className="text-green-600">
                      已付:{' '}
                      {
                        contract.bills.filter((b: any) => b.status === 'PAID')
                          .length
                      }{' '}
                      个
                    </span>
                    <span className="text-red-600">
                      待付:{' '}
                      {
                        contract.bills.filter(
                          (b: any) => b.status === 'PENDING'
                        ).length
                      }{' '}
                      个
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
