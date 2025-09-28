'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ContractWithDetailsForClient } from '@/types/database'

interface EditContractPageSimpleProps {
  contract: ContractWithDetailsForClient
}

/**
 * 简化的合同编辑页面组件
 * 专门用于编辑合同，不复用添加合同的逻辑
 * 只允许编辑签约信息，确保合同的完整性和安全性
 */
export function EditContractPageSimple({ contract }: EditContractPageSimpleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    signedBy: contract.signedBy || '',
    signedDate: contract.signedDate ? contract.signedDate.toISOString().split('T')[0] : '',
    remarks: contract.remarks || ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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

  return (
    <PageContainer title={`编辑合同 - ${contract.contractNumber}`} showBackButton>
      <div className="max-w-2xl mx-auto pb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 合同基本信息展示 */}
          <Card>
            <CardHeader>
              <CardTitle>合同信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">合同编号</Label>
                  <p className="font-medium">{contract.contractNumber}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">合同状态</Label>
                  <p className="font-medium">{contract.status}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">租客</Label>
                  <p className="font-medium">{contract.renter.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">房间</Label>
                  <p className="font-medium">{contract.room.building.name} - {contract.room.roomNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 编辑说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">编辑说明</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• 为保证合同的完整性和法律效力，生效中的合同只允许编辑签约信息</p>
              <p>• 费用信息、支付方式、合同期限等核心条款不可修改</p>
              <p>• 如需调整费用或条款，请通过合同续约功能处理</p>
            </div>
          </div>

          {/* 签约信息编辑 */}
          <Card>
            <CardHeader>
              <CardTitle>签约信息</CardTitle>
              <p className="text-sm text-gray-600">
                签约人通常为租客本人，如有代签情况请确保信息准确
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signedBy">签约人 *</Label>
                  <Input
                    id="signedBy"
                    value={formData.signedBy}
                    onChange={(e) => handleInputChange('signedBy', e.target.value)}
                    disabled={loading}
                    placeholder="签约人姓名"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    合同签署人，通常为租客本人
                  </p>
                </div>
                <div>
                  <Label htmlFor="signedDate">签约日期</Label>
                  <Input
                    id="signedDate"
                    type="date"
                    value={formData.signedDate}
                    onChange={(e) => handleInputChange('signedDate', e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    合同正式签署的日期
                  </p>
                </div>
              </div>
              
              {/* 备注字段 */}
              <div>
                <Label htmlFor="remarks">备注</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  disabled={loading}
                  placeholder="合同备注信息（可选）"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  可以记录合同相关的特殊说明或注意事项
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-4 justify-end">
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
              disabled={loading}
            >
              {loading ? '保存中...' : '保存修改'}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}