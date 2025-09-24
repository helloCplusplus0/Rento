'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DetailPageTemplate } from '@/components/layout/DetailPageTemplate'
import { BillBasicInfo } from '@/components/business/BillBasicInfo'
import { ContractRenterInfo } from '@/components/business/ContractRenterInfo'
import { PaymentStatusManagement } from '@/components/business/PaymentStatusManagement'
import { Edit, Trash2, CreditCard } from 'lucide-react'

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
    if (!confirm(`确定要删除账单 ${bill.billNumber} 吗？此操作不可恢复。`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/bills/${bill.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/bills')
      } else {
        const error = await response.json()
        alert(error.message || '删除失败')
      }
    } catch (error) {
      console.error('删除账单失败:', error)
      alert('删除失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = () => {
    // TODO: 实现支付功能
    console.log('处理支付:', bill.id)
  }

  // 定义操作按钮
  const actions = [
    ...(bill.status === 'PENDING' ? [{
      label: '确认支付',
      icon: <CreditCard className="w-4 h-4" />,
      onClick: handlePayment,
      disabled: isLoading,
      variant: 'default' as const
    }] : []),
    {
      label: '编辑',
      icon: <Edit className="w-4 h-4" />,
      onClick: handleEdit,
      disabled: isLoading
    },
    {
      label: '删除',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      disabled: isLoading,
      variant: 'destructive' as const,
      className: 'text-red-600 hover:text-red-700'
    }
  ]
  
  return (
    <DetailPageTemplate
      title={`账单详情 - ${bill.billNumber}`}
      actions={actions}
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
      
      {/* 合同和租客信息 - 移动端优化布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ContractRenterInfo bill={bill} />
        </div>
        <div className="space-y-6">
          <PaymentStatusManagement
             bill={bill}
             onStatusChange={handleStatusChange}
           />
        </div>
      </div>
    </DetailPageTemplate>
  )
}