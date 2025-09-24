'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Check } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import type { ContractWithDetailsForClient } from '@/types/database'

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
  onContractSelect 
}: ContractSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // 筛选合同
  const filteredContracts = useMemo(() => {
    if (!searchQuery) return contracts
    
    const query = searchQuery.toLowerCase()
    return contracts.filter(contract => 
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索合同号、租客姓名、房间号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedContract?.id === contract.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onContractSelect(contract)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contract.contractNumber}</span>
                    {selectedContract?.id === contract.id && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {contract.room.building.name} - {contract.room.roomNumber} | {contract.renter.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    月租金: {formatCurrency(contract.monthlyRent)} | 
                    到期: {formatDate(contract.endDate)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredContracts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '未找到匹配的合同' : '暂无活跃合同'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}