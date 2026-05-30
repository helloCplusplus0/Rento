'use client'

import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { contractListMobileStyles } from '@/components/business/contract-list-mobile-styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ContractSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string | null
  onStatusChange: (status: string | null) => void
  filterCounts: {
    total: number
    active: number
    pending: number
    expiringSoon: number
    expired: number
    terminated: number
  }
  loading?: boolean
}

export function ContractSearchBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  filterCounts,
  loading = false,
}: ContractSearchBarProps) {
  const filterOptions = [
    { value: 'all', label: '全部', count: filterCounts.total },
    { value: 'ACTIVE', label: '生效中', count: filterCounts.active },
    { value: 'PENDING', label: '待生效', count: filterCounts.pending },
    { value: 'expiring_soon', label: '即将到期', count: filterCounts.expiringSoon },
    { value: 'EXPIRED', label: '已到期', count: filterCounts.expired },
    { value: 'TERMINATED', label: '已终止', count: filterCounts.terminated },
  ]

  return (
    <div className={contractListMobileStyles.toolbarStack}>
      <div className={contractListMobileStyles.toolbarCard}>
        <div className={contractListMobileStyles.toolbarRow}>
          <div className={contractListMobileStyles.searchWrap}>
            <Search className={contractListMobileStyles.searchIcon} />
            <Input
              placeholder="搜索合同号、租客姓名、房间号..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={contractListMobileStyles.searchInput}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className={contractListMobileStyles.filterCard}>
        <div className={contractListMobileStyles.filterSection}>
          <div className={contractListMobileStyles.filterHeader}>状态筛选</div>
          <div className={contractListMobileStyles.filterActions}>
            {filterOptions.map((option) => {
              const isActive =
                (statusFilter ?? 'all') ===
                (option.value === 'all' ? 'all' : option.value)
              const isExpiryOption = option.value === 'expiring_soon'
              const shouldHighlightExpiry = isExpiryOption && option.count > 0

              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    onStatusChange(option.value === 'all' ? null : option.value)
                  }
                  disabled={loading}
                  className={cn(
                    contractListMobileStyles.filterButton,
                    shouldHighlightExpiry &&
                      !isActive &&
                      contractListMobileStyles.filterAlertButton,
                    shouldHighlightExpiry &&
                      isActive &&
                      contractListMobileStyles.filterAlertButtonActive
                  )}
                >
                  <span>{option.label}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      contractListMobileStyles.filterCount,
                      shouldHighlightExpiry &&
                        contractListMobileStyles.filterAlertCount
                    )}
                  >
                    {option.count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
