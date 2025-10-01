'use client'

import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'

import type { ContractWithDetailsForClient } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface ContractSelectorProps {
  contracts: ContractWithDetailsForClient[]
  selectedContract?: ContractWithDetailsForClient
  onContractSelect: (contract: ContractWithDetailsForClient) => void
}

/**
 * 合同选择器组件
 * 提供合同搜索和选择功能
 */
export function ContractSelector({
  contracts,
  selectedContract,
  onContractSelect,
}: ContractSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // 筛选合同
  const filteredContracts = useMemo(() => {
    if (!searchQuery) return contracts

    const query = searchQuery.toLowerCase()
    return contracts.filter(
      (contract) =>
        contract.contractNumber.toLowerCase().includes(query) ||
        contract.renter.name.toLowerCase().includes(query) ||
        contract.room.roomNumber.toLowerCase().includes(query) ||
        contract.room.building.name.toLowerCase().includes(query)
    )
  }, [contracts, searchQuery])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">选择合同</CardTitle>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder="搜索合同号、租客姓名、房间号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                selectedContract?.id === contract.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onContractSelect(contract)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {contract.contractNumber}
                    </span>
                    {selectedContract?.id === contract.id && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {contract.room.building.name} - {contract.room.roomNumber} |{' '}
                    {contract.renter.name}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    月租金: {formatCurrency(contract.monthlyRent)} | 到期:{' '}
                    {formatDate(contract.endDate)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredContracts.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              {searchQuery ? '未找到匹配的合同' : '暂无活跃合同'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
