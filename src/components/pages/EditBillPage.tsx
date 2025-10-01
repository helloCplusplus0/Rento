'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/format'
import { BillStatusBadge } from '@/components/ui/status-badge'

interface EditBillPageProps {
  bill: any // 简化类型，避免复杂的类型转换
}

interface EditBillFormData {
  amount: number
  dueDate: string
  period: string
  remarks: string
}

export function EditBillPage({ bill }: EditBillPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // 初始化表单数据
  const [formData, setFormData] = useState<EditBillFormData>({
    amount: bill.amount,
    dueDate: new Date(bill.dueDate).toISOString().split('T')[0],
    period: bill.period || '',
    remarks: bill.remarks || ''
  })

  // 检查是否可以编辑
  const canEdit = bill.status === 'PENDING'

  const handleInputChange = (field: keyof EditBillFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // 清除错误信息
    if (error) setError(null)
  }

  const validateForm = (): string | null => {
    if (formData.amount <= 0) {
      return '应收金额必须大于0'
    }
    
    if (!formData.dueDate) {
      return '到期日期不能为空'
    }
    
    const dueDate = new Date(formData.dueDate)
    if (isNaN(dueDate.getTime())) {
      return '到期日期格式不正确'
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: formData.amount,
          pendingAmount: formData.amount - bill.receivedAmount, // 重新计算待收金额
          dueDate: new Date(formData.dueDate).toISOString(),
          period: formData.period,
          remarks: formData.remarks
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '更新账单失败')
      }

      setSuccess('账单更新成功')
      
      // 立即跳转，不使用延迟
      router.push(`/bills/${bill.id}`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新账单失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/bills/${bill.id}`)
  }

  return (
    <PageContainer 
      title="编辑账单" 
      showBackButton
      loading={loading}
    >
      <div className="space-y-6 pb-6">
        {/* 权限检查提示 */}
        {!canEdit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-800 mb-2">编辑限制说明</h3>
            <div className="text-sm text-amber-700 space-y-1">
              <p>• 只有"待付款"状态的账单才能编辑关键信息</p>
              <p>• 已收款或已完成的账单不允许编辑，以保证财务数据的完整性</p>
              <p>• 如需调整已收款账单，请联系管理员或通过其他方式处理</p>
            </div>
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* 账单基本信息展示 */}
        <Card>
          <CardHeader>
            <CardTitle>账单基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">账单编号</Label>
                <p className="text-sm font-mono">{bill.billNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">账单类型</Label>
                <p className="text-sm">
                  {bill.type === 'RENT' ? '租金' : 
                   bill.type === 'DEPOSIT' ? '押金' : 
                   bill.type === 'UTILITIES' ? '水电费' : '其他'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">当前状态</Label>
                <div className="mt-1">
                  <BillStatusBadge status={bill.status} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">已收金额</Label>
                <p className="text-sm text-green-600 font-medium">{formatCurrency(bill.receivedAmount)}</p>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">租客信息</Label>
                  <p className="text-sm">{bill.contract.renter.name} - {bill.contract.renter.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">房间信息</Label>
                  <p className="text-sm">{bill.contract.room.building.name} - {bill.contract.room.roomNumber}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 编辑表单 */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>可编辑字段</CardTitle>
              <p className="text-sm text-gray-600">
                以下字段可以根据实际情况进行调整
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 应收金额 */}
                <div>
                  <Label htmlFor="amount">应收金额 (元) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    disabled={!canEdit || loading}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    当前待收金额将自动重新计算：¥{(formData.amount - bill.receivedAmount).toFixed(2)}
                  </p>
                </div>

                {/* 到期日期 */}
                <div>
                  <Label htmlFor="dueDate">到期日期 *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    disabled={!canEdit || loading}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    用于统一管理多个合同的缴费时间
                  </p>
                </div>
              </div>

              {/* 缴费周期 */}
              <div>
                <Label htmlFor="period">缴费周期</Label>
                <Input
                  id="period"
                  value={formData.period}
                  onChange={(e) => handleInputChange('period', e.target.value)}
                  disabled={!canEdit || loading}
                  placeholder="如：2024-01 至 2024-01"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  描述此账单对应的时间周期
                </p>
              </div>

              {/* 备注 */}
              <div>
                <Label htmlFor="remarks">备注</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  disabled={!canEdit || loading}
                  placeholder="请输入账单相关备注信息..."
                  rows={3}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  记录账单调整原因或其他重要信息
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!canEdit || loading}
            >
              {loading ? '保存中...' : '保存修改'}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}