'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  className?: string
}

/**
 * 搜索栏组件
 * 支持房源和合同搜索，提供统一的搜索入口
 */
export function SearchBar({ 
  placeholder = "搜索房源、合同", 
  className 
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
    <div className={cn("flex items-center space-x-2", className)}>
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
        className="h-10 px-3 border-gray-200 hover:bg-gray-50"
        disabled={!query.trim()}
      >
        <Filter className="w-4 h-4" />
      </Button>
    </div>
  )
}

/**
 * 搜索栏骨架屏
 */
export function SearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="relative flex-1">
        <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
      <div className="h-10 w-12 bg-gray-200 rounded-md animate-pulse"></div>
    </div>
  )
}