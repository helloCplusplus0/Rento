'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BillStatusFilterProps {
  selectedStatus: string | null
  onStatusChange: (status: string | null) => void
  statusCounts: Record<string, number>
}

const statusOptions = [
  { value: null, label: '全部', color: 'default' },
  { value: 'PENDING', label: '待付款', color: 'orange' },
  { value: 'PAID', label: '部分付款', color: 'green' },
  { value: 'OVERDUE', label: '逾期', color: 'red' },
  { value: 'COMPLETED', label: '已完成', color: 'blue' },
]

/**
 * 账单状态筛选组件
 * 支持按账单状态筛选，显示各状态的数量统计
 */
export function BillStatusFilter({
  selectedStatus,
  onStatusChange,
  statusCounts,
}: BillStatusFilterProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-gray-900">账单状态</h3>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => {
          const count = option.value
            ? statusCounts[option.value] || 0
            : Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
          const isSelected = selectedStatus === option.value

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
              <span>{option.label}</span>
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
