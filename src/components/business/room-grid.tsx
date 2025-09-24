import { CompactRoomCard, RoomCardSkeleton } from './room-card'
import { cn } from '@/lib/utils'
import type { RoomWithBuildingForClient } from '@/types/database'

interface RoomGridProps {
  rooms: RoomWithBuildingForClient[]
  onRoomClick?: (room: RoomWithBuildingForClient) => void
  loading?: boolean
  className?: string
}

/**
 * 房间网格布局组件
 * 按楼层分组显示房间，支持响应式布局
 */
export function RoomGrid({ rooms, onRoomClick, loading, className }: RoomGridProps) {
  if (loading) {
    return <RoomGridSkeleton className={className} />
  }

  if (rooms.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-muted-foreground">
          暂无房间数据
        </div>
      </div>
    )
  }

  // 按楼层分组
  const roomsByFloor = rooms.reduce((acc, room) => {
    const floor = room.floorNumber
    if (!acc[floor]) {
      acc[floor] = []
    }
    acc[floor].push(room)
    return acc
  }, {} as Record<number, RoomWithBuildingForClient[]>)

  // 按楼层号排序（从高楼层到低楼层）
  const sortedFloors = Object.keys(roomsByFloor)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className={cn('space-y-6', className)}>
      {sortedFloors.map(floor => (
        <FloorSection
          key={floor}
          floor={floor}
          rooms={roomsByFloor[floor]}
          onRoomClick={onRoomClick}
        />
      ))}
    </div>
  )
}

/**
 * 楼层区域组件
 * 显示单个楼层的所有房间
 */
interface FloorSectionProps {
  floor: number
  rooms: RoomWithBuildingForClient[]
  onRoomClick?: (room: RoomWithBuildingForClient) => void
}

function FloorSection({ floor, rooms, onRoomClick }: FloorSectionProps) {
  // 按房间号排序
  const sortedRooms = rooms.sort((a, b) => 
    a.roomNumber.localeCompare(b.roomNumber, 'zh-CN', { numeric: true })
  )

  // 统计各状态房间数量
  const statusCounts = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-3">
      {/* 楼层标题和统计 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{floor}层</h3>
          <div className="text-sm text-muted-foreground">
            共{rooms.length}套
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {statusCounts.VACANT && (
            <span className="text-green-600">
              空房{statusCounts.VACANT}
            </span>
          )}
          {statusCounts.OCCUPIED && (
            <span className="text-blue-600">
              在租{statusCounts.OCCUPIED}
            </span>
          )}
          {statusCounts.OVERDUE && (
            <span className="text-red-600">
              逾期{statusCounts.OVERDUE}
            </span>
          )}
          {statusCounts.MAINTENANCE && (
            <span className="text-gray-600">
              维护{statusCounts.MAINTENANCE}
            </span>
          )}
        </div>
      </div>

      {/* 房间网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {sortedRooms.map(room => (
          <CompactRoomCard
            key={room.id}
            room={room}
            onClick={() => onRoomClick?.(room)}
            className="min-h-[100px]"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * 房间状态过滤器
 * 用于筛选不同状态的房间
 */
interface RoomStatusFilterProps {
  selectedStatus: string | null
  onStatusChange: (status: string | null) => void
  statusCounts: Record<string, number>
  className?: string
}

export function RoomStatusFilter({ 
  selectedStatus, 
  onStatusChange, 
  statusCounts,
  className 
}: RoomStatusFilterProps) {
  const statusOptions = [
    { key: null, label: '全部', color: 'text-gray-600' },
    { key: 'VACANT', label: '空房', color: 'text-green-600' },
    { key: 'OCCUPIED', label: '在租', color: 'text-blue-600' },
    { key: 'OVERDUE', label: '逾期', color: 'text-red-600' },
    { key: 'MAINTENANCE', label: '维护', color: 'text-gray-600' },
  ]

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {statusOptions.map(option => {
        const count = option.key ? statusCounts[option.key] || 0 : Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
        const isSelected = selectedStatus === option.key
        
        return (
          <button
            key={option.key || 'all'}
            onClick={() => onStatusChange(option.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              'border border-gray-200 hover:border-gray-300',
              isSelected 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-background hover:bg-gray-50',
              option.color
            )}
          >
            {option.label}
            {count > 0 && (
              <span className="ml-1 text-xs opacity-75">
                ({count})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * 房间网格骨架屏
 * 用于加载状态
 */
export function RoomGridSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {[1, 2, 3].map(floor => (
        <div key={floor} className="space-y-3">
          {/* 楼层标题骨架 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 bg-gray-200 rounded w-12 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
            </div>
          </div>
          
          {/* 房间网格骨架 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RoomCardSkeleton key={i} compact />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}