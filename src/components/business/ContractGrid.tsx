'use client'

import type { ContractWithDetailsForClient } from '@/types/database'

import { contractListMobileStyles } from './contract-list-mobile-styles'
import { ContractCard } from './contract-card'

interface ContractGridProps {
  contracts: ContractWithDetailsForClient[]
  onContractClick?: (contract: ContractWithDetailsForClient) => void
  loading?: boolean
}

export function ContractGrid({
  contracts,
  onContractClick,
  loading = false,
}: ContractGridProps) {
  if (loading) {
    return (
      <div className={contractListMobileStyles.listGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-48 rounded-lg bg-gray-200"></div>
          </div>
        ))}
      </div>
    )
  }

  if (contracts.length === 0) {
    return (
      <div className={contractListMobileStyles.emptyState}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className={contractListMobileStyles.emptyTitle}>暂无合同</h3>
        <p className={contractListMobileStyles.emptyText}>还没有任何合同记录</p>
      </div>
    )
  }

  return (
    <div className={contractListMobileStyles.listGrid}>
      {contracts.map((contract) => (
        <ContractCard
          key={contract.id}
          contract={contract}
          onClick={() => onContractClick?.(contract)}
        />
      ))}
    </div>
  )
}
