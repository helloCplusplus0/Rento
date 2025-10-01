'use client'

import { useMemo, useState } from 'react'
import { Check, Search, User } from 'lucide-react'

import type { RenterWithContractsForClient } from '@/types/database'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface RenterSelectorProps {
  renters: RenterWithContractsForClient[]
  selectedRenter?: RenterWithContractsForClient | null
  onRenterSelect: (renter: RenterWithContractsForClient) => void
  disabled?: boolean
}

/**
 * 租客选择器组件
 * 支持搜索和选择租客
 */
export function RenterSelector({
  renters,
  selectedRenter,
  onRenterSelect,
  disabled = false,
}: RenterSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // 筛选租客
  const filteredRenters = useMemo(() => {
    if (!searchQuery) return renters

    const query = searchQuery.toLowerCase()
    return renters.filter(
      (renter) =>
        renter.name.toLowerCase().includes(query) ||
        renter.phone.toLowerCase().includes(query) ||
        (renter.idCard && renter.idCard.toLowerCase().includes(query))
    )
  }, [renters, searchQuery])

  // 检查租客是否有活跃合同
  const hasActiveContract = (renter: RenterWithContractsForClient) => {
    return renter.contracts.some((contract) => contract.status === 'ACTIVE')
  }

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          placeholder="搜索租客姓名、手机号或身份证号..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      {/* 已选择的租客 */}
      {selectedRenter && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedRenter.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedRenter.phone}
                  </div>
                  {hasActiveContract(selectedRenter) && (
                    <div className="mt-1 text-xs text-orange-600">
                      ⚠️ 该租客已有活跃合同
                    </div>
                  )}
                </div>
              </div>
              <Check className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 租客列表 */}
      <div className="max-h-60 space-y-2 overflow-y-auto">
        {filteredRenters.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {searchQuery ? '未找到匹配的租客' : '暂无租客数据'}
          </div>
        ) : (
          filteredRenters.map((renter) => {
            const isSelected = selectedRenter?.id === renter.id
            const hasActive = hasActiveContract(renter)

            return (
              <Card
                key={renter.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-sm',
                  isSelected
                    ? 'border-blue-200 bg-blue-50'
                    : 'hover:border-gray-300',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
                onClick={() => !disabled && onRenterSelect(renter)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        )}
                      >
                        <User
                          className={cn(
                            'h-5 w-5',
                            isSelected ? 'text-blue-600' : 'text-gray-600'
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {renter.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {renter.phone}
                        </div>
                        {renter.idCard && (
                          <div className="text-xs text-gray-500">
                            身份证:{' '}
                            {renter.idCard.replace(
                              /(\d{6})\d{8}(\d{4})/,
                              '$1********$2'
                            )}
                          </div>
                        )}
                        {hasActive && (
                          <div className="mt-1 text-xs text-orange-600">
                            ⚠️ 已有活跃合同
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-blue-600" />}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 提示信息 */}
      {filteredRenters.length > 0 && (
        <div className="text-center text-xs text-gray-500">
          共找到 {filteredRenters.length} 个租客
          {selectedRenter && hasActiveContract(selectedRenter) && (
            <div className="mt-1 text-orange-600">
              注意：选中的租客已有活跃合同，请确认是否需要创建新合同
            </div>
          )}
        </div>
      )}
    </div>
  )
}
