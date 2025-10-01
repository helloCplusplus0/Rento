'use client'

import type { Building } from '@prisma/client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>房间预览</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              将为 {building.name} 创建 {rooms.length} 间房间
            </p>
          </div>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || rooms.length === 0}
            className="min-w-[100px]"
          >
            {isSubmitting ? '创建中...' : '确认创建'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {floors.map((floor) => (
          <div key={floor} className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{floor}楼</h4>
              <Badge variant="outline">{roomsByFloor[floor].length} 间房</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {roomsByFloor[floor].map((room) => (
                <div
                  key={room.roomNumber}
                  className="rounded-lg border bg-gray-50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {room.roomNumber}
                    </span>
                    <Badge
                      className={`text-xs ${getRoomTypeColor(room.roomType)}`}
                    >
                      {getRoomTypeText(room.roomType)}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    {room.area && <div>面积: {room.area}㎡</div>}
                    <div>租金: ¥{room.rent}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {rooms.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <p>暂无房间数据</p>
            <p className="mt-1 text-sm">请先配置并生成房间列表</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
