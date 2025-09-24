'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Check, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { RoomWithBuildingForClient } from '@/types/database'

interface RoomSelectorProps {
  rooms: RoomWithBuildingForClient[]
  selectedRoom?: RoomWithBuildingForClient | null
  onRoomSelect: (room: RoomWithBuildingForClient) => void
  disabled?: boolean
}

/**
 * 房间选择器组件
 * 支持搜索和选择可用房间
 */
export function RoomSelector({
  rooms,
  selectedRoom,
  onRoomSelect,
  disabled = false
}: RoomSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // 筛选房间
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms

    const query = searchQuery.toLowerCase()
    return rooms.filter(room =>
      room.roomNumber.toLowerCase().includes(query) ||
      room.building.name.toLowerCase().includes(query) ||
      room.building.address?.toLowerCase().includes(query)
    )
  }, [rooms, searchQuery])

  // 按楼栋分组
  const groupedRooms = useMemo(() => {
    const groups: { [key: string]: RoomWithBuildingForClient[] } = {}
    
    filteredRooms.forEach(room => {
      const buildingKey = `${room.building.name} (${room.building.address || ''})`
      if (!groups[buildingKey]) {
        groups[buildingKey] = []
      }
      groups[buildingKey].push(room)
    })

    // 按房间号排序
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
    })

    return groups
  }, [filteredRooms])

  const getRoomTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'SHARED': '合租',
      'WHOLE': '整租',
      'SINGLE': '单间'
    }
    return labels[type] || type
  }

  const getRoomStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'VACANT': 'bg-green-100 text-green-800',
      'OCCUPIED': 'bg-blue-100 text-blue-800',
      'OVERDUE': 'bg-red-100 text-red-800',
      'MAINTENANCE': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getRoomStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'VACANT': '空闲',
      'OCCUPIED': '在租',
      'OVERDUE': '逾期',
      'MAINTENANCE': '维护'
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="搜索房间号、楼栋名称或地址..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      {/* 已选择的房间 */}
      {selectedRoom && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedRoom.building.name} - {selectedRoom.roomNumber}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(selectedRoom.rent)}/月 · {getRoomTypeLabel(selectedRoom.roomType)}
                    {selectedRoom.area && ` · ${selectedRoom.area}㎡`}
                  </div>
                  <Badge className={cn('text-xs mt-1', getRoomStatusColor(selectedRoom.status))}>
                    {getRoomStatusLabel(selectedRoom.status)}
                  </Badge>
                </div>
              </div>
              <Check className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 房间列表 */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {Object.keys(groupedRooms).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? '未找到匹配的房间' : '暂无可用房间'}
          </div>
        ) : (
          Object.entries(groupedRooms).map(([buildingName, buildingRooms]) => (
            <div key={buildingName}>
              <h4 className="text-sm font-medium text-gray-700 mb-2 px-1">
                {buildingName}
              </h4>
              <div className="space-y-2">
                {buildingRooms.map((room) => {
                  const isSelected = selectedRoom?.id === room.id
                  const isAvailable = room.status === 'VACANT'
                  
                  return (
                    <Card
                      key={room.id}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-sm',
                        isSelected ? 'border-blue-200 bg-blue-50' : 'hover:border-gray-300',
                        !isAvailable && 'opacity-60',
                        disabled && 'cursor-not-allowed opacity-50'
                      )}
                      onClick={() => !disabled && isAvailable && onRoomSelect(room)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              isSelected ? 'bg-blue-100' : 'bg-gray-100'
                            )}>
                              <Home className={cn(
                                'w-5 h-5',
                                isSelected ? 'text-blue-600' : 'text-gray-600'
                              )} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                房间 {room.roomNumber}
                                {!isAvailable && (
                                  <span className="ml-2 text-sm text-gray-500">(不可用)</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatCurrency(room.rent)}/月 · {getRoomTypeLabel(room.roomType)}
                                {room.area && ` · ${room.area}㎡`}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={cn('text-xs', getRoomStatusColor(room.status))}>
                                  {getRoomStatusLabel(room.status)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {room.floorNumber}楼
                                </span>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 提示信息 */}
      {filteredRooms.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          共找到 {filteredRooms.length} 个房间
          {filteredRooms.filter(r => r.status === 'VACANT').length > 0 && (
            <span className="ml-2">
              ({filteredRooms.filter(r => r.status === 'VACANT').length} 个可用)
            </span>
          )}
        </div>
      )}
    </div>
  )
}