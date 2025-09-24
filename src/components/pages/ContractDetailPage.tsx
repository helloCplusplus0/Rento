'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DetailPageTemplate, DetailInfoCard, DetailField } from '@/components/layout/DetailPageTemplate'
import { ContractDetail } from '@/components/business/contract-detail'
import { SingleMeterReadingModal } from '@/components/business/SingleMeterReadingModal'
import { Edit, RefreshCw, XCircle, FileText, Gauge } from 'lucide-react'

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
  
  // 处理终止
  const handleTerminate = async () => {
    if (!confirm('确定要终止这个合同吗？此操作不可撤销。')) {
      return
    }
    
    setLoading(true)
    try {
      // TODO: 实现终止合同API调用
      console.log('终止合同:', contract.id)
      // 刷新页面或跳转
      router.refresh()
    } catch (error) {
      console.error('终止合同失败:', error)
      alert('终止合同失败，请重试')
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

  // 定义操作按钮
  const actions = [
    {
      label: '查看PDF',
      icon: <FileText className="w-4 h-4" />,
      onClick: handleViewPDF,
      disabled: loading
    },
    {
      label: '抄表录入',
      icon: <Gauge className="w-4 h-4" />,
      onClick: handleMeterReading,
      disabled: loading
    },
    {
      label: '编辑',
      icon: <Edit className="w-4 h-4" />,
      onClick: handleEdit,
      disabled: loading
    },
    ...(contract.status === 'ACTIVE' ? [
      {
        label: '续约',
        icon: <RefreshCw className="w-4 h-4" />,
        onClick: handleRenew,
        disabled: loading
      },
      {
        label: '终止',
        icon: <XCircle className="w-4 h-4" />,
        onClick: handleTerminate,
        disabled: loading,
        variant: 'destructive' as const,
        className: 'text-red-600 hover:text-red-700'
      }
    ] : [])
  ]
  
  return (
    <>
      <DetailPageTemplate
        title={`合同详情 - ${contract.contractNumber}`}
        actions={actions}
      >
        {/* 使用现有的合同详情组件，但移除顶部操作按钮 */}
        <ContractDetail
          contract={contract as any}
          // 不传递操作回调，让模板统一处理
        />
      </DetailPageTemplate>

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
    </>
  )
}