'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimpleErrorAlert, SuccessAlert } from './ErrorAlert'
import { formatCurrency } from '@/lib/format'
import { ErrorLogger, ErrorType, ErrorSeverity } from '@/lib/error-logger'

interface PaymentStatusManagementProps {
  bill: any
  onStatusChange: (status: string, paymentData?: any) => void
}

/**
 * 支付状态管理组件
 * 提供账单状态更新和支付确认功能
 */
export function PaymentStatusManagement({ bill, onStatusChange }: PaymentStatusManagementProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentData, setPaymentData] = useState({
    receivedAmount: bill.pendingAmount,
    paymentMethod: '微信', // 默认微信
    operator: '管理员', // 默认经办人
    remarks: ''
  })

  const validatePaymentData = (): string | null => {
    if (!paymentData.paymentMethod.trim()) {
      return '请填写收款方式'
    }
    
    if (!paymentData.operator.trim()) {
      return '请填写经办人'
    }

    if (paymentData.receivedAmount <= 0 || paymentData.receivedAmount > bill.pendingAmount) {
      return '收款金额必须大于0且不能超过待收金额'
    }

    return null
  }

  const handlePaymentConfirm = async () => {
    const validationError = validatePaymentData()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const newReceivedAmount = bill.receivedAmount + paymentData.receivedAmount
      const newPendingAmount = bill.amount - newReceivedAmount

      await onStatusChange('PAID', {
        receivedAmount: newReceivedAmount,
        pendingAmount: newPendingAmount,
        paidDate: new Date(),
        paymentMethod: paymentData.paymentMethod,
        operator: paymentData.operator,
        remarks: paymentData.remarks
      })
      
      setShowPaymentForm(false)
      setSuccess('收款确认成功')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '收款确认失败'
      setError(errorMessage)
      
      // 记录错误日志
      const logger = ErrorLogger.getInstance()
      await logger.logError(
        ErrorType.BILL_GENERATION,
        ErrorSeverity.HIGH,
        `收款确认失败: ${errorMessage}`,
        {
          module: 'PaymentStatusManagement',
          function: 'handlePaymentConfirm',
          billId: bill.id,
          paymentAmount: paymentData.receivedAmount
        },
        err instanceof Error ? err : undefined
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await onStatusChange(status)
      setSuccess(`状态已更新为${status === 'COMPLETED' ? '已完成' : status === 'PENDING' ? '待付款' : status}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '状态更新失败'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setError(null)
  }

  const handleDismissSuccess = () => {
    setSuccess(null)
  }

  // 根据到期日期自动判断是否逾期
  const today = new Date()
  const dueDate = new Date(bill.dueDate)
  const isActuallyOverdue = today > dueDate && bill.status !== 'PAID' && bill.status !== 'COMPLETED'
  
  const canConfirmPayment = bill.status === 'PENDING' || isActuallyOverdue
  const canMarkCompleted = bill.status === 'PAID' && bill.pendingAmount === 0

  return (
    <div className="space-y-4">
      {/* 错误提示 */}
      {error && (
        <SimpleErrorAlert
          title="操作失败"
          message={error}
          onRetry={handleRetry}
        />
      )}
      
      {/* 成功提示 */}
      {success && (
        <SuccessAlert
          title="操作成功"
          message={success}
          onDismiss={handleDismissSuccess}
        />
      )}
      
      <Card>
      <CardHeader>
        <CardTitle className="text-lg">支付状态管理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {canConfirmPayment && bill.pendingAmount > 0 && (
            <Button 
              onClick={() => setShowPaymentForm(true)}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              确认收款
            </Button>
          )}
          
          {canMarkCompleted && (
            <Button 
              variant="outline"
              onClick={() => handleStatusChange('COMPLETED')}
              disabled={isSubmitting}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              标记完成
            </Button>
          )}

          {bill.status === 'OVERDUE' && (
            <Button 
              variant="outline"
              onClick={() => handleStatusChange('PENDING')}
              disabled={isSubmitting}
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              恢复待付
            </Button>
          )}
        </div>

        {/* 当前状态说明 */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>当前状态：</strong>
            {isActuallyOverdue ? '逾期' : 
             bill.status === 'PENDING' ? '待付款' :
             bill.status === 'PAID' ? '已付款' : 
             bill.status === 'COMPLETED' ? '已完成' : bill.status}
          </p>
          {bill.pendingAmount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              <strong>待收金额：</strong>{formatCurrency(bill.pendingAmount)}
            </p>
          )}
          {isActuallyOverdue && (
            <p className="text-sm text-red-600 mt-1">
              <strong>逾期天数：</strong>
              {Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))} 天
            </p>
          )}
        </div>

        {showPaymentForm && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="font-medium">确认收款信息</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receivedAmount">收款金额 *</Label>
                <Input
                  id="receivedAmount"
                  type="number"
                  value={paymentData.receivedAmount}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    receivedAmount: Number(e.target.value)
                  })}
                  max={bill.pendingAmount}
                  min={0}
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  待收金额: {formatCurrency(bill.pendingAmount)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="paymentMethod">收款方式 *</Label>
                <select
                  id="paymentMethod"
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    paymentMethod: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="微信">微信</option>
                  <option value="支付宝">支付宝</option>
                  <option value="现金">现金</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="operator">经办人 *</Label>
                <Input
                  id="operator"
                  value={paymentData.operator}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    operator: e.target.value
                  })}
                  placeholder="收款经办人姓名"
                />
              </div>
              
              <div>
                <Label htmlFor="remarks">备注</Label>
                <Input
                  id="remarks"
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    remarks: e.target.value
                  })}
                  placeholder="收款备注信息"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handlePaymentConfirm}>
                确认收款
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentForm(false)}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}