'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

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
  placeholder = "搜索账单...", 
  value, 
  onChange, 
  className 
}: BillSearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-4 py-2 w-full"
      />
    </div>
  )
}