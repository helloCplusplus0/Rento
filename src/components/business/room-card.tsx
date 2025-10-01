import type {
  RoomWithBuilding,
  RoomWithBuildingForClient,
} from '@/types/database'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoomStatusBadge } from '@/components/ui/status-badge'
import { TouchCard } from '@/components/ui/touch-button'

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
          <div className="text-muted-foreground text-sm">
            {room.building.name}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">租金</span>
            <span className="font-medium">
              {formatCurrency(Number(room.rent))}
            </span>
          </div>
          {room.area && (
            <div className="flex items-center justify-between">
              <span className="text-sm">面积</span>
              <span className="font-medium">{room.area}㎡</span>
            </div>
          )}
          {room.currentRenter && (
            <div className="flex items-center justify-between">
              <span className="text-sm">租客</span>
              <span className="max-w-[100px] truncate font-medium">
                {room.currentRenter}
              </span>
            </div>
          )}
          {room.overdueDays && room.overdueDays > 0 && (
            <div className="text-xs font-medium text-red-600">
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
export function CompactRoomCard({
  room,
  onClick,
  className,
}: RoomCardForClientProps) {
  // 获取租客信息（从currentRenter字段或合同中获取）
  const tenantName = room.currentRenter
  const overdueDays = room.overdueDays

  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardContent className="space-y-2 p-3">
          {/* 房间号和状态 */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{room.roomNumber}</span>
            <RoomStatusBadge status={room.status} />
          </div>

          {/* 租金信息 */}
          <div className="text-muted-foreground text-sm">
            {formatCurrency(room.rent)}
          </div>

          {/* 租客信息 */}
          {tenantName && (
            <div className="text-sm">
              <span className="text-muted-foreground">租客: </span>
              <span className="inline-block max-w-[80px] truncate font-medium">
                {tenantName}
              </span>
            </div>
          )}

          {/* 逾期信息 */}
          {overdueDays && overdueDays > 0 && (
            <div className="text-sm font-medium text-red-600">
              逾期 {overdueDays} 天
            </div>
          )}

          {/* 空房状态 */}
          {room.status === 'VACANT' && (
            <div className="text-sm font-medium text-green-600">空房可租</div>
          )}

          {/* 维护状态 */}
          {room.status === 'MAINTENANCE' && (
            <div className="text-sm font-medium text-gray-600">维护中</div>
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
              <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-12 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-14 animate-pulse rounded bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-12 animate-pulse rounded bg-gray-200" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  )
}
