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
import { cn } from '@/lib/utils'
import { formatMeterReading } from '@/lib/meter-utils'
import { roomDetailMobileStyles } from '@/components/business/room-detail-mobile-styles'
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
      className={cn(
        roomDetailMobileStyles.meterCard,
        'transition-all duration-200',
        meter.isActive
          ? 'border-green-200 bg-white'
          : 'border-gray-200 bg-gray-50 opacity-75'
      )}
    >
      <CardHeader className={roomDetailMobileStyles.meterCardHeader}>
        <div className={roomDetailMobileStyles.meterCardHeaderRow}>
          <div className={roomDetailMobileStyles.meterCardTitleRow}>
            {getMeterIcon(meter.meterType)}
            <h3 className={roomDetailMobileStyles.meterCardName}>{meter.displayName}</h3>
          </div>
          <Switch
            checked={meter.isActive}
            onCheckedChange={handleToggleStatus}
            disabled={loading || isToggling}
          />
        </div>

        <div className={roomDetailMobileStyles.meterCardMeta}>
          {meter.meterNumber}
          <span
            className={cn(
              roomDetailMobileStyles.meterStatePill,
              meter.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            )}
          >
            {meter.isActive ? '启用' : '禁用'}
          </span>
        </div>
      </CardHeader>

      <CardContent className={roomDetailMobileStyles.meterCardContent}>
        <div className={roomDetailMobileStyles.meterInfoStack}>
          {meter.location && (
            <div className={roomDetailMobileStyles.meterMetaRow}>
              <MapPin className="h-3 w-3" />
              <span>{meter.location}</span>
            </div>
          )}

          <div className={roomDetailMobileStyles.meterInfoRow}>
            <span className={roomDetailMobileStyles.meterInfoLabel}>单价</span>
            <span className={roomDetailMobileStyles.meterInfoValue}>
              {meter.unitPrice.toFixed(2)} 元/{meter.unit}
            </span>
          </div>

          {latestReading && (
            <div className={roomDetailMobileStyles.meterInfoRow}>
              <span className={roomDetailMobileStyles.meterInfoLabel}>最新读数</span>
              <span className={roomDetailMobileStyles.meterInfoValue}>
                {formatMeterReading(latestReading.currentReading, meter.unit)}
              </span>
            </div>
          )}

          {meter.installDate && (
            <div className={roomDetailMobileStyles.meterMetaRow}>
              <Calendar className="h-3 w-3" />
              <span>安装于 {formatDate(meter.installDate)}</span>
            </div>
          )}
        </div>

        {meter.remarks && (
          <div className={roomDetailMobileStyles.meterRemark}>{meter.remarks}</div>
        )}

        <div className={roomDetailMobileStyles.meterActions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            disabled={loading}
            className={roomDetailMobileStyles.meterActionButton}
          >
            <Edit className="mr-1 h-3 w-3" />
            编辑
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                className={cn(
                  roomDetailMobileStyles.meterActionButton,
                  roomDetailMobileStyles.meterActionDanger
                )}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                移除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>停用或删除仪表</AlertDialogTitle>
                <AlertDialogDescription>
                  您确定要处理仪表 &quot;{meter.displayName}&quot; 吗？
                  <br />
                  <span className="font-medium text-blue-600">
                    系统会先检查该仪表是否已有抄表或计费历史:
                    有历史则停用并保留历史，无历史才会执行硬删除。
                  </span>
                  <br />
                  <span className="mt-2 block text-sm text-gray-600">
                    如需换表，请保留旧表为停用状态后再新增新表；
                    当前不提供结构化解绑。
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
                >
                  确认继续
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
