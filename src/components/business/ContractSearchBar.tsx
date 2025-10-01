'use client'

import { Filter, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

interface ContractSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string | null
  onStatusChange: (status: string | null) => void
  loading?: boolean
}

export function ContractSearchBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  loading = false,
}: ContractSearchBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {/* 搜索输入框 */}
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          placeholder="搜索合同号、租客姓名、房间号..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          disabled={loading}
        />
      </div>

      {/* 状态筛选 */}
      <div className="flex items-center gap-2 sm:w-48">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={statusFilter || 'all'}
          onChange={(e) =>
            onStatusChange(e.target.value === 'all' ? null : e.target.value)
          }
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
        >
          <option value="all">全部状态</option>
          <option value="ACTIVE">生效中</option>
          <option value="PENDING">待生效</option>
          <option value="EXPIRED">已到期</option>
          <option value="TERMINATED">已终止</option>
          <option value="expiring_soon">即将到期</option>
        </select>
      </div>
    </div>
  )
}
