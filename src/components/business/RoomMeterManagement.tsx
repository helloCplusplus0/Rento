'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { MeterList } from './MeterList'
import { MeterForm } from './MeterForm'
import type { RoomMeterManagementProps, MeterWithReadingsForClient, MeterFormData } from '@/types/meter'

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
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // 提交仪表表单
  const handleSubmitForm = async (formData: MeterFormData) => {
    setIsSubmitting(true)
    try {
      if (editingMeter) {
        // 更新仪表
        const response = await fetch(`/api/meters/${editingMeter.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update meter')
        }

        toast.success('仪表更新成功')
      } else {
        // 添加仪表
        const response = await fetch(`/api/rooms/${roomId}/meters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create meter')
        }

        toast.success('仪表添加成功')
      }

      // 关闭表单并刷新数据
      handleCloseForm()
      onMeterUpdate()
    } catch (error) {
      console.error('Failed to submit meter form:', error)
      toast.error(error instanceof Error ? error.message : '操作失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 删除仪表
  const handleDeleteMeter = async (meterId: string) => {
    // 移除原来的confirm对话框，因为现在使用AlertDialog组件处理确认
    try {
      const response = await fetch(`/api/meters/${meterId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete meter')
      }

      toast.success('仪表删除成功')
      onMeterUpdate()
    } catch (error) {
      console.error('Failed to delete meter:', error)
      toast.error(error instanceof Error ? error.message : '删除失败，请重试')
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
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMeter ? '编辑仪表配置' : '添加仪表配置'}
            </DialogTitle>
          </DialogHeader>
          
          <MeterForm
            roomId={roomId}
            meter={editingMeter}
            onSubmit={handleSubmitForm}
            onCancel={handleCloseForm}
            loading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}