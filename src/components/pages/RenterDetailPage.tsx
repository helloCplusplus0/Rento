'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { renterDetailMobileStyles } from '@/components/business/renter-detail-mobile-styles'
import { RenterActions } from '@/components/business/RenterActions'
import { RenterBasicInfo } from '@/components/business/RenterBasicInfo'
import { RenterContractHistory } from '@/components/business/RenterContractHistory'
import { PageContainer } from '@/components/layout'

interface RenterDetailPageProps {
  renter: any
}

export function RenterDetailPage({ renter }: RenterDetailPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleEdit = () => {
    router.push(`/renters/${renter.id}/edit`)
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
        router.push('/renters')
      } else {
        const error = await response.json()
        alert(error.message || '删除失败')
      }
    } catch (error) {
      console.error('删除租客失败:', error)
      alert('删除失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleContractClick = (contract: any) => {
    router.push(`/contracts/${contract.id}`)
  }

  return (
    <PageContainer title={renter.name} showBackButton>
      <div className={renterDetailMobileStyles.pageSection}>
        {/* 操作按钮 */}
        <RenterActions
          renter={renter}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={loading}
        />

        {/* 基本信息 */}
        <RenterBasicInfo renter={renter} />

        {/* 合同历史 */}
        <RenterContractHistory
          contracts={renter.contracts || []}
          onContractClick={handleContractClick}
        />
      </div>
    </PageContainer>
  )
}
