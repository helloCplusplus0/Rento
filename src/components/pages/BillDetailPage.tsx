'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DetailPageTemplate } from '@/components/layout/DetailPageTemplate'
import { BillBasicInfo } from '@/components/business/BillBasicInfo'
import { ContractRenterInfo } from '@/components/business/ContractRenterInfo'
import { PaymentConfirmDialog } from '@/components/business/PaymentConfirmDialog'
import { BillStatusExplanation } from '@/components/business/BillStatusExplanation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, CreditCard, CheckCircle, RotateCcw, HelpCircle } from 'lucide-react'

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
          ...paymentData
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
        method: 'DELETE'
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

  // 判断是否实际逾期
  const today = new Date()
  const dueDate = new Date(bill.dueDate)
  const isActuallyOverdue = today > dueDate && bill.status !== 'PAID' && bill.status !== 'COMPLETED'
  
  // 判断操作权限
  const canConfirmPayment = (bill.status === 'PENDING' || bill.status === 'PAID' || isActuallyOverdue) && bill.pendingAmount > 0
  const canMarkCompleted = bill.status === 'PAID' && bill.pendingAmount === 0
  const canRestorePending = bill.status === 'OVERDUE'
  const canDelete = bill.status === 'PENDING' || (bill.status === 'PAID' && bill.receivedAmount === 0)

  // 定义操作按钮 - 简化版，只保留核心功能
  const actions = [
    // 支付相关操作
    ...(canConfirmPayment ? [{
      label: bill.status === 'PAID' ? '继续收款' : '确认收款',
      icon: <CreditCard className="w-4 h-4" />,
      onClick: () => setShowPaymentDialog(true),
      disabled: isLoading,
      variant: 'default' as const,
      className: 'bg-green-600 hover:bg-green-700 text-white'
    }] : []),
    ...(canMarkCompleted ? [{
      label: '标记完成',
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: () => handleStatusChange('COMPLETED'),
      disabled: isLoading,
      variant: 'outline' as const,
      className: 'border-blue-300 text-blue-600 hover:bg-blue-50'
    }] : []),
    ...(canRestorePending ? [{
      label: '恢复待付',
      icon: <RotateCcw className="w-4 h-4" />,
      onClick: () => handleStatusChange('PENDING'),
      disabled: isLoading,
      variant: 'outline' as const,
      className: 'border-orange-300 text-orange-600 hover:bg-orange-50'
    }] : []),
    
    // 编辑操作
    {
      label: '编辑',
      icon: <Edit className="w-4 h-4" />,
      onClick: handleEdit,
      disabled: isLoading || bill.status !== 'PENDING',
      variant: 'outline' as const
    },
    
    // 删除操作
    ...(canDelete ? [{
      label: '删除',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      disabled: isLoading,
      variant: 'destructive' as const,
      className: 'text-red-600 hover:text-red-700'
    }] : [])
  ]

  // 状态说明按钮
  const statusHelpAction = {
    label: '状态说明',
    icon: <HelpCircle className="w-4 h-4" />,
    onClick: () => {}, // 由Dialog组件处理
    disabled: false,
    variant: 'ghost' as const,
    className: 'text-gray-500 hover:text-gray-700'
  }
  
  return (
    <>
      <DetailPageTemplate
        title={`账单详情 - ${bill.billNumber}`}
        actions={actions}
        extraActions={
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                状态说明
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>账单状态说明</DialogTitle>
              </DialogHeader>
              <BillStatusExplanation />
            </DialogContent>
          </Dialog>
        }
      >
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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