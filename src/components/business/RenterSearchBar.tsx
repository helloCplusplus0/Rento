'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, X } from 'lucide-react'

interface RenterSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  contractStatusFilter: string | null
  onContractStatusChange: (status: string | null) => void
  loading?: boolean
}

export function RenterSearchBar({
  searchQuery,
  onSearchChange,
  contractStatusFilter,
  onContractStatusChange,
  loading = false
}: RenterSearchBarProps) {
  const [showFilters, setShowFilters] = useState(false)
  
  const statusOptions = [
    { value: null, label: '全部状态' },
    { value: 'active', label: '有活跃合同' },
    { value: 'inactive', label: '无活跃合同' }
  ]
  
  const handleClearFilters = () => {
    onSearchChange('')
    onContractStatusChange(null)
    setShowFilters(false)
  }
  
  const hasActiveFilters = searchQuery || contractStatusFilter
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 搜索栏 */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索租客姓名、手机号、身份证号..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-50 text-blue-600' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="text-gray-500"
              >
                <X className="w-4 h-4 mr-2" />
                清除
              </Button>
            )}
          </div>
          
          {/* 筛选选项 */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 合同状态筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    合同状态
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <Button
                        key={option.value || 'all'}
                        variant={contractStatusFilter === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onContractStatusChange(option.value)}
                        disabled={loading}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 活跃筛选器显示 */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 text-sm">
              {searchQuery && (
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center">
                  搜索: {searchQuery}
                  <button
                    onClick={() => onSearchChange('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {contractStatusFilter && (
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md flex items-center">
                  状态: {statusOptions.find(s => s.value === contractStatusFilter)?.label}
                  <button
                    onClick={() => onContractStatusChange(null)}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}