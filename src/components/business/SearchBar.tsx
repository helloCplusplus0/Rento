'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  placeholder?: string
  className?: string
}

/**
 * 搜索栏组件
 * 支持房源和合同搜索，提供统一的搜索入口
 */
export function SearchBar({
  placeholder = '搜索房源、合同',
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    if (!query.trim()) return

    // 根据查询内容判断搜索类型
    // 如果包含合同相关关键词，优先搜索合同
    if (query.includes('C') || query.includes('合同') || query.includes('CT')) {
      router.push(`/contracts?search=${encodeURIComponent(query)}`)
    } else {
      // 默认搜索房源
      router.push(`/rooms?search=${encodeURIComponent(query)}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
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
        className="h-10 border-gray-200 px-3 hover:bg-gray-50"
        disabled={!query.trim()}
      >
        <Filter className="h-4 w-4" />
      </Button>
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
