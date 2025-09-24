import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoomStatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/format'
import type { RoomWithBuildingForClient } from '@/types/database'

interface RoomBasicInfoProps {
  room: RoomWithBuildingForClient
}

/**
 * 房间基本信息组件
 * 显示房间的基本信息，包括房号、楼栋、面积等（不包含租金，租金由合同确定）
 */
export function RoomBasicInfo({ room }: RoomBasicInfoProps) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>基本信息</CardTitle>
          <RoomStatusBadge status={room.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 移动端优化：使用2列网格布局，减少空白 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <label className="text-sm text-muted-foreground">房间号</label>
            <p className="font-medium text-lg">{room.roomNumber}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">楼栋</label>
            <p className="font-medium">{room.building.name}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">楼层</label>
            <p className="font-medium">{room.floorNumber}层</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">房间类型</label>
            <p className="font-medium">{getRoomTypeText(room.roomType)}</p>
          </div>
          {room.area && (
            <div className="col-span-1">
              <label className="text-sm text-muted-foreground">面积</label>
              <p className="font-medium">{room.area}㎡</p>
            </div>
          )}
        </div>
        
        {/* 楼栋地址信息 */}
        {room.building.address && (
          <div className="pt-4 border-t">
            <label className="text-sm text-muted-foreground">楼栋地址</label>
            <p className="font-medium">{room.building.address}</p>
          </div>
        )}
        
        {/* 当前租客信息 */}
        {room.currentRenter && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-muted-foreground">当前租客</label>
                <p className="font-medium">{room.currentRenter}</p>
              </div>
              {room.overdueDays && room.overdueDays > 0 && (
                <div className="text-right">
                  <label className="text-sm text-muted-foreground">逾期天数</label>
                  <p className="font-medium text-red-600">{room.overdueDays}天</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 时间信息 */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-muted-foreground">创建时间</label>
              <p>{formatDate(room.createdAt)}</p>
            </div>
            <div>
              <label className="text-muted-foreground">更新时间</label>
              <p>{formatDate(room.updatedAt)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}