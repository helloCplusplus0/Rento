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
  placeholder = '搜索账单...',
  value,
  onChange,
  className,
}: BillSearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2 pr-4 pl-10"
      />
    </div>
  )
}
