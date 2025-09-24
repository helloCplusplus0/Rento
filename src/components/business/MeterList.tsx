'use client'

import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { MeterCard } from './MeterCard'
import type { MeterListProps } from '@/types/meter'

/**
 * 仪表列表组件
 * 显示房间的所有仪表，支持添加、编辑、删除操作
 */
export function MeterList({
  meters,
  loading = false,
  onAdd,
  actions
}: MeterListProps) {
  // 确保meters是数组，防止运行时错误
  const safeMeters = Array.isArray(meters) ? meters : []
  
  // 按类型和排序值对仪表进行分组和排序
  const sortedMeters = [...safeMeters].sort((a, b) => {
    // 首先按类型排序
    if (a.meterType !== b.meterType) {
      const typeOrder = ['ELECTRICITY', 'COLD_WATER', 'HOT_WATER', 'GAS']
      return typeOrder.indexOf(a.meterType) - typeOrder.indexOf(b.meterType)
    }
    // 然后按排序值排序
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }
    // 最后按显示名称排序
    return a.displayName.localeCompare(b.displayName)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">加载仪表信息...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 标题和添加按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">仪表管理</h3>
          <p className="text-sm text-gray-500">
            管理房间的水电表配置，支持多种类型仪表
          </p>
        </div>
        <Button
          onClick={onAdd}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加仪表
        </Button>
      </div>

      {/* 仪表列表 */}
      {sortedMeters.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无仪表配置
          </h3>
          <p className="text-gray-500 mb-4">
            为这个房间添加水电表配置，开始管理用量和费用
          </p>
          <Button onClick={onAdd} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            添加第一个仪表
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMeters.map((meter) => (
            <MeterCard
              key={meter.id}
              meter={meter}
              onEdit={() => actions.onEdit(meter)}
              onDelete={() => actions.onDelete(meter.id)}
              onToggleStatus={actions.onToggleStatus}
              loading={loading}
            />
          ))}
        </div>
      )}

      {/* 仪表统计信息 */}
      {sortedMeters.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {sortedMeters.length}
              </div>
              <div className="text-sm text-gray-500">总仪表数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {sortedMeters.filter(m => m.isActive).length}
              </div>
              <div className="text-sm text-gray-500">启用中</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">
                {sortedMeters.filter(m => !m.isActive).length}
              </div>
              <div className="text-sm text-gray-500">已禁用</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(sortedMeters.map(m => m.meterType)).size}
              </div>
              <div className="text-sm text-gray-500">仪表类型</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}