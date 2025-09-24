'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SimpleErrorAlert, SuccessAlert } from './ErrorAlert'
import { ErrorLogger, ErrorType, ErrorSeverity } from '@/lib/error-logger'

interface BillActionsProps {
  bill: any
  onEdit: () => void
  onDelete: () => void
}

/**
 * 账单操作组件
 * 提供账单的各种操作功能
 */
export function BillActions({ bill, onEdit, onDelete }: BillActionsProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePrint = () => {
    try {
      window.print()
      setSuccess('打印任务已发送')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('打印失败，请检查浏览器设置')
    }
  }

  const handleSendReminder = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // 发送提醒功能 - 后续实现
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('提醒已发送')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送提醒失败'
      setError(errorMessage)
      
      // 记录错误日志
      const logger = ErrorLogger.getInstance()
      await logger.logError(
        ErrorType.EXTERNAL_SERVICE,
        ErrorSeverity.MEDIUM,
        `发送账单提醒失败: ${errorMessage}`,
        {
          module: 'BillActions',
          function: 'handleSendReminder',
          billId: bill.id
        },
        err instanceof Error ? err : undefined
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyBillInfo = async () => {
    try {
      const billInfo = `
账单信息：
账单编号：${bill.billNumber}
房间信息：${bill.contract.room.building.name} - ${bill.contract.room.roomNumber}
租客姓名：${bill.contract.renter.name}
应收金额：¥${bill.amount}
已收金额：¥${bill.receivedAmount}
待收金额：¥${bill.pendingAmount}
到期日期：${new Date(bill.dueDate).toLocaleDateString()}
账单状态：${bill.status === 'PENDING' ? '待付款' : 
           bill.status === 'PAID' ? '已付款' : 
           bill.status === 'OVERDUE' ? '逾期' : 
           bill.status === 'COMPLETED' ? '已完成' : bill.status}
      `.trim()

      await navigator.clipboard.writeText(billInfo)
      setSuccess('账单信息已复制到剪贴板')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('复制失败，请手动复制账单信息')
    }
  }

  const handleRetry = () => {
    setError(null)
  }

  const handleDismissSuccess = () => {
    setSuccess(null)
  }

  const canDelete = bill.status === 'PENDING' || (bill.status === 'PAID' && bill.receivedAmount === 0)

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
        <CardTitle className="text-lg">操作</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button 
            variant="outline" 
            onClick={onEdit}
            disabled={isLoading}
          >
            编辑账单
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handlePrint}
            disabled={isLoading}
          >
            打印账单
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleCopyBillInfo}
            disabled={isLoading}
          >
            复制信息
          </Button>
          
          {(bill.status === 'PENDING' || bill.status === 'OVERDUE') && (
            <Button 
              variant="outline" 
              onClick={handleSendReminder}
              disabled={isLoading}
            >
              {isLoading ? '发送中...' : '发送提醒'}
            </Button>
          )}
          
          {canDelete && (
            <Button 
              variant="outline" 
              onClick={onDelete}
              disabled={isLoading}
              className="border-red-300 text-red-600 hover:bg-red-50 col-span-2 md:col-span-1"
            >
              删除账单
            </Button>
          )}
        </div>
        
        {!canDelete && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            <p>💡 提示：已收款的账单不能删除，如需修改请联系管理员</p>
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>• 编辑功能暂时跳转到账单列表页面</p>
          <p>• 打印功能会打印当前页面内容</p>
          <p>• 发送提醒功能正在开发中</p>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}