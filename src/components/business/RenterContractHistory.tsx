'use client'

import { Eye, FileText } from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/format'
import { renterDetailMobileStyles } from '@/components/business/renter-detail-mobile-styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RenterContractHistoryProps {
  contracts: any[]
  onContractClick?: (contract: any) => void
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'EXPIRED':
        return 'secondary'
      case 'TERMINATED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '生效中'
      case 'PENDING':
        return '待生效'
      case 'EXPIRED':
        return '已到期'
      case 'TERMINATED':
        return '已终止'
      default:
        return status
    }
  }

  const sortedContracts = [...contracts].sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt ?? b.startDate).getTime() -
      new Date(a.updatedAt ?? a.createdAt ?? a.startDate).getTime()
  )

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
          {sortedContracts.map((contract) => {
            const billCount = contract.bills?.length || 0
            const paidCount =
              contract.bills?.filter(
                (b: any) => b.status === 'PAID' || b.status === 'COMPLETED'
              ).length || 0
            const unpaidCount =
              contract.bills?.filter(
                (b: any) => b.status === 'PENDING' || b.status === 'OVERDUE'
              ).length || 0

            return (
            <Card key={contract.id} className={renterDetailMobileStyles.historyItemCard}>
              <CardContent className={renterDetailMobileStyles.historyItemContent}>
                <div className={renterDetailMobileStyles.historyItemHeader}>
                  <div className={renterDetailMobileStyles.historyItemLeading}>
                    <div>
                      <h4 className={renterDetailMobileStyles.historyItemTitle}>
                        {contract.room.building.name} - {contract.room.roomNumber}
                      </h4>
                      <div className={renterDetailMobileStyles.historyItemMeta}>
                        {contract.contractNumber}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={getStatusColor(contract.status)}
                    className={renterDetailMobileStyles.historyItemBadge}
                  >
                    {getStatusText(contract.status)}
                  </Badge>
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
                      {formatCurrency(contract.monthlyRent)}
                    </span>
                  </div>

                  <div className={renterDetailMobileStyles.historyItemRow}>
                    <span className={renterDetailMobileStyles.historyItemLabel}>
                      押金
                    </span>
                    <span className={renterDetailMobileStyles.historyItemValue}>
                      {formatCurrency(contract.deposit)}
                    </span>
                  </div>
                </div>

                <div className={renterDetailMobileStyles.historyItemFooter}>
                  <div className={renterDetailMobileStyles.historyItemFooterRow}>
                    <span className={renterDetailMobileStyles.historyItemFooterText}>
                      账单总计 {billCount} 个
                    </span>
                    <span className={renterDetailMobileStyles.historyItemFooterSubtle}>
                      已付 {paidCount}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className={renterDetailMobileStyles.historyItemFooterSubtle}>
                      待付 {unpaidCount}
                    </span>
                    {onContractClick && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onContractClick(contract)}
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
