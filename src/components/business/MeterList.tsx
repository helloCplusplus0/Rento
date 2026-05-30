'use client'

import { Loader2, Plus } from 'lucide-react'

import type { MeterListProps } from '@/types/meter'
import { roomDetailMobileStyles } from '@/components/business/room-detail-mobile-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { MeterCard } from './MeterCard'

/**
 * 仪表列表组件
 * 显示房间的所有仪表，支持添加、编辑、删除操作
 */
export function MeterList({
  meters,
  loading = false,
  onAdd,
  actions,
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
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">加载仪表信息...</span>
      </div>
    )
  }

  const activeCount = sortedMeters.filter((m) => m.isActive).length
  const inactiveCount = sortedMeters.length - activeCount
  const meterTypeCount = new Set(sortedMeters.map((m) => m.meterType)).size

  return (
    <div className={roomDetailMobileStyles.meterSection}>
      <div className={roomDetailMobileStyles.meterHeaderRow}>
        <div className={roomDetailMobileStyles.meterHeadingGroup}>
          <h3 className={roomDetailMobileStyles.meterTitle}>仪表管理</h3>
          <p className={roomDetailMobileStyles.meterDescription}>
            管理房间的水电表配置，支持多种类型仪表
          </p>
        </div>
        <Button onClick={onAdd} className={roomDetailMobileStyles.meterAddButton}>
          <Plus className="h-4 w-4" />
          添加仪表
        </Button>
      </div>

      {sortedMeters.length > 0 && (
        <div className={roomDetailMobileStyles.meterStatsGrid}>
          {[
            {
              label: '总仪表数',
              value: sortedMeters.length,
              valueClassName: 'text-gray-900',
            },
            {
              label: '启用中',
              value: activeCount,
              valueClassName: 'text-green-600',
            },
            {
              label: '已禁用',
              value: inactiveCount,
              valueClassName: 'text-gray-400',
            },
            {
              label: '仪表类型',
              value: meterTypeCount,
              valueClassName: 'text-blue-600',
            },
          ].map((item) => (
            <Card key={item.label} className={roomDetailMobileStyles.meterStatsCard}>
              <CardContent className={roomDetailMobileStyles.meterStatsCardContent}>
                <div className={roomDetailMobileStyles.meterStatsInner}>
                  <div>
                    <div
                      className={`${roomDetailMobileStyles.meterStatsValue} ${item.valueClassName}`}
                    >
                      {item.value}
                    </div>
                    <div className={roomDetailMobileStyles.meterStatsLabel}>
                      {item.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className={roomDetailMobileStyles.meterNoticeBox}>
        <p className={roomDetailMobileStyles.meterNoticeTitle}>换表说明</p>
        <p className={roomDetailMobileStyles.meterNoticeText}>
          当前默认换表路径是先停用旧表并保留历史，再新增新表。点击“移除”时，系统会先检查该仪表是否已有抄表或计费历史：有历史则仅停用保留，无历史才会执行硬删除。
        </p>
      </div>

      {sortedMeters.length === 0 ? (
        <div className={roomDetailMobileStyles.meterEmptyState}>
          <div className={roomDetailMobileStyles.meterEmptyIconBox}>
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className={roomDetailMobileStyles.emptyTitle}>暂无仪表配置</h3>
          <p className={roomDetailMobileStyles.emptyText}>
            为这个房间添加水电表配置，开始管理用量和费用
          </p>
          <Button onClick={onAdd} className="mt-4 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加第一个仪表
          </Button>
        </div>
      ) : (
        <div className={roomDetailMobileStyles.meterGrid}>
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
    </div>
  )
}
