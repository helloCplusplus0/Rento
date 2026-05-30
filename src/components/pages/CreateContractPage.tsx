'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useSettings } from '@/hooks/useSettings'
import type {
  RenterWithContractsForClient,
  RoomWithBuildingForClient,
} from '@/types/database'
import { contractCreateMobileStyles } from '@/components/business/contract-create-mobile-styles'
import { ContractForm } from '@/components/business/ContractForm'
import { PageContainer } from '@/components/layout'

interface CreateContractPageProps {
  renters: RenterWithContractsForClient[]
  availableRooms: RoomWithBuildingForClient[]
  preselectedRoomId?: string // 预选房间ID
  preselectedRenterId?: string // 预选租客ID
}

/**
 * 创建合同页面组件
 * 提供完整的合同创建流程
 */
export function CreateContractPage({
  renters,
  availableRooms,
  preselectedRoomId,
  preselectedRenterId,
}: CreateContractPageProps) {
  const router = useRouter()
  const { settings, isLoading: settingsLoading } = useSettings()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  const handleSubmit = async (contractData: any) => {
    setLoading(true)
    setProgress('正在创建合同...')

    try {
      // 创建一个AbortController来处理超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 30000) // 30秒超时

      setProgress('正在验证数据...')

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contractData,
          generateBills: settings.autoGenerateContractBills,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      setProgress('正在处理响应...')

      if (!response.ok) {
        const error = await response.json()

        // 根据不同的错误类型提供更友好的提示
        let errorMessage = '创建合同失败'
        if (response.status === 408) {
          errorMessage =
            '请求超时，可能是因为数据处理时间较长。请稍后重试，或联系管理员。'
        } else if (response.status === 400) {
          errorMessage =
            error.details || error.error || '请求参数有误，请检查输入信息'
        } else if (response.status === 500) {
          errorMessage = '服务器内部错误，请稍后重试或联系管理员'
        } else {
          errorMessage = error.message || error.error || errorMessage
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      setProgress('合同创建成功，正在跳转...')

      // 创建成功，跳转到合同详情页
      // API返回的数据结构是 { success: true, data: { contract: ..., bills: ... } }
      const contractId = result.data?.contract?.id || result.contract?.id
      if (!contractId) {
        throw new Error('创建合同成功但无法获取合同ID，请手动刷新页面查看')
      }

      // 显示成功消息
      const billCount = result.data?.bills?.length || 0
      const successMessage =
        result.data?.message ||
        `合同创建成功${billCount > 0 ? `，已生成${billCount}个账单` : ''}`

      // 短暂显示成功消息后跳转
      setProgress(successMessage)
      setTimeout(() => {
        router.replace(`/contracts/${contractId}`)
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error('创建合同失败:', error)
      setProgress('')

      let errorMessage = '创建合同失败，请重试'

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage =
            '请求超时，创建合同可能需要较长时间。请稍后重试，或检查网络连接。'
        } else {
          errorMessage = error.message
        }
      }

      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <PageContainer title="创建合同" showBackButton>
      <div className={contractCreateMobileStyles.pageSection}>
        {settingsLoading && (
          <div
            className={`${contractCreateMobileStyles.noticeCard} ${contractCreateMobileStyles.noticeMuted}`}
          >
            <div className={contractCreateMobileStyles.noticeRow}>
              <div className={contractCreateMobileStyles.noticeSpinner}></div>
              <span className={contractCreateMobileStyles.noticeText}>
                正在加载合同默认配置...
              </span>
            </div>
          </div>
        )}

        {/* 进度提示 */}
        {loading && progress && (
          <div
            className={`${contractCreateMobileStyles.noticeCard} ${contractCreateMobileStyles.noticeInfo}`}
          >
            <div className={contractCreateMobileStyles.noticeRow}>
              <div className={contractCreateMobileStyles.noticeSpinner}></div>
              <span className={contractCreateMobileStyles.noticeText}>
                {progress}
              </span>
            </div>
          </div>
        )}

        <ContractForm
          renters={renters}
          availableRooms={availableRooms}
          preselectedRoomId={preselectedRoomId}
          preselectedRenterId={preselectedRenterId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="create"
          contractDefaults={{
            defaultRentCycle: settings.defaultRentCycle,
            defaultPaymentTiming: settings.defaultPaymentTiming,
            defaultDepositMonths: settings.defaultDepositMonths,
          }}
        />
      </div>
    </PageContainer>
  )
}
