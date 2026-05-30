'use client'

import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'

import type { ContractWithDetailsForClient } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { billCreateMobileStyles } from '@/components/business/bill-create-mobile-styles'
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

  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    action: () => void
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

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
    <Card className={billCreateMobileStyles.card}>
      <CardHeader className={billCreateMobileStyles.cardHeader}>
        <CardTitle className={billCreateMobileStyles.cardTitle}>
          选择合同
        </CardTitle>
      </CardHeader>
      <CardContent className={billCreateMobileStyles.cardContent}>
        <div className={billCreateMobileStyles.selectorStack}>
          <div className={billCreateMobileStyles.searchWrap}>
            <Search className={billCreateMobileStyles.searchIcon} />
            <Input
              placeholder="搜索合同号、租客姓名、房间号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={billCreateMobileStyles.searchInput}
            />
          </div>

          <div className={billCreateMobileStyles.listWrap}>
            {filteredContracts.map((contract) => {
              const isSelected = selectedContract?.id === contract.id

              return (
                <div
                  key={contract.id}
                  className={cn(
                    'cursor-pointer hover:border-gray-300',
                    billCreateMobileStyles.contractCard,
                    isSelected && billCreateMobileStyles.contractCardSelected
                  )}
                  onClick={() => onContractSelect(contract)}
                  onKeyDown={(event) =>
                    handleCardKeyDown(event, () => onContractSelect(contract))
                  }
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                >
                  <div className={billCreateMobileStyles.contractCardContent}>
                    <div className={billCreateMobileStyles.contractRow}>
                      <div className={billCreateMobileStyles.contractLeading}>
                        <div className={billCreateMobileStyles.contractTitleRow}>
                          <span className={billCreateMobileStyles.contractTitle}>
                            {contract.contractNumber}
                          </span>
                          {isSelected && (
                            <Check
                              className={billCreateMobileStyles.contractCheck}
                            />
                          )}
                        </div>
                        <div className={billCreateMobileStyles.contractMeta}>
                          {contract.room.building.name} - {contract.room.roomNumber}{' '}
                          | {contract.renter.name}
                        </div>
                        <div className={billCreateMobileStyles.contractSubtle}>
                          月租金: {formatCurrency(contract.monthlyRent)} | 到期:{' '}
                          {formatDate(contract.endDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredContracts.length === 0 && (
              <div className={billCreateMobileStyles.emptyState}>
                {searchQuery ? '未找到匹配的合同' : '暂无活跃合同'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
