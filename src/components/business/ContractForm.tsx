'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RenterSelector } from './RenterSelector'
import { RoomSelector } from './RoomSelector'
import { ErrorAlert, SimpleErrorAlert } from './ErrorAlert'
import { formatCurrency } from '@/lib/format'
import { ErrorLogger, ErrorType, ErrorSeverity } from '@/lib/error-logger'
import type { RenterWithContractsForClient, RoomWithBuildingForClient } from '@/types/database'

interface ContractFormData {
  renterId: string
  roomId: string
  startDate: string
  endDate: string
  monthlyRent: number
  deposit: number
  keyDeposit?: number
  cleaningFee?: number
  paymentMethod?: string
  paymentTiming?: string
  signedBy?: string
  signedDate?: string
  remarks?: string
}

interface ContractFormProps {
  renters: RenterWithContractsForClient[]
  availableRooms: RoomWithBuildingForClient[]
  onSubmit: (data: ContractFormData) => void
  onCancel: () => void
  loading?: boolean
  mode: 'create' | 'edit'
  initialData?: Partial<ContractFormData>
}

/**
 * 合同表单组件
 * 支持创建和编辑模式
 */
export function ContractForm({
  renters,
  availableRooms,
  onSubmit,
  onCancel,
  loading = false,
  mode,
  initialData
}: ContractFormProps) {
  const [selectedRenter, setSelectedRenter] = useState<RenterWithContractsForClient | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<RoomWithBuildingForClient | null>(null)
  const [formData, setFormData] = useState<ContractFormData>({
    renterId: '',
    roomId: '',
    startDate: '',
    endDate: '',
    monthlyRent: 0,
    deposit: 0,
    keyDeposit: 0,
    cleaningFee: 0,
    paymentMethod: '月付',
    paymentTiming: '每月1号前',
    signedBy: '',
    signedDate: '',
    remarks: ''
  })

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  // 当选择房间时，自动填充租金信息
  useEffect(() => {
    if (selectedRoom) {
      setFormData(prev => ({
        ...prev,
        roomId: selectedRoom.id,
        monthlyRent: selectedRoom.rent,
        deposit: selectedRoom.rent * 2 // 默认2个月押金
      }))
    }
  }, [selectedRoom])

  // 当选择租客时，更新租客ID
  useEffect(() => {
    if (selectedRenter) {
      setFormData(prev => ({
        ...prev,
        renterId: selectedRenter.id
      }))
    }
  }, [selectedRenter])

  const handleInputChange = (field: keyof ContractFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // 清除错误状态
    if (error) {
      setError(null)
    }
  }

  const validateForm = (): string | null => {
    if (!formData.renterId || !formData.roomId || !formData.startDate || !formData.endDate) {
      return '请填写必填信息'
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      return '结束日期必须晚于开始日期'
    }

    if (formData.monthlyRent <= 0) {
      return '月租金必须大于0'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 表单验证
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(formData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交失败，请重试'
      setError(errorMessage)
      
      // 记录错误日志
       const logger = ErrorLogger.getInstance()
       await logger.logError(
         ErrorType.VALIDATION_ERROR,
         ErrorSeverity.HIGH,
         `合同表单提交失败: ${errorMessage}`,
         {
           module: 'ContractForm',
           function: 'handleSubmit',
           formData: { ...formData, renterId: '***', roomId: '***' } // 脱敏处理
         },
         err instanceof Error ? err : undefined
       )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <SimpleErrorAlert
          title="合同表单验证失败"
          message={error}
          onRetry={handleRetry}
        />
      )}
      
      {/* 租客选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择租客</CardTitle>
        </CardHeader>
        <CardContent>
          <RenterSelector
            renters={renters}
            selectedRenter={selectedRenter}
            onRenterSelect={setSelectedRenter}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* 房间选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择房间</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomSelector
            rooms={availableRooms}
            selectedRoom={selectedRoom}
            onRoomSelect={setSelectedRoom}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* 合同基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>合同信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">开始日期 *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">结束日期 *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 租金信息 */}
      <Card>
        <CardHeader>
          <CardTitle>租金信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyRent">月租金 (元) *</Label>
              <Input
                id="monthlyRent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => handleInputChange('monthlyRent', Number(e.target.value))}
                disabled={loading}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="deposit">押金 (元) *</Label>
              <Input
                id="deposit"
                type="number"
                value={formData.deposit}
                onChange={(e) => handleInputChange('deposit', Number(e.target.value))}
                disabled={loading}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="keyDeposit">钥匙押金 (元)</Label>
              <Input
                id="keyDeposit"
                type="number"
                value={formData.keyDeposit || ''}
                onChange={(e) => handleInputChange('keyDeposit', Number(e.target.value) || 0)}
                disabled={loading}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="cleaningFee">清洁费 (元)</Label>
              <Input
                id="cleaningFee"
                type="number"
                value={formData.cleaningFee || ''}
                onChange={(e) => handleInputChange('cleaningFee', Number(e.target.value) || 0)}
                disabled={loading}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 支付信息 */}
      <Card>
        <CardHeader>
          <CardTitle>支付信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">支付方式</Label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="月付">月付</option>
                <option value="季付">季付</option>
                <option value="半年付">半年付</option>
                <option value="年付">年付</option>
              </select>
            </div>
            <div>
              <Label htmlFor="paymentTiming">付款时间</Label>
              <Input
                id="paymentTiming"
                value={formData.paymentTiming || ''}
                onChange={(e) => handleInputChange('paymentTiming', e.target.value)}
                disabled={loading}
                placeholder="如：每月1号前"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 签约信息 */}
      <Card>
        <CardHeader>
          <CardTitle>签约信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signedBy">签约人</Label>
              <Input
                id="signedBy"
                value={formData.signedBy || ''}
                onChange={(e) => handleInputChange('signedBy', e.target.value)}
                disabled={loading}
                placeholder="签约人姓名"
              />
            </div>
            <div>
              <Label htmlFor="signedDate">签约日期</Label>
              <Input
                id="signedDate"
                type="date"
                value={formData.signedDate || ''}
                onChange={(e) => handleInputChange('signedDate', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="remarks">备注</Label>
            <Textarea
              id="remarks"
              value={formData.remarks || ''}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              disabled={loading}
              placeholder="合同备注信息"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={loading || !selectedRenter || !selectedRoom}
        >
          {loading ? '处理中...' : mode === 'create' ? '创建合同' : '保存修改'}
        </Button>
      </div>

      {/* 费用预览 */}
      {selectedRoom && formData.monthlyRent > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>费用预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>月租金:</span>
                <span>{formatCurrency(formData.monthlyRent)}</span>
              </div>
              <div className="flex justify-between">
                <span>押金:</span>
                <span>{formatCurrency(formData.deposit)}</span>
              </div>
              {formData.keyDeposit && formData.keyDeposit > 0 && (
                <div className="flex justify-between">
                  <span>钥匙押金:</span>
                  <span>{formatCurrency(formData.keyDeposit)}</span>
                </div>
              )}
              {formData.cleaningFee && formData.cleaningFee > 0 && (
                <div className="flex justify-between">
                  <span>清洁费:</span>
                  <span>{formatCurrency(formData.cleaningFee)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>首次缴费总额:</span>
                <span>
                  {formatCurrency(
                    formData.monthlyRent + 
                    formData.deposit + 
                    (formData.keyDeposit || 0) + 
                    (formData.cleaningFee || 0)
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  )
}