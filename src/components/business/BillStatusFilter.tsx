'use client'

import {
  getBillPresentationStatusLabel,
  type BillPresentationStats,
  type BillPresentationStatus,
} from '@/lib/bill-semantics'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BillStatusFilterProps {
  selectedStatus: string | null
  onStatusChange: (status: string | null) => void
  presentationStats: BillPresentationStats
}

const statusOptions = [
  { value: null, label: '全部', color: 'default' },
  { value: 'OPEN', color: 'orange' },
  { value: 'SETTLED', color: 'green' },
  { value: 'OVERDUE', color: 'red' },
]

/**
 * 账单状态筛选组件
 * 支持按账单状态筛选，显示各状态的数量统计
 */
export function BillStatusFilter({
  selectedStatus,
  onStatusChange,
  presentationStats,
}: BillStatusFilterProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-gray-900">账单状态</h3>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => {
          const count =
            option.value === null
              ? presentationStats.totalCount
              : option.value === 'OPEN'
                ? presentationStats.openCount
                : option.value === 'SETTLED'
                  ? presentationStats.settledCount
                  : presentationStats.overdueCount
          const isSelected = selectedStatus === option.value
          const label =
            option.value === null
              ? option.label
              : getBillPresentationStatusLabel(
                  option.value as BillPresentationStatus
                )

          return (
            <Button
              key={option.value || 'all'}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(option.value)}
              className={cn(
                'flex items-center gap-2',
                isSelected && 'bg-primary text-primary-foreground'
              )}
            >
              <span>{label}</span>
              <Badge variant="secondary" className="text-xs">
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
