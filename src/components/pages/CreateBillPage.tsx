'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { ContractSelector } from '@/components/business/ContractSelector'
import { BillTypeSelector } from '@/components/business/BillTypeSelector'
import { BillInfoForm } from '@/components/business/BillInfoForm'
import { ErrorAlert } from '@/components/business/ErrorAlert'
import { ErrorLogger, ErrorType, ErrorSeverity } from '@/lib/error-logger'
import type { ContractWithDetailsForClient, BillType, BillFormData } from '@/types/database'
import type { ErrorRecord } from '@/lib/error-logger'

interface CreateBillPageProps {
  contracts: ContractWithDetailsForClient[]
}

/**
 * 创建账单页面组件
 * 提供手动创建账单的完整流程
 */
export function CreateBillPage({ contracts }: CreateBillPageProps) {
  const router = useRouter()
  const [selectedContract, setSelectedContract] = useState<ContractWithDetailsForClient>()
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
          function: 'handleSubmit'
        }
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
        billType
      })

      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...billData,
          contractId: selectedContract.id,
          type: billType,
          operator: '手动创建',
          paymentMethod: '待确定'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '创建账单失败')
      }
      
      const newBill = await response.json()
      
      logger.logInfo('账单创建成功', {
        module: 'create-bill-page',
        billId: newBill.id,
        billNumber: newBill.billNumber
      })
      
      // 跳转到账单详情页
      router.push(`/bills/${newBill.id}`)
      
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
          billType
        },
        stack: error instanceof Error ? error.stack : undefined
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
    <PageContainer 
      title="创建账单" 
      showBackButton
      loading={isSubmitting}
    >
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">使用说明</h3>
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
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无活跃合同</h3>
            <p className="text-gray-600">需要先创建并激活合同才能创建账单</p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}