'use client'

import { useState } from 'react'

import { EnhancedContractDetail } from '@/components/business/EnhancedContractDetail'
import { contractDetailMobileStyles } from '@/components/business/contract-detail-mobile-styles'
import { SingleMeterReadingModal } from '@/components/business/SingleMeterReadingModal'
import { DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS } from '@/lib/contract-alert-semantics'
import {
  formatClientApiError,
  readClientApiError,
} from '@/lib/client-api-error'
import { PageContainer } from '@/components/layout/PageContainer'
import type { ContractWithDetailsForClient } from '@/types/database'
import {
  navigateWithHost,
  reloadWithHost,
  type PageHostNavigation,
} from './page-host-navigation'

interface ContractDetailPageProps {
  contract: ContractWithDetailsForClient
  contractExpiryAlertDays?: number
  navigation?: PageHostNavigation
  onOpenRenter?: (renterId: string) => void
  onOpenRoom?: (roomId: string) => void
  onOpenBill?: (billId: string) => void
}

export function ContractDetailPage({
  contract,
  contractExpiryAlertDays = DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS,
  navigation,
  onOpenRenter,
  onOpenRoom,
  onOpenBill,
}: ContractDetailPageProps) {
  const [loading, setLoading] = useState(false)
  const [showMeterReadingModal, setShowMeterReadingModal] = useState(false)

  // 处理编辑
  const handleEdit = () => {
    navigateWithHost(navigation, `/contracts/${contract.id}/edit`)
  }

  // 处理续约
  const handleRenew = () => {
    navigateWithHost(navigation, `/contracts/${contract.id}/renew`)
  }

  // 处理退租
  const handleCheckout = () => {
    // 跳转到退租页面
    navigateWithHost(navigation, `/contracts/${contract.id}/checkout`)
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

      if (!response.ok) {
        const apiError = await readClientApiError(response, '激活合同失败')
        alert(
          formatClientApiError(apiError, {
            defaultTitle: '激活合同失败',
            includeCode: true,
          })
        )
        return
      }

      const result = await response.json()

      // 激活成功，刷新页面
      alert('合同激活成功！')
      reloadWithHost(navigation)
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

      if (!response.ok) {
        const apiError = await readClientApiError(response, '删除合同失败')
        alert(
          formatClientApiError(apiError, {
            defaultTitle: '删除合同失败',
            includeCode: true,
          })
        )
        return
      }

      const result = await response.json()

      // 删除成功，显示成功信息并跳转
      alert(
        `合同删除成功！\n\n删除的内容：\n• 合同记录：1个\n• 未支付账单：${result.data?.deletedEntities?.bills || 0}个\n• 抄表记录：${result.data?.deletedEntities?.meterReadings || 0}个`
      )

      // 跳转回合同列表
      navigateWithHost(navigation, '/contracts')
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
      <div className={contractDetailMobileStyles.pageShell}>
        <EnhancedContractDetail
          contract={contract}
          contractExpiryAlertDays={contractExpiryAlertDays}
          navigation={navigation}
          onEdit={handleEdit}
          onRenew={handleRenew}
          onTerminate={handleCheckout}
          onDelete={handleDelete}
          onViewPDF={handleViewPDF}
          onActivate={handleActivate}
          onMeterReading={handleMeterReading}
          onOpenRenter={onOpenRenter}
          onOpenRoom={onOpenRoom}
          onOpenBill={onOpenBill}
        />
      </div>

      {/* 单次抄表弹窗 */}
      <SingleMeterReadingModal
        contractId={contract.id}
        roomId={contract.roomId}
        isOpen={showMeterReadingModal}
        onClose={() => setShowMeterReadingModal(false)}
        onSuccess={(readings) => {
          console.log('抄表成功:', readings)
          reloadWithHost(navigation)
        }}
      />
    </PageContainer>
  )
}
