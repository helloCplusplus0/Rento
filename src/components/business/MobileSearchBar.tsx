'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  placeholder = "搜索房源、合同", 
  className 
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
      <div className={cn("flex items-center space-x-3", className)}>
        {/* 用户头像按钮 */}
        <button
          onClick={handleUserClick}
          className="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
          aria-label="用户菜单"
        >
          <span className="text-sm font-medium text-gray-700">U</span>
        </button>

        {/* 搜索区域 */}
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSearch}
            className="h-10 px-3 border-gray-200 hover:bg-gray-50 flex-shrink-0"
            disabled={!query.trim()}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 用户资料抽屉 */}
      <UserProfileSheet 
        open={showUserSheet} 
        onOpenChange={setShowUserSheet} 
      />
    </>
  )
}

/**
 * 移动端搜索栏骨架屏
 */
export function MobileSearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* 用户头像骨架屏 */}
      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
      
      {/* 搜索区域骨架屏 */}
      <div className="flex items-center space-x-2 flex-1">
        <div className="relative flex-1">
          <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-12 bg-gray-200 rounded-md animate-pulse flex-shrink-0"></div>
      </div>
    </div>
  )
}