import type { RoomWithBuildingForClient } from '@/types/database'
import { formatDate } from '@/lib/format'
import { roomDetailMobileStyles } from '@/components/business/room-detail-mobile-styles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoomStatusBadge } from '@/components/ui/status-badge'

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
    <Card className={roomDetailMobileStyles.card}>
      <CardHeader className={roomDetailMobileStyles.cardHeader}>
        <div className={roomDetailMobileStyles.cardHeaderRow}>
          <CardTitle className={roomDetailMobileStyles.cardTitle}>基本信息</CardTitle>
          <RoomStatusBadge status={room.status} />
        </div>
      </CardHeader>
      <CardContent className={roomDetailMobileStyles.cardContent}>
        <div className={roomDetailMobileStyles.fieldsGrid}>
          <div className={roomDetailMobileStyles.fieldBlock}>
            <label className={roomDetailMobileStyles.fieldLabel}>房间号</label>
            <p className={roomDetailMobileStyles.fieldValueLarge}>{room.roomNumber}</p>
          </div>
          <div className={roomDetailMobileStyles.fieldBlock}>
            <label className={roomDetailMobileStyles.fieldLabel}>楼栋</label>
            <p className={roomDetailMobileStyles.fieldValueStrong}>{room.building.name}</p>
          </div>
          <div className={roomDetailMobileStyles.fieldBlock}>
            <label className={roomDetailMobileStyles.fieldLabel}>楼层</label>
            <p className={roomDetailMobileStyles.fieldValueStrong}>
              {room.floorNumber}层
            </p>
          </div>
          <div className={roomDetailMobileStyles.fieldBlock}>
            <label className={roomDetailMobileStyles.fieldLabel}>房间类型</label>
            <p className={roomDetailMobileStyles.fieldValueStrong}>
              {getRoomTypeText(room.roomType)}
            </p>
          </div>
          {room.area && (
            <div className={roomDetailMobileStyles.fieldBlock}>
              <label className={roomDetailMobileStyles.fieldLabel}>面积</label>
              <p className={roomDetailMobileStyles.fieldValueStrong}>{room.area}㎡</p>
            </div>
          )}
        </div>

        {room.building.address && (
          <div className={roomDetailMobileStyles.sectionBlock}>
            <div className={roomDetailMobileStyles.fieldBlock}>
              <label className={roomDetailMobileStyles.fieldLabel}>楼栋地址</label>
              <p className={roomDetailMobileStyles.fieldValueStrong}>
                {room.building.address}
              </p>
            </div>
          </div>
        )}

        {room.currentRenter && (
          <div className={roomDetailMobileStyles.sectionBlock}>
            <div className="flex items-center justify-between">
              <div className={roomDetailMobileStyles.fieldBlock}>
                <label className={roomDetailMobileStyles.fieldLabel}>当前租客</label>
                <p className={roomDetailMobileStyles.fieldValueStrong}>
                  {room.currentRenter}
                </p>
              </div>
              {room.overdueDays && room.overdueDays > 0 && (
                <div className="text-right">
                  <label className={roomDetailMobileStyles.fieldLabel}>逾期天数</label>
                  <p className="text-sm font-medium leading-5 text-red-600 sm:leading-6">
                    {room.overdueDays} 天
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={roomDetailMobileStyles.sectionBlock}>
          <div className={roomDetailMobileStyles.fieldsGrid}>
            <div className={roomDetailMobileStyles.fieldBlock}>
              <label className={roomDetailMobileStyles.fieldLabel}>创建时间</label>
              <p className={roomDetailMobileStyles.fieldValue}>
                {formatDate(room.createdAt)}
              </p>
            </div>
            <div className={roomDetailMobileStyles.fieldBlock}>
              <label className={roomDetailMobileStyles.fieldLabel}>更新时间</label>
              <p className={roomDetailMobileStyles.fieldValue}>
                {formatDate(room.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
