'use client'

import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { renterListMobileStyles } from '@/components/business/renter-list-mobile-styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RenterSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  renterFilter: string | null
  onRenterFilterChange: (status: string | null) => void
  filterCounts: {
    total: number
    active: number
    inactive: number
    newThisMonth: number
  }
  loading?: boolean
}

export function RenterSearchBar({
  searchQuery,
  onSearchChange,
  renterFilter,
  onRenterFilterChange,
  filterCounts,
  loading = false,
}: RenterSearchBarProps) {
  const filterOptions = [
    { value: 'all', label: '全部', count: filterCounts.total },
    { value: 'active', label: '在租', count: filterCounts.active },
    { value: 'inactive', label: '空闲', count: filterCounts.inactive },
    { value: 'new_this_month', label: '本月新增', count: filterCounts.newThisMonth },
  ]

  return (
    <div className={renterListMobileStyles.toolbarStack}>
      <div className={renterListMobileStyles.toolbarCard}>
        <div className={renterListMobileStyles.toolbarRow}>
          <div className={renterListMobileStyles.searchWrap}>
            <Search className={renterListMobileStyles.searchIcon} />
            <Input
              placeholder="搜索租客姓名、手机号、身份证号..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={renterListMobileStyles.searchInput}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className={renterListMobileStyles.filterCard}>
        <div className={renterListMobileStyles.filterSection}>
          <div className={renterListMobileStyles.filterHeader}>状态筛选</div>
          <div className={renterListMobileStyles.filterActions}>
            {filterOptions.map((option) => {
              const isActive =
                (renterFilter ?? 'all') ===
                (option.value === 'all' ? 'all' : option.value)
              const isNewOption = option.value === 'new_this_month'
              const shouldHighlightNew = isNewOption && option.count > 0

              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    onRenterFilterChange(option.value === 'all' ? null : option.value)
                  }
                  disabled={loading}
                  className={cn(
                    renterListMobileStyles.filterButton,
                    shouldHighlightNew &&
                      !isActive &&
                      renterListMobileStyles.filterHighlightButton,
                    shouldHighlightNew &&
                      isActive &&
                      renterListMobileStyles.filterHighlightButtonActive
                  )}
                >
                  <span>{option.label}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      renterListMobileStyles.filterCount,
                      shouldHighlightNew &&
                        renterListMobileStyles.filterHighlightCount
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
