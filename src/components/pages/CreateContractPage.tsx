'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type {
  RenterWithContractsForClient,
  RoomWithBuildingForClient,
} from '@/types/database'
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
          generateBills: true, // 自动生成账单
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
        router.push(`/contracts/${contractId}`)
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

      // 使用更友好的错误提示
      alert(
        `❌ ${errorMessage}\n\n💡 建议：\n• 检查网络连接是否正常\n• 确认所有必填信息已正确填写\n• 如问题持续存在，请联系系统管理员`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <PageContainer title="创建合同" showBackButton>
      <div className="pb-6">
        {/* 进度提示 */}
        {loading && progress && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-800">{progress}</span>
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
        />
      </div>
    </PageContainer>
  )
}
