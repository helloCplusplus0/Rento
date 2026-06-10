'use client'

import { Eye, FileText } from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/format'
import type { RenterContractHistoryItemViewModel } from '@/components/business/renter-display'
import { renterDetailMobileStyles } from '@/components/business/renter-detail-mobile-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContractStatusBadge } from '@/components/ui/status-badge'

interface RenterContractHistoryProps {
  contracts: RenterContractHistoryItemViewModel[]
  onContractClick?: (contractId: string) => void
}

export function RenterContractHistory({
  contracts,
  onContractClick,
}: RenterContractHistoryProps) {
  if (!contracts || contracts.length === 0) {
    return (
      <Card className={renterDetailMobileStyles.historyCard}>
        <CardHeader className={renterDetailMobileStyles.historyHeader}>
          <CardTitle className={renterDetailMobileStyles.historyTitle}>合同历史</CardTitle>
        </CardHeader>
        <CardContent className={renterDetailMobileStyles.historyContent}>
          <div className={renterDetailMobileStyles.emptyState}>
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">暂无合同记录</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={renterDetailMobileStyles.historyCard}>
      <CardHeader className={renterDetailMobileStyles.historyHeader}>
        <CardTitle className={renterDetailMobileStyles.historyTitle}>合同历史</CardTitle>
        <p className={renterDetailMobileStyles.historyDescription}>
          共 {contracts.length} 个合同
        </p>
      </CardHeader>
      <CardContent className={renterDetailMobileStyles.historyContent}>
        <div className={renterDetailMobileStyles.historyList}>
          {contracts.map((contract) => {
            return (
            <Card key={contract.id} className={renterDetailMobileStyles.historyItemCard}>
              <CardContent className={renterDetailMobileStyles.historyItemContent}>
                <div className={renterDetailMobileStyles.historyItemHeader}>
                  <div className={renterDetailMobileStyles.historyItemLeading}>
                    <div>
                      <h4 className={renterDetailMobileStyles.historyItemTitle}>
                        {contract.roomLabel}
                      </h4>
                      <div className={renterDetailMobileStyles.historyItemMeta}>
                        {contract.contractNumber}
                      </div>
                    </div>
                  </div>
                  <ContractStatusBadge
                    status={contract.status}
                    className={renterDetailMobileStyles.historyItemBadge}
                  />
                </div>

                <div className={renterDetailMobileStyles.historyItemDetails}>
                  <div className={renterDetailMobileStyles.historyItemPairRow}>
                    <span className={renterDetailMobileStyles.historyItemLabel}>
                      合同期限
                    </span>
                    <span className={renterDetailMobileStyles.historyItemSecondaryValue}>
                      {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                    </span>
                  </div>

                  <div className={renterDetailMobileStyles.historyItemRow}>
                    <span className={renterDetailMobileStyles.historyItemLabel}>
                      月租金
                    </span>
                    <span className={renterDetailMobileStyles.historyItemValue}>
                      {contract.monthlyRent !== null
                        ? formatCurrency(contract.monthlyRent)
                        : '-'}
                    </span>
                  </div>

                  <div className={renterDetailMobileStyles.historyItemRow}>
                    <span className={renterDetailMobileStyles.historyItemLabel}>
                      押金
                    </span>
                    <span className={renterDetailMobileStyles.historyItemValue}>
                      {contract.deposit !== null ? formatCurrency(contract.deposit) : '-'}
                    </span>
                  </div>
                </div>

                <div className={renterDetailMobileStyles.historyItemFooter}>
                  <div className={renterDetailMobileStyles.historyItemFooterRow}>
                    <span className={renterDetailMobileStyles.historyItemFooterText}>
                      账单总计 {contract.billCount} 个
                    </span>
                    <span className={renterDetailMobileStyles.historyItemFooterSubtle}>
                      已付 {contract.paidCount}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className={renterDetailMobileStyles.historyItemFooterSubtle}>
                      待付 {contract.unpaidCount}
                    </span>
                    {onContractClick && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onContractClick(contract.id)}
                        className={renterDetailMobileStyles.historyActionButton}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        查看
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
