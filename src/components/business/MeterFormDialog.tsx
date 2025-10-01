'use client'

import { useCallback, useState } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { toast } from 'sonner'

import type { MeterFormData, MeterWithReadingsForClient } from '@/types/meter'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { MeterForm } from './MeterForm'

/**
 * 弹框状态类型
 */
interface DialogState {
  isOpen: boolean
  isSubmitting: boolean
  hasError: boolean
  errorMessage: string
}

/**
 * 仪表表单弹框属性
 */
interface MeterFormDialogProps {
  /** 房间ID */
  roomId: string
  /** 编辑的仪表数据（为空时表示新增模式） */
  meter?: MeterWithReadingsForClient
  /** 弹框开启状态 */
  isOpen: boolean
  /** 弹框关闭回调 */
  onClose: () => void
  /** 操作成功回调 */
  onSuccess: () => void
}

/**
 * 仪表配置表单弹框组件
 *
 * 特性：
 * 1. 统一的错误处理和用户反馈
 * 2. 优雅的加载状态管理
 * 3. 响应式设计适配
 * 4. 键盘快捷键支持
 * 5. 表单数据变更确认
 */
export function MeterFormDialog({
  roomId,
  meter,
  isOpen,
  onClose,
  onSuccess,
}: MeterFormDialogProps) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    isSubmitting: false,
    hasError: false,
    errorMessage: '',
  })

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback(
    async (formData: MeterFormData) => {
      setDialogState((prev) => ({
        ...prev,
        isSubmitting: true,
        hasError: false,
        errorMessage: '',
      }))

      try {
        let response: Response

        if (meter) {
          // 更新仪表
          response = await fetch(`/api/meters/${meter.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          })
        } else {
          // 添加仪表
          response = await fetch(`/api/rooms/${roomId}/meters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          })
        }

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || `${meter ? '更新' : '添加'}仪表失败`)
        }

        // 成功提示
        toast.success(meter ? '仪表配置更新成功' : '仪表配置添加成功', {
          description: `${formData.displayName} 已成功${meter ? '更新' : '添加'}`,
          duration: 3000,
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        })

        // 关闭弹框并触发成功回调
        onClose()
        onSuccess()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '操作失败，请重试'

        setDialogState((prev) => ({
          ...prev,
          hasError: true,
          errorMessage,
        }))

        // 错误提示
        toast.error(meter ? '仪表更新失败' : '仪表添加失败', {
          description: errorMessage,
          duration: 5000,
          icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        })
      } finally {
        setDialogState((prev) => ({ ...prev, isSubmitting: false }))
      }
    },
    [roomId, meter, onClose, onSuccess]
  )

  /**
   * 处理弹框关闭
   */
  const handleClose = useCallback(() => {
    if (dialogState.isSubmitting) {
      return // 提交中不允许关闭
    }
    onClose()
  }, [dialogState.isSubmitting, onClose])

  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !dialogState.isSubmitting) {
        handleClose()
      }
    },
    [dialogState.isSubmitting, handleClose]
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* 弹框头部 */}
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                {meter ? '编辑仪表配置' : '添加仪表配置'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-gray-600">
                {meter
                  ? '修改仪表的配置信息，包括显示名称、单价设置等。'
                  : '为房间添加新的仪表配置，设置仪表类型、单价和其他相关信息。'}
              </DialogDescription>
            </div>

            {/* 关闭按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={dialogState.isSubmitting}
              className="ml-4 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 错误提示 */}
          {dialogState.hasError && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
                <p className="text-sm text-red-800">
                  {dialogState.errorMessage}
                </p>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* 表单内容区域 */}
        <div className="flex-1 overflow-y-auto">
          <MeterForm
            key={meter ? meter.id : 'new'}
            roomId={roomId}
            meter={meter}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            loading={dialogState.isSubmitting}
          />
        </div>

        {/* 提交状态遮罩 */}
        {dialogState.isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50">
            <div className="flex items-center gap-3 rounded-lg bg-white p-6 shadow-lg">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">
                {meter ? '正在更新仪表配置...' : '正在添加仪表配置...'}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
