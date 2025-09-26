'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MeterList } from './MeterList'
import { MeterFormDialog } from './MeterFormDialog'
import type { RoomMeterManagementProps, MeterWithReadingsForClient } from '@/types/meter'

/**
 * 房间仪表管理组件
 * 集成仪表列表、添加、编辑、删除功能
 */
export function RoomMeterManagement({
  roomId,
  meters,
  onMeterUpdate,
  loading = false
}: RoomMeterManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMeter, setEditingMeter] = useState<MeterWithReadingsForClient | undefined>()

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
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove meter')
      }

      const result = await response.json()
      
      // 根据删除类型显示不同的成功消息
      if (result.action === 'soft_delete') {
        toast.success('仪表关联已移除，历史数据已保留')
      } else {
        toast.success('仪表移除成功')
      }
      
      onMeterUpdate()
    } catch (error) {
      console.error('Failed to remove meter:', error)
      toast.error(error instanceof Error ? error.message : '移除失败，请重试')
    }
  }

  // 切换仪表状态
  const handleToggleMeterStatus = async (meterId: string, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/meters/${meterId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update meter status')
      }

      toast.success(`仪表已${newStatus ? '启用' : '禁用'}`)
      onMeterUpdate()
    } catch (error) {
      console.error('Failed to toggle meter status:', error)
      toast.error(error instanceof Error ? error.message : '状态切换失败，请重试')
    }
  }

  return (
    <div className="space-y-6">
      {/* 仪表列表 */}
      <MeterList
        meters={meters}
        loading={loading}
        onAdd={handleAddMeter}
        actions={{
          onEdit: handleEditMeter,
          onDelete: handleDeleteMeter,
          onToggleStatus: handleToggleMeterStatus
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