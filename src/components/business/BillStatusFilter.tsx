'use client'

import {
  getBillPresentationStatusLabel,
  type BillPresentationStats,
  type BillPresentationStatus,
} from '@/lib/bill-semantics'
import { cn } from '@/lib/utils'
import { billListMobileStyles } from '@/components/business/bill-list-mobile-styles'
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
    <div className={billListMobileStyles.filterCard}>
      <h3 className={billListMobileStyles.filterTitle}>账单状态</h3>
      <div className={billListMobileStyles.filterActions}>
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
                billListMobileStyles.filterButton,
                isSelected && 'bg-primary text-primary-foreground'
              )}
            >
              <span>{label}</span>
              <Badge
                variant="secondary"
                className={billListMobileStyles.filterCountBadge}
              >
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
