'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { ContractForm } from '@/components/business/ContractForm'
import type { RenterWithContractsForClient, RoomWithBuildingForClient } from '@/types/database'

interface CreateContractPageProps {
  renters: RenterWithContractsForClient[]
  availableRooms: RoomWithBuildingForClient[]
}

/**
 * 创建合同页面组件
 * 提供完整的合同创建流程
 */
export function CreateContractPage({ renters, availableRooms }: CreateContractPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (contractData: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contractData,
          generateBills: true // 自动生成账单
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '创建合同失败')
      }

      const result = await response.json()
      
      // 创建成功，跳转到合同详情页
      router.push(`/contracts/${result.contract.id}`)
    } catch (error) {
      console.error('创建合同失败:', error)
      alert(error instanceof Error ? error.message : '创建合同失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <PageContainer title="创建合同" showBackButton>
      <div className="pb-6">
        <ContractForm
          renters={renters}
          availableRooms={availableRooms}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="create"
        />
      </div>
    </PageContainer>
  )
}