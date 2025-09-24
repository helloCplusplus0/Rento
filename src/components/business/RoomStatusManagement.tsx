import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoomStatusBadge } from '@/components/ui/status-badge'
import type { RoomWithBuildingForClient } from '@/types/database'
import type { RoomStatus } from '@prisma/client'

interface RoomStatusManagementProps {
  room: RoomWithBuildingForClient
  onStatusChange: (status: RoomStatus) => void
  isLoading?: boolean
}

/**
 * 房间状态管理组件
 * 提供房间状态的查看和切换功能
 */
export function RoomStatusManagement({ room, onStatusChange, isLoading }: RoomStatusManagementProps) {
  const statusOptions: { value: RoomStatus; label: string; description: string; color: string }[] = [
    {
      value: 'VACANT',
      label: '空房可租',
      description: '房间空置，可以出租',
      color: 'bg-green-100 text-green-800 hover:bg-green-200'
    },
    {
      value: 'OCCUPIED',
      label: '在租中',
      description: '房间已出租，有租客居住',
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    },
    {
      value: 'OVERDUE',
      label: '逾期',
      description: '租金逾期未缴纳',
      color: 'bg-red-100 text-red-800 hover:bg-red-200'
    },
    {
      value: 'MAINTENANCE',
      label: '维护中',
      description: '房间正在维护，暂不可租',
      color: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  ]

  const currentStatus = statusOptions.find(option => option.value === room.status)

  return (
    <Card>
      <CardHeader>
        <CardTitle>状态管理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前状态 */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">当前状态</label>
          <div className="flex items-center gap-3">
            <RoomStatusBadge status={room.status} />
            <div>
              <p className="font-medium">{currentStatus?.label}</p>
              <p className="text-sm text-muted-foreground">{currentStatus?.description}</p>
            </div>
          </div>
        </div>
        
        {/* 状态切换 */}
        <div>
          <label className="text-sm text-muted-foreground mb-3 block">切换状态</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={room.status === option.value ? "default" : "outline"}
                size="sm"
                className={`h-auto p-3 flex flex-col items-center gap-1 ${
                  room.status === option.value ? '' : option.color
                }`}
                onClick={() => onStatusChange(option.value)}
                disabled={isLoading || room.status === option.value}
              >
                <RoomStatusBadge status={option.value} />
                <span className="text-xs font-medium">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* 状态说明 */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">状态说明</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>空房可租</strong>: 房间空置，可以安排新租客入住</p>
            <p><strong>在租中</strong>: 房间已出租，有租客正常居住</p>
            <p><strong>逾期</strong>: 租客租金逾期未缴纳，需要催收</p>
            <p><strong>维护中</strong>: 房间正在维修或保养，暂时不可出租</p>
          </div>
        </div>
        
        {/* 操作提示 */}
        {isLoading && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">正在更新状态...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}