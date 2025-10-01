'use client'

import React, { useState } from 'react'

import { ErrorLogger, ErrorSeverity, ErrorType } from '@/lib/error-logger'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { SimpleErrorAlert, SuccessAlert } from './ErrorAlert'

interface PaymentConfirmDialogProps {
  open: boolean
  onClose: () => void
  bill: any
  onConfirm: (status: string, paymentData?: any) => void
}

/**
 * 支付确认对话框组件
 * 提供收款确认功能，替代原来的PaymentStatusManagement卡片
 */
export function PaymentConfirmDialog({
  open,
  onClose,
  bill,
  onConfirm,
}: PaymentConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentData, setPaymentData] = useState({
    receivedAmount: bill.pendingAmount,
    paymentMethod: '微信', // 默认微信
    operator: '管理员', // 默认经办人
    remarks: '',
  })

  // 当账单数据变化时重新初始化收款金额
  React.useEffect(() => {
    setPaymentData((prev) => ({
      ...prev,
      receivedAmount: bill.pendingAmount,
    }))
  }, [bill.pendingAmount])

  const validatePaymentData = (): string | null => {
    if (!paymentData.paymentMethod.trim()) {
      return '请填写收款方式'
    }

    if (!paymentData.operator.trim()) {
      return '请填写经办人'
    }

    if (
      paymentData.receivedAmount <= 0 ||
      paymentData.receivedAmount > bill.pendingAmount
    ) {
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

      await onConfirm('PAID', {
        receivedAmount: newReceivedAmount,
        pendingAmount: newPendingAmount,
        paidDate: new Date(),
        paymentMethod: paymentData.paymentMethod,
        operator: paymentData.operator,
        remarks: paymentData.remarks,
      })

      const isFullyPaid = newPendingAmount <= 0
      const successMessage = isFullyPaid
        ? `收款成功！账单已全额收清 ¥${formatCurrency(paymentData.receivedAmount)}`
        : `收款成功！本次收款 ¥${formatCurrency(paymentData.receivedAmount)}，剩余待收 ¥${formatCurrency(newPendingAmount)}`

      setSuccess(successMessage)
      setTimeout(() => {
        setSuccess(null)
        onClose()
      }, 2500) // 延长显示时间以便用户阅读详细信息
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
          module: 'PaymentConfirmDialog',
          function: 'handlePaymentConfirm',
          billId: bill.id,
          paymentAmount: paymentData.receivedAmount,
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

  const handleDismissSuccess = () => {
    setSuccess(null)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {bill.status === 'PAID' ? '继续收款' : '确认收款'}
          </DialogTitle>
        </DialogHeader>

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

          {/* 账单信息摘要 */}
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">账单编号：</span>
                <span className="font-mono">{bill.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">应收金额：</span>
                <span className="font-medium">
                  {formatCurrency(bill.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">已收金额：</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(bill.receivedAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">待收金额：</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(bill.pendingAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* 收款信息表单 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="receivedAmount">收款金额 *</Label>
              <Input
                id="receivedAmount"
                type="number"
                value={paymentData.receivedAmount}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    receivedAmount: Number(e.target.value),
                  })
                }
                max={bill.pendingAmount}
                min={0}
                step="0.01"
              />
              <p className="mt-1 text-xs text-gray-500">
                {bill.status === 'PAID'
                  ? `本次可收款金额: ${formatCurrency(bill.pendingAmount)} (剩余待收)`
                  : `待收金额: ${formatCurrency(bill.pendingAmount)}`}
              </p>
            </div>

            <div>
              <Label htmlFor="paymentMethod">收款方式 *</Label>
              <select
                id="paymentMethod"
                value={paymentData.paymentMethod}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    paymentMethod: e.target.value,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="微信">微信</option>
                <option value="支付宝">支付宝</option>
                <option value="现金">现金</option>
                <option value="银行转账">银行转账</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div>
              <Label htmlFor="operator">经办人 *</Label>
              <Input
                id="operator"
                value={paymentData.operator}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    operator: e.target.value,
                  })
                }
                placeholder="收款经办人姓名"
              />
            </div>

            <div>
              <Label htmlFor="remarks">备注</Label>
              <Input
                id="remarks"
                value={paymentData.remarks}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    remarks: e.target.value,
                  })
                }
                placeholder="收款备注信息"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handlePaymentConfirm}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? '确认中...' : '确认收款'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
