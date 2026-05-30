'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  CreditCard,
  Edit,
  RotateCcw,
  Trash2,
} from 'lucide-react'

import { BillBasicInfo } from '@/components/business/BillBasicInfo'
import { ContractRenterInfo } from '@/components/business/ContractRenterInfo'
import { billDetailMobileStyles } from '@/components/business/bill-detail-mobile-styles'
import { PaymentConfirmDialog } from '@/components/business/PaymentConfirmDialog'
import { DetailPageTemplate } from '@/components/layout/DetailPageTemplate'

interface BillDetailPageProps {
  bill: any // 简化类型，避免复杂的类型转换
}

/**
 * 账单详情页面组件
 * 显示账单完整信息，支持状态管理和操作功能
 */
export function BillDetailPage({ bill }: BillDetailPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  const handleStatusChange = async (status: string, paymentData?: any) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/bills/${bill.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          ...paymentData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update bill status')
      }

      // 刷新页面数据
      router.refresh()
    } catch (error) {
      console.error('Error updating bill status:', error)
      alert('更新账单状态失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/bills/${bill.id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个账单吗？此操作不可撤销。')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/bills/${bill.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      alert('账单删除成功')
      router.push('/bills')
    } catch (err) {
      alert('删除失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 判断操作权限
  const canConfirmPayment =
    (bill.status === 'PENDING' || bill.status === 'OVERDUE') &&
    bill.pendingAmount > 0
  const canMarkCompleted = bill.status === 'PAID' && bill.pendingAmount === 0
  const canRestorePending = bill.status === 'OVERDUE'
  const canDelete =
    bill.status === 'PENDING' &&
    bill.receivedAmount === 0 &&
    bill.pendingAmount === bill.amount

  // 定义操作按钮 - 简化版，只保留核心功能
  const actions = [
    // 支付相关操作
    ...(canConfirmPayment
      ? [
          {
            label: bill.receivedAmount > 0 ? '继续收款' : '确认收款',
            icon: <CreditCard className="h-4 w-4" />,
            onClick: () => setShowPaymentDialog(true),
            disabled: isLoading,
            variant: 'default' as const,
            className: `${billDetailMobileStyles.actionButton} bg-green-600 text-white hover:bg-green-700`,
          },
        ]
      : []),
    ...(canMarkCompleted
      ? [
          {
            label: '标记完成',
            icon: <CheckCircle className="h-4 w-4" />,
            onClick: () => handleStatusChange('COMPLETED'),
            disabled: isLoading,
            variant: 'outline' as const,
            className: `${billDetailMobileStyles.actionButton} border-blue-300 text-blue-600 hover:bg-blue-50`,
          },
        ]
      : []),
    ...(canRestorePending
      ? [
          {
            label: '恢复待付',
            icon: <RotateCcw className="h-4 w-4" />,
            onClick: () => handleStatusChange('PENDING'),
            disabled: isLoading,
            variant: 'outline' as const,
            className: `${billDetailMobileStyles.actionButton} border-orange-300 text-orange-600 hover:bg-orange-50`,
          },
        ]
      : []),

    // 编辑操作
    {
      label: '编辑',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
      disabled: isLoading || bill.status !== 'PENDING',
      variant: 'outline' as const,
      className: billDetailMobileStyles.actionButton,
    },

    // 删除操作
    ...(canDelete
      ? [
          {
            label: '删除',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: handleDelete,
            disabled: isLoading,
            variant: 'outline' as const,
            className: `${billDetailMobileStyles.actionButton} border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700`,
          },
        ]
      : []),
  ]

  return (
    <>
      <DetailPageTemplate
        title="账单详情"
        actions={actions}
        contentClassName={billDetailMobileStyles.pageSection}
        actionsCardClassName={billDetailMobileStyles.actionsCard}
        actionsRowClassName={billDetailMobileStyles.actionsRow}
        actionButtonClassName={billDetailMobileStyles.actionButton}
        showActionsTitle={false}
      >
        {isLoading && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="rounded-lg bg-white p-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <span>处理中...</span>
              </div>
            </div>
          </div>
        )}

        {/* 基本信息 */}
        <BillBasicInfo bill={bill} />

        {/* 合同和租客信息 - 简化布局 */}
        <ContractRenterInfo bill={bill} />
      </DetailPageTemplate>

      {/* 支付确认对话框 */}
      <PaymentConfirmDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        bill={bill}
        onConfirm={handleStatusChange}
      />
    </>
  )
}
