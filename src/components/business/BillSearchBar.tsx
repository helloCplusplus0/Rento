'use client'

import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { billListMobileStyles } from '@/components/business/bill-list-mobile-styles'

interface BillSearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * 账单搜索栏组件
 * 支持按账单号、租客姓名、房间号等关键词搜索
 */
export function BillSearchBar({
  placeholder = '搜索账单...',
  value,
  onChange,
  className,
}: BillSearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className={billListMobileStyles.searchIcon} />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={billListMobileStyles.searchInput}
      />
    </div>
  )
}
