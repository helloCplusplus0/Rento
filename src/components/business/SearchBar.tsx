'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import { dashboardMobileStyles } from '@/components/business/dashboard-mobile-styles'
import { getWorkbenchSearchHref } from '@/lib/workbench-search'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  placeholder?: string
  className?: string
  showButton?: boolean
}

/**
 * 搜索栏组件
 * 工作台快速跳转搜索入口
 * 用于直接跳转房源或合同主链页面
 */
export function SearchBar({
  placeholder = '搜索房源、合同',
  className,
  showButton = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    const targetHref = getWorkbenchSearchHref(query)

    if (targetHref) {
      router.push(targetHref)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={cn(dashboardMobileStyles.quickSearchRow, className)}>
      <div className={dashboardMobileStyles.searchWrap}>
        <Search className={dashboardMobileStyles.searchIcon} />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={dashboardMobileStyles.searchInput}
          onKeyDown={handleKeyDown}
        />
        {!showButton && (
          <button
            type="button"
            onClick={handleSearch}
            className={dashboardMobileStyles.searchSubmitIcon}
            disabled={!query.trim()}
            aria-label="执行搜索"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
      </div>
      {showButton && (
        <Button
          onClick={handleSearch}
          className={dashboardMobileStyles.searchButton}
          disabled={!query.trim()}
        >
          搜索
        </Button>
      )}
    </div>
  )
}

/**
 * 搜索栏骨架屏
 */
export function SearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="relative flex-1">
        <div className="h-10 animate-pulse rounded-md bg-gray-200"></div>
      </div>
      <div className="h-10 w-12 animate-pulse rounded-md bg-gray-200"></div>
    </div>
  )
}
