'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import type {
  MeterWithReadingsForClient,
  RoomMeterManagementProps,
} from '@/types/meter'

import { MeterFormDialog } from './MeterFormDialog'
import { MeterList } from './MeterList'

type MeterRemovalAction = 'deactivate' | 'already_inactive' | 'hard_delete'

interface MeterRemovalResponse {
  success: boolean
  action: MeterRemovalAction
  message: string
  hasHistoricalFacts: boolean
  details?: {
    suggestion?: string
  }
}

/**
 * 房间仪表管理组件
 * 集成仪表列表、添加、编辑、删除功能
 */
export function RoomMeterManagement({
  roomId,
  meters,
  onMeterUpdate,
  loading = false,
}: RoomMeterManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMeter, setEditingMeter] = useState<
    MeterWithReadingsForClient | undefined
  >()

  // 打开添加仪表表单
  const handleAddMeter = () => {
    setEditingMeter(undefined)
    setIsFormOpen(true)
  }

  // 打开编辑仪表表单
  const handleEditMeter = (meter: MeterWithReadingsForClient) => {
    setEditingMeter(meter)
    setIsFormOpen(true)
  }

  // 关闭表单
  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMeter(undefined)
  }

  // 表单操作成功后的处理
  const handleFormSuccess = () => {
    onMeterUpdate()
  }

  // 删除仪表
  const handleDeleteMeter = async (meterId: string) => {
    try {
      const response = await fetch(`/api/meters/${meterId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove meter')
      }

      const result = (await response.json()) as MeterRemovalResponse

      switch (result.action) {
        case 'deactivate':
          toast.success(
            result.message || '仪表已有历史，已停用并保留历史读数与计费事实'
          )
          break
        case 'already_inactive':
          toast.success(
            result.message || '仪表已处于停用状态，历史读数与计费事实继续保留'
          )
          break
        case 'hard_delete':
          toast.success(result.message || '仪表无历史，已执行硬删除')
          break
        default:
          toast.success('仪表处理成功')
      }

      onMeterUpdate()
    } catch (error) {
      console.error('Failed to remove meter:', error)
      toast.error(error instanceof Error ? error.message : '移除失败，请重试')
    }
  }

  // 切换仪表状态
  const handleToggleMeterStatus = async (
    meterId: string,
    newStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/meters/${meterId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update meter status')
      }

      toast.success(`仪表已${newStatus ? '启用' : '禁用'}`)
      onMeterUpdate()
    } catch (error) {
      console.error('Failed to toggle meter status:', error)
      toast.error(
        error instanceof Error ? error.message : '状态切换失败，请重试'
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">换表说明</p>
        <p className="mt-1 leading-6">
          当前默认换表路径是先停用旧表并保留历史，再新增新表。
          点击“移除”时，系统会先检查该仪表是否已有抄表或计费历史:
          有历史则仅停用保留，无历史才会执行硬删除。
        </p>
      </div>

      {/* 仪表列表 */}
      <MeterList
        meters={meters}
        loading={loading}
        onAdd={handleAddMeter}
        actions={{
          onEdit: handleEditMeter,
          onDelete: handleDeleteMeter,
          onToggleStatus: handleToggleMeterStatus,
        }}
      />

      {/* 仪表配置表单弹窗 */}
      <MeterFormDialog
        roomId={roomId}
        meter={editingMeter}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
