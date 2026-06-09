'use client'

import { useEffect, useMemo, useState } from 'react'

import { isContractExpiringSoon } from '@/lib/contract-alert-semantics'
import type { ContractWithDetailsForClient } from '@/types/database'
import { contractListMobileStyles } from '@/components/business/contract-list-mobile-styles'
import { ContractGrid } from '@/components/business/ContractGrid'
import { ContractSearchBar } from '@/components/business/ContractSearchBar'
import { PageContainer } from '@/components/layout/PageContainer'

interface ContractStats {
  totalCount: number
  activeCount: number
  expiredCount: number
  terminatedCount: number
  expiringSoonCount: number
  newThisMonth: number
  statusDistribution: {
    pending: number
    active: number
    expired: number
    terminated: number
  }
}

interface ContractExpiryAlert {
  id: string
  contractId: string
  contractNumber: string
  renterName: string
  roomInfo: string
  endDate: Date
  daysUntilExpiry: number
  alertType: 'warning' | 'danger' | 'expired'
}

interface ContractListPageProps {
  initialContracts: ContractWithDetailsForClient[]
  initialStats: ContractStats
  initialExpiryAlerts: ContractExpiryAlert[]
  contractExpiryAlertDays?: number
  initialSearchQuery?: string
  onOpenContract?: (contract: ContractWithDetailsForClient) => void
  onOpenRenewContract?: (contractId: string) => void
}

export function ContractListPage({
  initialContracts,
  initialStats,
  initialExpiryAlerts,
  contractExpiryAlertDays = 30,
  initialSearchQuery = '',
  onOpenContract,
  onOpenRenewContract,
}: ContractListPageProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [loading] = useState(false)

  useEffect(() => {
    setSearchQuery(initialSearchQuery)
  }, [initialSearchQuery])

  // 筛选合同数据
  const filteredContracts = useMemo(() => {
    return initialContracts.filter((contract) => {
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !contract.contractNumber.toLowerCase().includes(query) &&
          !contract.renter.name.toLowerCase().includes(query) &&
          !contract.room.roomNumber.toLowerCase().includes(query) &&
          !contract.room.building.name.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // 状态筛选
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'expiring_soon') {
          return (
            contract.status === 'ACTIVE' &&
            isContractExpiringSoon(contract.endDate, contractExpiryAlertDays)
          )
        } else {
          return contract.status === statusFilter
        }
      }

      return true
    })
  }, [contractExpiryAlertDays, initialContracts, searchQuery, statusFilter])

  const filterCounts = useMemo(
    () => ({
      total: initialStats.totalCount,
      active: initialStats.activeCount,
      pending: initialStats.statusDistribution.pending,
      expiringSoon: initialStats.expiringSoonCount,
      expired: initialStats.expiredCount,
      terminated: initialStats.terminatedCount,
    }),
    [initialStats]
  )

  // 处理合同点击
  const handleContractClick = (contract: ContractWithDetailsForClient) => {
    if (onOpenContract) {
      onOpenContract(contract)
      return
    }

    if (typeof window !== 'undefined') {
      window.location.assign(`/contracts/${contract.id}`)
    }
  }

  // 处理续约
  const handleRenewContract = (contractId: string) => {
    if (onOpenRenewContract) {
      onOpenRenewContract(contractId)
      return
    }

    if (typeof window !== 'undefined') {
      window.location.assign(`/contracts/${contractId}/renew`)
    }
  }

  return (
    <PageContainer title="合同管理" showBackButton>
      <div className={contractListMobileStyles.pageSection}>
        {/* 搜索栏 */}
        <ContractSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          filterCounts={filterCounts}
          loading={loading}
        />

        {/* 结果统计 */}
        {(searchQuery || statusFilter) && (
          <div className={contractListMobileStyles.resultText}>
            找到 {filteredContracts.length} 个合同
            {searchQuery && ` (搜索: ${searchQuery})`}
            {statusFilter &&
              statusFilter !== 'all' &&
              ` (状态: ${getStatusLabel(statusFilter)})`}
          </div>
        )}

        {/* 合同网格 */}
        <ContractGrid
          contracts={filteredContracts}
          onContractClick={handleContractClick}
          loading={loading}
        />
      </div>
    </PageContainer>
  )
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '待生效',
    ACTIVE: '生效中',
    EXPIRED: '已到期',
    TERMINATED: '已终止',
    expiring_soon: '即将到期',
  }
  return labels[status] || status
}
