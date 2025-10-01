'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { UserProfileSheet } from './UserProfileSheet'

interface MobileSearchBarProps {
  placeholder?: string
  className?: string
}

/**
 * 移动端搜索栏组件
 * 包含用户头像、搜索框和筛选按钮的水平排列设计
 */
export function MobileSearchBar({
  placeholder = '搜索房源、合同',
  className,
}: MobileSearchBarProps) {
  const [query, setQuery] = useState('')
  const [showUserSheet, setShowUserSheet] = useState(false)
  const router = useRouter()

  const handleSearch = () => {
    if (!query.trim()) return

    // 根据查询内容判断搜索类型
    if (query.includes('C') || query.includes('合同') || query.includes('CT')) {
      router.push(`/contracts?search=${encodeURIComponent(query)}`)
    } else {
      router.push(`/rooms?search=${encodeURIComponent(query)}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleUserClick = () => {
    setShowUserSheet(true)
  }

  return (
    <>
      <div className={cn('flex items-center space-x-3', className)}>
        {/* 用户头像按钮 */}
        <button
          onClick={handleUserClick}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 transition-colors hover:bg-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          aria-label="用户菜单"
        >
          <span className="text-sm font-medium text-gray-700">U</span>
        </button>

        {/* 搜索区域 */}
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="h-10 border-gray-200 bg-gray-50 pl-10 focus:border-blue-300 focus:bg-white"
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearch}
            className="h-10 flex-shrink-0 border-gray-200 px-3 hover:bg-gray-50"
            disabled={!query.trim()}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 用户资料抽屉 */}
      <UserProfileSheet open={showUserSheet} onOpenChange={setShowUserSheet} />
    </>
  )
}

/**
 * 移动端搜索栏骨架屏
 */
export function MobileSearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {/* 用户头像骨架屏 */}
      <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-gray-200"></div>

      {/* 搜索区域骨架屏 */}
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1">
          <div className="h-10 animate-pulse rounded-md bg-gray-200"></div>
        </div>
        <div className="h-10 w-12 flex-shrink-0 animate-pulse rounded-md bg-gray-200"></div>
      </div>
    </div>
  )
}
