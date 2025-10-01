'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { EnhancedContractDetail } from '@/components/business/EnhancedContractDetail'
import { SingleMeterReadingModal } from '@/components/business/SingleMeterReadingModal'
import { PageContainer } from '@/components/layout'

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

  // 处理激活合同
  const handleActivate = async () => {
    const confirmMessage = `确定要激活合同 ${contract.contractNumber} 吗？

✅ 激活后：
• 合同状态将变为"生效中"
• 房间状态将变为"已占用"
• 可以开始正常的租赁管理

请确认房间已准备就绪，租客已确认入住。`

    if (!confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/contracts/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: contract.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`激活合同失败：${result.error || '未知错误'}`)
        return
      }

      // 激活成功，刷新页面
      alert('合同激活成功！')
      window.location.reload()
    } catch (error) {
      console.error('激活合同失败:', error)
      alert('激活合同失败，请检查网络连接后重试')
    } finally {
      setLoading(false)
    }
  }
  const handleDelete = async () => {
    // 根据设计方案，提供更详细的确认信息
    const confirmMessage = `确定要删除合同 ${contract.contractNumber} 吗？

⚠️ 删除条件：
• 只有"待生效"状态的合同才能删除
• 不能删除有已支付账单的合同
• 已生效的合同请使用"退租"功能

此操作不可撤销，将同时删除相关的未支付账单和抄表记录。`

    if (!confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        // 根据错误代码提供具体的用户指引
        let errorMessage = result.error || '删除合同失败'

        if (result.code === 'INVALID_STATUS_ACTIVE') {
          errorMessage = `无法删除生效中的合同\n\n${result.details?.suggestion || '请使用退租功能处理生效中的合同'}`
        } else if (result.code === 'HAS_PAID_BILLS') {
          errorMessage = `无法删除有已支付账单的合同\n\n已支付账单数量：${result.details?.paidBillCount || 0}\n${result.details?.suggestion || '已支付的账单包含重要的财务记录，不能删除'}`
        } else if (
          result.code === 'INVALID_STATUS_EXPIRED' ||
          result.code === 'INVALID_STATUS_TERMINATED'
        ) {
          errorMessage = `无法删除已完成的合同\n\n${result.details?.suggestion || '已完成的合同不能删除，用于保护历史记录'}`
        }

        alert(errorMessage)
        return
      }

      // 删除成功，显示成功信息并跳转
      alert(
        `合同删除成功！\n\n删除的内容：\n• 合同记录：1个\n• 未支付账单：${result.data?.deletedEntities?.bills || 0}个\n• 抄表记录：${result.data?.deletedEntities?.meterReadings || 0}个`
      )

      // 跳转回合同列表
      router.push('/contracts')
    } catch (error) {
      console.error('删除合同失败:', error)
      alert('删除合同失败，请检查网络连接后重试')
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
          onActivate={handleActivate}
          onMeterReading={handleMeterReading}
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
          // 抄表成功后可以选择刷新页面或显示成功提示
          // 这里使用简单的页面刷新来确保数据同步
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }}
      />
    </PageContainer>
  )
}
