'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Zap, 
  Droplets, 
  Flame, 
  Calendar, 
  DollarSign, 
  FileText,
  Eye,
  Edit
} from 'lucide-react'

interface MeterBillDetail {
  meterId: string
  meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  meterName: string
  usage: number
  unitPrice: number
  amount: number
  readingPeriod: string
}

interface UtilityBillDetail {
  id: string
  billNumber: string
  type: 'UTILITIES'
  amount: number
  receivedAmount: number
  pendingAmount: number
  dueDate: string
  period: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'COMPLETED'
  remarks?: string
  metadata?: string
  contract: {
    contractNumber: string
    room: {
      roomNumber: string
      building: {
        name: string
      }
    }
    renter: {
      name: string
    }
  }
}

interface UtilityBillDetailCardProps {
  bill: UtilityBillDetail
  showMeterBreakdown?: boolean
  showReadingHistory?: boolean
  onViewReading?: (readingId: string) => void
  onEditBill?: (billId: string) => void
}

export function UtilityBillDetailCard({
  bill,
  showMeterBreakdown = true,
  showReadingHistory = false,
  onViewReading,
  onEditBill
}: UtilityBillDetailCardProps) {
  // 解析metadata中的水电费明细
  const utilityDetails = bill.metadata ? JSON.parse(bill.metadata).utilityDetails : null
  const breakdown = utilityDetails?.breakdown || {}

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange'
      case 'PAID': return 'green'
      case 'OVERDUE': return 'red'
      case 'COMPLETED': return 'blue'
      default: return 'gray'
    }
  }

  // 获取仪表类型图标
  const getMeterIcon = (meterType: string) => {
    switch (meterType) {
      case 'ELECTRICITY': return <Zap className="w-4 h-4 text-yellow-500" />
      case 'COLD_WATER':
      case 'HOT_WATER': return <Droplets className="w-4 h-4 text-blue-500" />
      case 'GAS': return <Flame className="w-4 h-4 text-orange-500" />
      default: return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  // 获取仪表类型标签
  const getMeterTypeLabel = (meterType: string) => {
    switch (meterType) {
      case 'ELECTRICITY': return '电表'
      case 'COLD_WATER': return '冷水表'
      case 'HOT_WATER': return '热水表'
      case 'GAS': return '燃气表'
      default: return '未知'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">水电费账单</CardTitle>
            </div>
            <Badge variant="outline" color={getStatusColor(bill.status)}>
              {bill.status === 'PENDING' ? '待付款' : 
               bill.status === 'PAID' ? '已付款' : 
               bill.status === 'OVERDUE' ? '逾期' : '已完成'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {onViewReading && (
              <Button variant="outline" size="sm" onClick={() => onViewReading(bill.id)}>
                <Eye className="w-4 h-4 mr-1" />
                查看抄表
              </Button>
            )}
            {onEditBill && (
              <Button variant="outline" size="sm" onClick={() => onEditBill(bill.id)}>
                <Edit className="w-4 h-4 mr-1" />
                编辑
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">账单编号：</span>
            <span className="font-medium block">{bill.billNumber}</span>
          </div>
          <div>
            <span className="text-gray-500">房间信息：</span>
            <span className="font-medium block">
              {bill.contract.room.building.name} - {bill.contract.room.roomNumber}
            </span>
          </div>
          <div>
            <span className="text-gray-500">租客姓名：</span>
            <span className="font-medium block">{bill.contract.renter.name}</span>
          </div>
          <div>
            <span className="text-gray-500">账期：</span>
            <span className="font-medium block">{bill.period}</span>
          </div>
        </div>

        <Separator />

        {/* 费用汇总 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                ¥{bill.amount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">应收金额</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ¥{bill.receivedAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">已收金额</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                ¥{bill.pendingAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">待收金额</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                <Calendar className="w-5 h-5 inline mr-1" />
                {new Date(bill.dueDate).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-500">到期日期</div>
            </div>
          </div>
        </div>

        {/* 水电费明细 */}
        {showMeterBreakdown && breakdown && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                费用明细
              </h4>
              <div className="space-y-3">
                {/* 电费明细 */}
                {breakdown.electricity && breakdown.electricity.usage > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getMeterIcon('ELECTRICITY')}
                      <div>
                        <div className="font-medium">电费</div>
                        <div className="text-sm text-gray-500">
                          {breakdown.electricity.usage}度 × ¥{breakdown.electricity.unitPrice}/度
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-yellow-600">
                        ¥{breakdown.electricity.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 水费明细 */}
                {breakdown.water && breakdown.water.usage > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getMeterIcon('COLD_WATER')}
                      <div>
                        <div className="font-medium">水费</div>
                        <div className="text-sm text-gray-500">
                          {breakdown.water.usage}吨 × ¥{breakdown.water.unitPrice}/吨
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        ¥{breakdown.water.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 燃气费明细 */}
                {breakdown.gas && breakdown.gas.usage > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getMeterIcon('GAS')}
                      <div>
                        <div className="font-medium">燃气费</div>
                        <div className="text-sm text-gray-500">
                          {breakdown.gas.usage}立方米 × ¥{breakdown.gas.unitPrice}/立方米
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600">
                        ¥{breakdown.gas.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 备注信息 */}
        {bill.remarks && (
          <>
            <Separator />
            <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
              <span className="font-medium">备注: </span>
              {bill.remarks}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}