import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoomStatusBadge } from '@/components/ui/status-badge'
import { TouchCard } from '@/components/ui/touch-button'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RoomWithBuilding, RoomWithBuildingForClient } from '@/types/database'

interface RoomCardProps {
  room: RoomWithBuilding
  onClick?: () => void
  className?: string
}

interface RoomCardForClientProps {
  room: RoomWithBuildingForClient
  onClick?: () => void
  className?: string
}

/**
 * 房间卡片组件
 * 显示房间基本信息和状态
 */
export function RoomCard({ room, onClick, className }: RoomCardProps) {
  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {room.roomNumber}
            </CardTitle>
            <RoomStatusBadge status={room.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {room.building.name}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">租金</span>
            <span className="font-medium">{formatCurrency(Number(room.rent))}</span>
          </div>
          {room.area && (
            <div className="flex justify-between items-center">
              <span className="text-sm">面积</span>
              <span className="font-medium">{room.area}㎡</span>
            </div>
          )}
          {room.currentRenter && (
            <div className="flex justify-between items-center">
              <span className="text-sm">租客</span>
              <span className="font-medium truncate max-w-[100px]">
                {room.currentRenter}
              </span>
            </div>
          )}
          {room.overdueDays && room.overdueDays > 0 && (
            <div className="text-red-600 text-xs font-medium">
              逾期{room.overdueDays}天
            </div>
          )}
        </CardContent>
      </Card>
    </TouchCard>
  )
}

/**
 * 紧凑型房间卡片组件
 * 用于房间网格布局，显示核心信息包括租客姓名和逾期天数
 */
export function CompactRoomCard({ room, onClick, className }: RoomCardForClientProps) {
  // 获取租客信息（从currentRenter字段或合同中获取）
  const tenantName = room.currentRenter
  const overdueDays = room.overdueDays
  
  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardContent className="p-3 space-y-2">
          {/* 房间号和状态 */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">{room.roomNumber}</span>
            <RoomStatusBadge status={room.status} />
          </div>
          
          {/* 租金信息 */}
          <div className="text-sm text-muted-foreground">
            {formatCurrency(room.rent)}
          </div>
          
          {/* 租客信息 */}
          {tenantName && (
            <div className="text-sm">
              <span className="text-muted-foreground">租客: </span>
              <span className="font-medium truncate max-w-[80px] inline-block">
                {tenantName}
              </span>
            </div>
          )}
          
          {/* 逾期信息 */}
          {overdueDays && overdueDays > 0 && (
            <div className="text-sm text-red-600 font-medium">
              逾期 {overdueDays} 天
            </div>
          )}
          
          {/* 空房状态 */}
          {room.status === 'VACANT' && (
            <div className="text-sm text-green-600 font-medium">
              空房可租
            </div>
          )}
          
          {/* 维护状态 */}
          {room.status === 'MAINTENANCE' && (
            <div className="text-sm text-gray-600 font-medium">
              维护中
            </div>
          )}
        </CardContent>
      </Card>
    </TouchCard>
  )
}

/**
 * 房间卡片骨架屏
 * 用于加载状态
 */
export function RoomCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Card className="h-full">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-12 animate-pulse" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-14 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-12 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}