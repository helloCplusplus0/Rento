'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type {
  BillFormData,
  BillType,
  ContractWithDetailsForClient,
} from '@/types/database'
import {
  ErrorLogger,
  ErrorSeverity,
  ErrorType,
  type ErrorRecord,
} from '@/lib/error-logger'
import { BillInfoForm } from '@/components/business/BillInfoForm'
import { BillTypeSelector } from '@/components/business/BillTypeSelector'
import { ContractSelector } from '@/components/business/ContractSelector'
import { ErrorAlert } from '@/components/business/ErrorAlert'
import { PageContainer } from '@/components/layout'

interface CreateBillPageProps {
  contracts: ContractWithDetailsForClient[]
}

/**
 * 创建账单页面组件
 * 提供手动创建账单的完整流程
 */
export function CreateBillPage({ contracts }: CreateBillPageProps) {
  const router = useRouter()
  const [selectedContract, setSelectedContract] =
    useState<ContractWithDetailsForClient>()
  const [billType, setBillType] = useState<BillType>('OTHER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<ErrorRecord | null>(null)
  const logger = ErrorLogger.getInstance()

  const handleSubmit = async (billData: BillFormData) => {
    if (!selectedContract) {
      const errorRecord: ErrorRecord = {
        id: `validation_${Date.now()}`,
        timestamp: new Date(),
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: '请先选择合同',
        context: {
          module: 'create-bill-page',
          function: 'handleSubmit',
        },
      }
      setError(errorRecord)
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      logger.logInfo('开始创建账单', {
        module: 'create-bill-page',
        contractId: selectedContract.id,
        billType,
      })

      // #region debug-point A:create-bill-submit
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'other-bill-create-error',
          runId: 'pre-fix',
          hypothesisId: 'A',
          location: 'CreateBillPage.tsx:67',
          msg: '[DEBUG] create bill submit payload',
          data: {
            contractId: selectedContract.id,
            billType,
            itemLabel: billData.itemLabel,
            itemLabelTrimmed:
              typeof billData.itemLabel === 'string'
                ? billData.itemLabel.trim()
                : null,
            period: billData.period,
            amount: billData.amount,
            dueDate:
              billData.dueDate instanceof Date
                ? billData.dueDate.toISOString()
                : String(billData.dueDate),
          },
          ts: Date.now(),
        }),
      }).catch(() => {})
      // #endregion

      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...billData,
          contractId: selectedContract.id,
          type: billType,
          operator: '手动创建',
          paymentMethod: '待确定',
        }),
      })

      // #region debug-point B:create-bill-response
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'other-bill-create-error',
          runId: 'pre-fix',
          hypothesisId: 'B',
          location: 'CreateBillPage.tsx:96',
          msg: '[DEBUG] create bill response status',
          data: {
            status: response.status,
            ok: response.ok,
          },
          ts: Date.now(),
        }),
      }).catch(() => {})
      // #endregion

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '创建账单失败')
      }

      const newBill = await response.json()

      logger.logInfo('账单创建成功', {
        module: 'create-bill-page',
        billId: newBill.id,
        billNumber: newBill.billNumber,
      })

      // 跳转后立即刷新详情树，避免沿用写前预取快照
      router.replace(`/bills/${newBill.id}`)
      router.refresh()
    } catch (error) {
      const errorRecord: ErrorRecord = {
        id: `bill_creation_${Date.now()}`,
        timestamp: new Date(),
        type: ErrorType.BILL_GENERATION,
        severity: ErrorSeverity.HIGH,
        message: error instanceof Error ? error.message : '创建账单失败',
        context: {
          module: 'create-bill-page',
          function: 'handleSubmit',
          contractId: selectedContract.id,
          billType,
        },
        stack: error instanceof Error ? error.stack : undefined,
      }

      await logger.logError(
        ErrorType.BILL_GENERATION,
        ErrorSeverity.HIGH,
        errorRecord.message,
        errorRecord.context,
        error instanceof Error ? error : undefined
      )

      setError(errorRecord)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setError(null)
  }

  const handleDismissError = () => {
    setError(null)
  }

  return (
    <PageContainer title="创建账单" showBackButton loading={isSubmitting}>
      <div className="space-y-6 pb-6">
        {/* 错误提示 */}
        {error && (
          <ErrorAlert
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            showDetails={process.env.NODE_ENV === 'development'}
          />
        )}

        {/* 使用说明 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-blue-800">使用说明</h3>
          <p className="text-sm text-blue-700">
            手动创建账单主要用于处理临时费用、特殊收费等情况。
            大部分常规账单（租金、押金、水电费）会在合同签订和抄表时自动生成。
          </p>
        </div>

        {/* 合同选择 */}
        <ContractSelector
          contracts={contracts}
          selectedContract={selectedContract}
          onContractSelect={setSelectedContract}
        />

        {/* 账单类型选择 */}
        {selectedContract && (
          <BillTypeSelector
            selectedType={billType}
            onTypeChange={setBillType}
            contract={selectedContract}
          />
        )}

        {/* 账单信息表单 */}
        {selectedContract && (
          <BillInfoForm
            billType={billType}
            contract={selectedContract}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {/* 空状态提示 */}
        {contracts.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              暂无活跃合同
            </h3>
            <p className="text-gray-600">需要先创建并激活合同才能创建账单</p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
