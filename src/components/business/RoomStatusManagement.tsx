import { cn } from '@/lib/utils'

import type { RoomStatus, RoomWithBuildingForClient } from '@/types/database'
import { roomDetailMobileStyles } from '@/components/business/room-detail-mobile-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoomStatusBadge } from '@/components/ui/status-badge'

interface RoomStatusManagementProps {
  room: RoomWithBuildingForClient
  onStatusChange: (status: RoomStatus) => void
  isLoading?: boolean
}

/**
 * 房间状态管理组件
 * 提供房间状态的查看和切换功能
 */
export function RoomStatusManagement({
  room,
  onStatusChange,
  isLoading,
}: RoomStatusManagementProps) {
  const statusOptions: {
    value: RoomStatus
    label: string
    description: string
    color: string
  }[] = [
    {
      value: 'VACANT',
      label: '空房可租',
      description: '房间空置，可以出租',
      color: 'bg-green-100 text-green-800 hover:bg-green-200',
    },
    {
      value: 'OCCUPIED',
      label: '在租中',
      description: '房间已出租，有租客居住',
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    },
    {
      value: 'OVERDUE',
      label: '逾期',
      description: '租金逾期未缴纳',
      color: 'bg-red-100 text-red-800 hover:bg-red-200',
    },
    {
      value: 'MAINTENANCE',
      label: '维护中',
      description: '房间正在维护，暂不可租',
      color: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    },
  ]

  const currentStatus = statusOptions.find(
    (option) => option.value === room.status
  )

  return (
    <Card className={roomDetailMobileStyles.card}>
      <CardHeader className={roomDetailMobileStyles.cardHeader}>
        <CardTitle className={roomDetailMobileStyles.cardTitle}>状态管理</CardTitle>
      </CardHeader>
      <CardContent className={roomDetailMobileStyles.cardContent}>
        <div>
          <label className={`${roomDetailMobileStyles.fieldLabel} mb-2 block`}>
            当前状态
          </label>
          <div className={roomDetailMobileStyles.currentStatusRow}>
            <RoomStatusBadge status={room.status} />
            <div className={roomDetailMobileStyles.currentStatusMeta}>
              <p className={roomDetailMobileStyles.currentStatusTitle}>
                {currentStatus?.label}
              </p>
              <p className={roomDetailMobileStyles.currentStatusText}>
                {currentStatus?.description}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className={`${roomDetailMobileStyles.fieldLabel} mb-2.5 block`}>
            切换状态
          </label>
          <div className={roomDetailMobileStyles.statusOptionsGrid}>
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={room.status === option.value ? 'default' : 'outline'}
                className={cn(
                  roomDetailMobileStyles.statusOptionButton,
                  room.status === option.value ? '' : option.color
                )}
                onClick={() => onStatusChange(option.value)}
                disabled={isLoading || room.status === option.value}
              >
                <RoomStatusBadge status={option.value} />
                <span className={roomDetailMobileStyles.statusOptionText}>
                  {option.label}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className={roomDetailMobileStyles.sectionBlock}>
          <h4 className={roomDetailMobileStyles.sectionTitle}>状态说明</h4>
          <div className={roomDetailMobileStyles.explanationList}>
            <p>
              <strong>空房可租</strong>: 房间空置，可以安排新租客入住
            </p>
            <p>
              <strong>在租中</strong>: 房间已出租，有租客正常居住
            </p>
            <p>
              <strong>逾期</strong>: 租客租金逾期未缴纳，需要催收
            </p>
            <p>
              <strong>维护中</strong>: 房间正在维修或保养，暂时不可出租
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="py-1 text-center">
            <p className={roomDetailMobileStyles.hintText}>正在更新状态...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
