'use client'

import type { Building } from '@/types/database'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addRoomMobileStyles } from '@/components/pages/add-room-mobile-styles'

interface RoomData {
  roomNumber: string
  floorNumber: number
  roomType: 'SHARED' | 'WHOLE' | 'SINGLE'
  area?: number
  rent: number
}

interface RoomPreviewListProps {
  rooms: RoomData[]
  building: Building
  onSubmit: () => void
  isSubmitting: boolean
}

/**
 * 房间预览列表组件
 * 显示即将创建的房间列表，支持提交创建
 */
export function RoomPreviewList({
  rooms,
  building,
  onSubmit,
  isSubmitting,
}: RoomPreviewListProps) {
  const getRoomTypeText = (type: string) => {
    switch (type) {
      case 'SHARED':
        return '合租'
      case 'WHOLE':
        return '整租'
      case 'SINGLE':
        return '单间'
      default:
        return type
    }
  }

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'SHARED':
        return 'bg-blue-100 text-blue-800'
      case 'WHOLE':
        return 'bg-green-100 text-green-800'
      case 'SINGLE':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 按楼层分组
  const roomsByFloor = rooms.reduce(
    (acc, room) => {
      if (!acc[room.floorNumber]) {
        acc[room.floorNumber] = []
      }
      acc[room.floorNumber].push(room)
      return acc
    },
    {} as Record<number, RoomData[]>
  )

  const floors = Object.keys(roomsByFloor)
    .map(Number)
    .sort((a, b) => b - a) // 从高楼层到低楼层

  return (
    <Card className={addRoomMobileStyles.card}>
      <CardHeader className={addRoomMobileStyles.cardHeader}>
        <div className={addRoomMobileStyles.previewHeaderRow}>
          <div>
            <CardTitle className={addRoomMobileStyles.cardTitle}>房间预览</CardTitle>
            <p className={addRoomMobileStyles.cardDescription}>
              将为 {building.name} 创建 {rooms.length} 间房间
            </p>
          </div>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || rooms.length === 0}
            className={`${addRoomMobileStyles.previewButton} ${addRoomMobileStyles.previewHeaderActions}`}
          >
            {isSubmitting ? '创建中...' : '确认创建'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={addRoomMobileStyles.cardContent}>
        {floors.map((floor) => (
          <div key={floor} className={addRoomMobileStyles.previewFloorSection}>
            <div className={addRoomMobileStyles.previewFloorHeader}>
              <h4 className={addRoomMobileStyles.previewFloorTitle}>{floor}楼</h4>
              <Badge
                variant="outline"
                className={addRoomMobileStyles.previewFloorBadge}
              >
                {roomsByFloor[floor].length} 间房
              </Badge>
            </div>

            <div className={addRoomMobileStyles.previewGrid}>
              {roomsByFloor[floor].map((room) => (
                <div
                  key={room.roomNumber}
                  className={addRoomMobileStyles.previewItem}
                >
                  <div className={addRoomMobileStyles.previewItemHeader}>
                    <span className={addRoomMobileStyles.previewItemTitle}>
                      {room.roomNumber}
                    </span>
                    <Badge
                      className={`${addRoomMobileStyles.previewItemBadge} ${getRoomTypeColor(room.roomType)}`}
                    >
                      {getRoomTypeText(room.roomType)}
                    </Badge>
                  </div>

                  <div className={addRoomMobileStyles.previewItemMeta}>
                    {room.area && <div>面积: {room.area}㎡</div>}
                    <div>租金: ¥{room.rent}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {rooms.length === 0 && (
          <div className={addRoomMobileStyles.previewEmpty}>
            <p className={addRoomMobileStyles.previewEmptyText}>暂无房间数据</p>
            <p className={addRoomMobileStyles.previewEmptySubtle}>
              请先配置并生成房间列表
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
