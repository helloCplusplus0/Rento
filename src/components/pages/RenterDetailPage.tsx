'use client'

import { useMemo, useState } from 'react'

import {
  pushWithHostNavigation,
  replaceWithHostNavigation,
  type HostNavigationAdapter,
} from '@/lib/host-navigation'
import type { RenterWithContractsForClient } from '@/types/database'

import {
  buildRenterBasicInfoViewModel,
  buildRenterContractHistoryViewModels,
} from '@/components/business/renter-display'
import { renterDetailMobileStyles } from '@/components/business/renter-detail-mobile-styles'
import { RenterActions } from '@/components/business/RenterActions'
import { RenterBasicInfo } from '@/components/business/RenterBasicInfo'
import { RenterContractHistory } from '@/components/business/RenterContractHistory'
import { PageContainer } from '@/components/layout/PageContainer'

interface RenterDetailPageProps {
  renter: RenterWithContractsForClient
  navigation?: HostNavigationAdapter
  onEdit?: (renter: RenterWithContractsForClient) => void
  onDeleted?: () => void
  onOpenContract?: (contractId: string) => void
  onOpenAddContract?: (renter: RenterWithContractsForClient) => void
  onOpenContracts?: (renter: RenterWithContractsForClient) => void
}

export function RenterDetailPage({
  renter,
  navigation,
  onEdit,
  onDeleted,
  onOpenContract,
  onOpenAddContract,
  onOpenContracts,
}: RenterDetailPageProps) {
  const [loading, setLoading] = useState(false)
  const renterBasicInfo = useMemo(() => buildRenterBasicInfoViewModel(renter), [renter])
  const renterContractHistory = useMemo(
    () => buildRenterContractHistoryViewModels(renter.contracts || []),
    [renter]
  )

  const handleEdit = () => {
    if (onEdit) {
      onEdit(renter)
      return
    }

    pushWithHostNavigation(`/renters/${renter.id}/edit`, navigation)
  }

  const handleDelete = async () => {
    if (!confirm(`确定要删除租客 ${renter.name} 吗？此操作不可恢复。`)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/renters/${renter.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (onDeleted) {
          onDeleted()
        } else {
          replaceWithHostNavigation('/renters', navigation)
        }
      } else {
        const error = await response.json()
        alert(error.error || error.message || '删除失败')
      }
    } catch (error) {
      console.error('删除租客失败:', error)
      alert('删除失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleContractClick = (contractId: string) => {
    if (onOpenContract) {
      onOpenContract(contractId)
      return
    }

    pushWithHostNavigation(`/contracts/${contractId}`, navigation)
  }

  return (
    <PageContainer title={renter.name} showBackButton>
      <div className={renterDetailMobileStyles.pageSection}>
        {/* 操作按钮 */}
        <RenterActions
          renter={renter}
          onEdit={handleEdit}
          onAddContract={
            onOpenAddContract ? () => onOpenAddContract(renter) : undefined
          }
          onViewContracts={
            onOpenContracts ? () => onOpenContracts(renter) : undefined
          }
          onDelete={handleDelete}
          isLoading={loading}
        />

        {/* 基本信息 */}
        <RenterBasicInfo renter={renterBasicInfo} />

        {/* 合同历史 */}
        <RenterContractHistory
          contracts={renterContractHistory}
          onContractClick={handleContractClick}
        />
      </div>
    </PageContainer>
  )
}
