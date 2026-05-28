'use client'

import {
  Calendar,
  Droplets,
  Edit,
  Eye,
  FileText,
  Flame,
  Zap,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AggregatedBillTemplateCard } from '@/components/business/AggregatedBillTemplateCard'

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
  onEditBill,
}: UtilityBillDetailCardProps) {
  // 解析metadata中的水电费明细
  const utilityDetails = bill.metadata
    ? JSON.parse(bill.metadata).utilityDetails
    : null
  const breakdown = utilityDetails?.breakdown || {}

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'orange'
      case 'PAID':
        return 'green'
      case 'OVERDUE':
        return 'red'
      case 'COMPLETED':
        return 'blue'
      default:
        return 'gray'
    }
  }

  // 获取仪表类型图标
  const getMeterIcon = (meterType: string) => {
    switch (meterType) {
      case 'ELECTRICITY':
        return <Zap className="h-4 w-4 text-yellow-500" />
      case 'COLD_WATER':
      case 'HOT_WATER':
        return <Droplets className="h-4 w-4 text-blue-500" />
      case 'GAS':
        return <Flame className="h-4 w-4 text-orange-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取仪表类型标签
  const getMeterTypeLabel = (meterType: string) => {
    switch (meterType) {
      case 'ELECTRICITY':
        return '电表'
      case 'COLD_WATER':
        return '冷水表'
      case 'HOT_WATER':
        return '热水表'
      case 'GAS':
        return '燃气表'
      default:
        return '未知'
    }
  }

  return (
    <AggregatedBillTemplateCard
      title="水电费账单"
      badgeText={
        bill.status === 'PENDING'
          ? '待付款'
          : bill.status === 'PAID'
            ? '已收款'
            : bill.status === 'OVERDUE'
              ? '逾期'
              : '已完成'
      }
      badgeClassName={`border-current ${getStatusColor(bill.status) === 'orange' ? 'bg-orange-50 text-orange-700' : ''} ${getStatusColor(bill.status) === 'green' ? 'bg-green-50 text-green-700' : ''} ${getStatusColor(bill.status) === 'red' ? 'bg-red-50 text-red-700' : ''} ${getStatusColor(bill.status) === 'blue' ? 'bg-blue-50 text-blue-700' : ''}`}
      actionSlot={
        <div className="flex items-center gap-2">
          {onViewReading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewReading(bill.id)}
            >
              <Eye className="mr-1 h-4 w-4" />
              查看抄表
            </Button>
          )}
          {onEditBill && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditBill(bill.id)}
            >
              <Edit className="mr-1 h-4 w-4" />
              编辑
            </Button>
          )}
        </div>
      }
      metaItems={[
        {
          label: '账单编号',
          value: bill.billNumber,
        },
        {
          label: '房间信息',
          value: `${bill.contract.room.building.name} - ${bill.contract.room.roomNumber}`,
        },
        {
          label: '租客姓名',
          value: bill.contract.renter.name,
        },
        {
          label: '账期',
          value: bill.period,
        },
      ]}
      summaryItems={[
        {
          label: '应收金额',
          value: `¥${bill.amount.toFixed(2)}`,
          accentClassName: 'text-blue-600',
        },
        {
          label: '已收金额',
          value: `¥${bill.receivedAmount.toFixed(2)}`,
          accentClassName: 'text-green-600',
        },
        {
          label: '待收金额',
          value: `¥${bill.pendingAmount.toFixed(2)}`,
          accentClassName: 'text-orange-600',
        },
        {
          label: '到期日期',
          value: (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-5 w-5" />
              {new Date(bill.dueDate).toLocaleDateString()}
            </span>
          ),
          accentClassName: 'text-purple-600',
        },
      ]}
      breakdownTitle="费用明细"
      breakdownItems={
        showMeterBreakdown && breakdown
          ? [
              ...(breakdown.electricity && breakdown.electricity.usage > 0
                ? [
                    {
                      id: 'electricity',
                      title: '电费',
                      description: `${breakdown.electricity.usage}度 × ¥${breakdown.electricity.unitPrice}/度`,
                      amount: `¥${breakdown.electricity.amount.toFixed(2)}`,
                      icon: getMeterIcon('ELECTRICITY'),
                      containerClassName: 'bg-yellow-50',
                      amountClassName: 'text-yellow-600',
                    },
                  ]
                : []),
              ...(breakdown.water && breakdown.water.usage > 0
                ? [
                    {
                      id: 'water',
                      title: '水费',
                      description: `${breakdown.water.usage}吨 × ¥${breakdown.water.unitPrice}/吨`,
                      amount: `¥${breakdown.water.amount.toFixed(2)}`,
                      icon: getMeterIcon('COLD_WATER'),
                      containerClassName: 'bg-blue-50',
                      amountClassName: 'text-blue-600',
                    },
                  ]
                : []),
              ...(breakdown.gas && breakdown.gas.usage > 0
                ? [
                    {
                      id: 'gas',
                      title: '燃气费',
                      description: `${breakdown.gas.usage}立方米 × ¥${breakdown.gas.unitPrice}/立方米`,
                      amount: `¥${breakdown.gas.amount.toFixed(2)}`,
                      icon: getMeterIcon('GAS'),
                      containerClassName: 'bg-orange-50',
                      amountClassName: 'text-orange-600',
                    },
                  ]
                : []),
            ]
          : []
      }
      emptyBreakdownText="暂无可展示的水电费明细。"
      footer={
        bill.remarks ? (
          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-gray-600">
            <span className="font-medium">备注: </span>
            {bill.remarks}
          </div>
        ) : undefined
      }
    />
  )
}
