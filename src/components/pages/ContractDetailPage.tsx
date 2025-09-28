'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { EnhancedContractDetail } from '@/components/business/EnhancedContractDetail'
import { SingleMeterReadingModal } from '@/components/business/SingleMeterReadingModal'

// 为客户端组件定义的合同类型（Decimal 转换为 number）
interface ContractWithDetailsForClient {
  id: string
  contractNumber: string
  roomId: string
  renterId: string
  startDate: Date
  endDate: Date
  isExtended: boolean
  monthlyRent: number
  totalRent: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  paymentMethod?: string | null
  paymentTiming?: string | null
  status: string
  businessStatus?: string | null
  signedBy?: string | null
  signedDate?: Date | null
  remarks?: string | null
  createdAt: Date
  updatedAt: Date
  room: {
    id: string
    roomNumber: string
    floorNumber: number
    buildingId: string
    roomType: string
    area: number | null
    rent: number
    status: string
    currentRenter?: string | null
    overdueDays?: number | null
    createdAt: Date
    updatedAt: Date
    building: {
      id: string
      name: string
      address: string | null
      totalRooms: number
      description: string | null
      createdAt: Date
      updatedAt: Date
    }
  }
  renter: {
    id: string
    name: string
    gender?: string | null
    phone: string
    idCard?: string | null
    emergencyContact?: string | null
    emergencyPhone?: string | null
    occupation?: string | null
    company?: string | null
    moveInDate?: Date | null
    tenantCount?: number | null
    remarks?: string | null
    createdAt: Date
    updatedAt: Date
  }
  bills: Array<{
    id: string
    billNumber: string
    type: string
    amount: number
    receivedAmount: number
    pendingAmount: number
    dueDate: Date
    paidDate?: Date | null
    period?: string | null
    status: string
    paymentMethod?: string | null
    operator?: string | null
    remarks?: string | null
    contractId: string
    createdAt: Date
    updatedAt: Date
  }>
}

interface ContractDetailPageProps {
  contract: ContractWithDetailsForClient
}

export function ContractDetailPage({ contract }: ContractDetailPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showMeterReadingModal, setShowMeterReadingModal] = useState(false)
  
  // 处理编辑
  const handleEdit = () => {
    router.push(`/contracts/${contract.id}/edit`)
  }
  
  // 处理续约
  const handleRenew = () => {
    router.push(`/contracts/${contract.id}/renew`)
  }
  
  // 处理退租
  const handleCheckout = () => {
    // 跳转到退租页面
    router.push(`/contracts/${contract.id}/checkout`)
  }

  // 处理删除
  const handleDelete = async () => {
    if (!confirm('确定要删除这个合同吗？此操作不可撤销，将同时删除相关的账单记录。')) {
      return
    }
    
    setLoading(true)
    try {
      // TODO: 实现删除合同API调用
      console.log('删除合同:', contract.id)
      // 跳转回合同列表
      router.push('/contracts')
    } catch (error) {
      console.error('删除合同失败:', error)
      alert('删除合同失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  // 处理查看PDF
  const handleViewPDF = () => {
    // TODO: 实现PDF查看功能
    console.log('查看PDF:', contract.id)
  }

  // 处理抄表录入
  const handleMeterReading = () => {
    setShowMeterReadingModal(true)
  }
  
  return (
    <PageContainer title="合同详情" showBackButton>
      <div className="pb-6">
        <EnhancedContractDetail
          contract={contract}
          onEdit={handleEdit}
          onRenew={handleRenew}
          onTerminate={handleCheckout}
          onDelete={handleDelete}
          onViewPDF={handleViewPDF}
        />
      </div>

      {/* 单次抄表弹窗 */}
      <SingleMeterReadingModal
        contractId={contract.id}
        roomId={contract.roomId}
        isOpen={showMeterReadingModal}
        onClose={() => setShowMeterReadingModal(false)}
        onSuccess={(reading) => {
          console.log('抄表成功:', reading)
          // TODO: 刷新合同数据或显示成功提示
        }}
      />
    </PageContainer>
  )
}