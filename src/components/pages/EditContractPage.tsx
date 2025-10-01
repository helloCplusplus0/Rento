'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type {
  ContractWithDetailsForClient,
  RenterWithContractsForClient,
  RoomWithBuildingForClient,
} from '@/types/database'
import { ContractForm } from '@/components/business/ContractForm'
import { PageContainer } from '@/components/layout'

interface EditContractPageProps {
  contract: ContractWithDetailsForClient
  renters: RenterWithContractsForClient[]
  availableRooms: RoomWithBuildingForClient[]
}

/**
 * 编辑合同页面组件
 * 提供合同信息的编辑功能
 */
export function EditContractPage({
  contract,
  renters,
  availableRooms,
}: EditContractPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (contractData: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '更新合同失败')
      }

      // 更新成功，跳转回合同详情页
      router.push(`/contracts/${contract.id}`)
    } catch (error) {
      console.error('更新合同失败:', error)
      alert(error instanceof Error ? error.message : '更新合同失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // 准备初始数据
  const initialData = {
    renterId: contract.renter.id,
    roomId: contract.room.id,
    startDate: contract.startDate.toISOString().split('T')[0],
    endDate: contract.endDate.toISOString().split('T')[0],
    monthlyRent: contract.monthlyRent,
    deposit: contract.deposit,
    keyDeposit: contract.keyDeposit || 0,
    cleaningFee: contract.cleaningFee || 0,
    paymentMethod: contract.paymentMethod || '',
    paymentTiming: contract.paymentTiming || '',
    signedBy: contract.signedBy || '',
    signedDate: contract.signedDate
      ? contract.signedDate.toISOString().split('T')[0]
      : '',
    remarks: '',
  }

  return (
    <PageContainer
      title={`编辑合同 - ${contract.contractNumber}`}
      showBackButton
    >
      <div className="pb-6">
        <ContractForm
          renters={renters}
          availableRooms={availableRooms}
          preselectedRoomId={contract.room.id}
          preselectedRenterId={contract.renter.id}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="edit"
          initialData={initialData}
        />
      </div>
    </PageContainer>
  )
}
