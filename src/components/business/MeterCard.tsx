'use client'

import { useState } from 'react'
import {
  Calendar,
  Droplets,
  Edit,
  Flame,
  Gauge,
  MapPin,
  Trash2,
  Zap,
} from 'lucide-react'

import type { MeterWithReadingsForClient } from '@/types/meter'
import { formatDate } from '@/lib/format'
import { formatMeterReading, formatMeterType } from '@/lib/meter-utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

interface MeterCardProps {
  meter: MeterWithReadingsForClient
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: (meterId: string, newStatus: boolean) => void
  loading?: boolean
}

/**
 * 仪表卡片组件
 * 显示单个仪表的详细信息和操作按钮
 */
export function MeterCard({
  meter,
  onEdit,
  onDelete,
  onToggleStatus,
  loading = false,
}: MeterCardProps) {
  const [isToggling, setIsToggling] = useState(false)

  // 获取仪表类型图标
  const getMeterIcon = (meterType: string) => {
    switch (meterType) {
      case 'ELECTRICITY':
        return <Zap className="h-4 w-4 text-yellow-500" />
      case 'COLD_WATER':
        return <Droplets className="h-4 w-4 text-blue-500" />
      case 'HOT_WATER':
        return <Droplets className="h-4 w-4 text-red-500" />
      case 'GAS':
        return <Flame className="h-4 w-4 text-orange-500" />
      default:
        return <Gauge className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取最新读数
  const latestReading = meter.readings[0]

  // 处理状态切换 - 直接接收Switch传递的新状态
  const handleToggleStatus = async (newStatus: boolean) => {
    setIsToggling(true)
    try {
      await onToggleStatus(meter.id, newStatus)
    } finally {
      setIsToggling(false)
    }
  }

  // 处理删除操作
  const handleDelete = () => {
    onDelete()
  }

  return (
    <Card
      className={`transition-all duration-200 ${
        meter.isActive
          ? 'border-green-200 bg-white'
          : 'border-gray-200 bg-gray-50 opacity-75'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getMeterIcon(meter.meterType)}
            <h3 className="font-medium text-gray-900">{meter.displayName}</h3>
          </div>
          {/* 简化状态显示 - 只保留Switch，移除重复的Badge和span */}
          <Switch
            checked={meter.isActive}
            onCheckedChange={handleToggleStatus}
            disabled={loading || isToggling}
          />
        </div>

        <div className="text-sm text-gray-500">
          {formatMeterType(meter.meterType)} · {meter.meterNumber}
          {/* 状态指示移到这里，更简洁 */}
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
              meter.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {meter.isActive ? '启用' : '禁用'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 基本信息 */}
        <div className="space-y-2">
          {meter.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-3 w-3" />
              <span>{meter.location}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">单价</span>
            <span className="font-medium">
              {meter.unitPrice.toFixed(2)} 元/{meter.unit}
            </span>
          </div>

          {latestReading && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">最新读数</span>
              <span className="font-medium">
                {formatMeterReading(latestReading.currentReading, meter.unit)}
              </span>
            </div>
          )}

          {meter.installDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>安装于 {formatDate(meter.installDate)}</span>
            </div>
          )}
        </div>

        {/* 备注信息 */}
        {meter.remarks && (
          <div className="rounded bg-gray-50 p-2 text-sm text-gray-600">
            {meter.remarks}
          </div>
        )}

        {/* 操作按钮 - 简化布局 */}
        <div className="flex items-center gap-2 border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            disabled={loading}
            className="h-8 px-2"
          >
            <Edit className="mr-1 h-3 w-3" />
            编辑
          </Button>

          {/* 删除按钮 - 使用AlertDialog确认 */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                className="h-8 px-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                移除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>移除仪表关联</AlertDialogTitle>
                <AlertDialogDescription>
                  您确定要从房间中移除仪表 &quot;{meter.displayName}&quot; 吗？
                  <br />
                  <span className="font-medium text-blue-600">
                    此操作仅会取消仪表与房间的关联关系，不会删除仪表的历史数据和账单记录。
                  </span>
                  <br />
                  <span className="mt-2 block text-sm text-gray-600">
                    如需彻底删除仪表，请先确保没有相关的抄表记录和账单数据。
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
                >
                  确认移除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
