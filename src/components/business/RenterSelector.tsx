'use client'

import { useMemo, useState } from 'react'
import { Check, Search, User } from 'lucide-react'

import type { RenterWithContractsForClient } from '@/types/database'
import { cn } from '@/lib/utils'
import { contractCreateMobileStyles } from '@/components/business/contract-create-mobile-styles'
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

  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    action: () => void
  ) => {
    if (disabled) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

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
    <div className={contractCreateMobileStyles.selectorStack}>
      {/* 搜索框 */}
      <div className={contractCreateMobileStyles.searchWrap}>
        <Search className={contractCreateMobileStyles.searchIcon} />
        <Input
          placeholder="搜索租客姓名、手机号或身份证号..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={contractCreateMobileStyles.searchInput}
          disabled={disabled}
        />
      </div>

      {/* 已选择的租客 */}
      {selectedRenter && (
        <Card className={contractCreateMobileStyles.selectedCard}>
          <CardContent className={contractCreateMobileStyles.selectedCardContent}>
            <div className={contractCreateMobileStyles.selectedRow}>
              <div className={contractCreateMobileStyles.selectedLeading}>
                <div
                  className={cn(
                    contractCreateMobileStyles.avatarBox,
                    contractCreateMobileStyles.avatarBoxSelected
                  )}
                >
                  <User
                    className={cn(
                      contractCreateMobileStyles.avatarIcon,
                      contractCreateMobileStyles.avatarIconSelected
                    )}
                  />
                </div>
                <div>
                  <div className={contractCreateMobileStyles.selectedTitle}>
                    {selectedRenter.name}
                  </div>
                  <div className={contractCreateMobileStyles.selectedMeta}>
                    {selectedRenter.phone}
                  </div>
                  {selectedRenter.idCard && (
                    <div className={contractCreateMobileStyles.selectedSubtle}>
                      身份证:{' '}
                      {selectedRenter.idCard.replace(
                        /(\d{6})\d{8}(\d{4})/,
                        '$1********$2'
                      )}
                    </div>
                  )}
                  {hasActiveContract(selectedRenter) && (
                    <div className={contractCreateMobileStyles.selectedWarning}>
                      ⚠️ 该租客已有活跃合同
                    </div>
                  )}
                </div>
              </div>
              <Check className={contractCreateMobileStyles.selectedCheck} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 租客列表 */}
      <div className={contractCreateMobileStyles.listWrap}>
        {filteredRenters.length === 0 ? (
          <div className={contractCreateMobileStyles.emptyState}>
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
                  'cursor-pointer hover:border-gray-300',
                  contractCreateMobileStyles.optionCard,
                  isSelected && contractCreateMobileStyles.optionCardSelected,
                  disabled && 'cursor-not-allowed opacity-50'
                )}
                onClick={() => !disabled && onRenterSelect(renter)}
                onKeyDown={(event) =>
                  handleCardKeyDown(event, () => onRenterSelect(renter))
                }
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-pressed={isSelected}
              >
                <CardContent className={contractCreateMobileStyles.optionCardContent}>
                  <div className={contractCreateMobileStyles.optionRow}>
                    <div className={contractCreateMobileStyles.optionLeading}>
                      <div
                        className={cn(
                          contractCreateMobileStyles.avatarBox,
                          isSelected
                            ? contractCreateMobileStyles.avatarBoxSelected
                            : undefined
                        )}
                      >
                        <User
                          className={cn(
                            contractCreateMobileStyles.avatarIcon,
                            isSelected
                              ? contractCreateMobileStyles.avatarIconSelected
                              : undefined
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className={contractCreateMobileStyles.optionTitle}>
                          {renter.name}
                        </div>
                        <div className={contractCreateMobileStyles.optionMeta}>
                          {renter.phone}
                        </div>
                        {renter.idCard && (
                          <div className={contractCreateMobileStyles.optionSubtle}>
                            身份证:{' '}
                            {renter.idCard.replace(
                              /(\d{6})\d{8}(\d{4})/,
                              '$1********$2'
                            )}
                          </div>
                        )}
                        {hasActive && (
                          <div className={contractCreateMobileStyles.optionStatusText}>
                            ⚠️ 已有活跃合同
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className={contractCreateMobileStyles.optionCheck} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 提示信息 */}
      {filteredRenters.length > 0 && (
        <div className={contractCreateMobileStyles.resultText}>
          共找到 {filteredRenters.length} 个租客
          {selectedRenter && hasActiveContract(selectedRenter) && (
            <div className={contractCreateMobileStyles.selectedWarning}>
              注意：选中的租客已有活跃合同，请确认是否需要创建新合同
            </div>
          )}
        </div>
      )}
    </div>
  )
}
