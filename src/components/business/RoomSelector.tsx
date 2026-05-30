'use client'

import { useMemo, useState } from 'react'
import { Check, Home, Search } from 'lucide-react'

import type { RoomWithBuildingForClient } from '@/types/database'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { contractCreateMobileStyles } from '@/components/business/contract-create-mobile-styles'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
  disabled = false,
}: RoomSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    isInteractable: boolean,
    action: () => void
  ) => {
    if (disabled || !isInteractable) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

  // 筛选房间
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms

    const query = searchQuery.toLowerCase()
    return rooms.filter(
      (room) =>
        room.roomNumber.toLowerCase().includes(query) ||
        room.building.name.toLowerCase().includes(query) ||
        room.building.address?.toLowerCase().includes(query)
    )
  }, [rooms, searchQuery])

  // 按楼栋分组
  const groupedRooms = useMemo(() => {
    const groups: { [key: string]: RoomWithBuildingForClient[] } = {}

    filteredRooms.forEach((room) => {
      const buildingKey = `${room.building.name} (${room.building.address || ''})`
      if (!groups[buildingKey]) {
        groups[buildingKey] = []
      }
      groups[buildingKey].push(room)
    })

    // 按房间号排序
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
    })

    return groups
  }, [filteredRooms])

  const getRoomTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      SHARED: '合租',
      WHOLE: '整租',
      SINGLE: '单间',
    }
    return labels[type] || type
  }

  const getRoomStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      VACANT: 'bg-green-100 text-green-800',
      OCCUPIED: 'bg-blue-100 text-blue-800',
      OVERDUE: 'bg-red-100 text-red-800',
      MAINTENANCE: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getRoomStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      VACANT: '空闲',
      OCCUPIED: '在租',
      OVERDUE: '逾期',
      MAINTENANCE: '维护',
    }
    return labels[status] || status
  }

  return (
    <div className={contractCreateMobileStyles.selectorStack}>
      {/* 搜索框 */}
      <div className={contractCreateMobileStyles.searchWrap}>
        <Search className={contractCreateMobileStyles.searchIcon} />
        <Input
          placeholder="搜索房间号、楼栋名称或地址..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={contractCreateMobileStyles.searchInput}
          disabled={disabled}
        />
      </div>

      {/* 已选择的房间 */}
      {selectedRoom && (
        <Card className={contractCreateMobileStyles.selectedCard}>
          <CardContent className={contractCreateMobileStyles.selectedCardContent}>
            <div className={contractCreateMobileStyles.selectedRow}>
              <div className={contractCreateMobileStyles.selectedLeading}>
                <div
                  className={cn(
                    contractCreateMobileStyles.avatarBox,
                    contractCreateMobileStyles.avatarBoxSelected
                  )}
                >
                  <Home
                    className={cn(
                      contractCreateMobileStyles.avatarIcon,
                      contractCreateMobileStyles.avatarIconSelected
                    )}
                  />
                </div>
                <div>
                  <div className={contractCreateMobileStyles.selectedTitle}>
                    {selectedRoom.building.name} - {selectedRoom.roomNumber}
                  </div>
                  <div className={contractCreateMobileStyles.selectedMeta}>
                    {formatCurrency(selectedRoom.rent)}/月 ·{' '}
                    {getRoomTypeLabel(selectedRoom.roomType)}
                    {selectedRoom.area && ` · ${selectedRoom.area}㎡`}
                  </div>
                  <Badge
                    className={cn(
                      'mt-1 text-[11px]',
                      getRoomStatusColor(selectedRoom.status)
                    )}
                  >
                    {getRoomStatusLabel(selectedRoom.status)}
                  </Badge>
                  <div className={contractCreateMobileStyles.selectedSubtle}>
                    {selectedRoom.floorNumber}楼
                  </div>
                </div>
              </div>
              <Check className={contractCreateMobileStyles.selectedCheck} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 房间列表 */}
      <div className={contractCreateMobileStyles.listWrap}>
        {Object.keys(groupedRooms).length === 0 ? (
          <div className={contractCreateMobileStyles.emptyState}>
            {searchQuery ? '未找到匹配的房间' : '暂无可用房间'}
          </div>
        ) : (
          Object.entries(groupedRooms).map(([buildingName, buildingRooms]) => (
            <div
              key={buildingName}
              className={contractCreateMobileStyles.listGroup}
            >
              <h4 className={contractCreateMobileStyles.listGroupTitle}>
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
                        'cursor-pointer hover:border-gray-300',
                        contractCreateMobileStyles.optionCard,
                        isSelected && contractCreateMobileStyles.optionCardSelected,
                        !isAvailable && 'opacity-60',
                        disabled && 'cursor-not-allowed opacity-50'
                      )}
                      onClick={() =>
                        !disabled && isAvailable && onRoomSelect(room)
                      }
                      onKeyDown={(event) =>
                        handleCardKeyDown(event, isAvailable, () =>
                          onRoomSelect(room)
                        )
                      }
                      role="button"
                      tabIndex={!disabled && isAvailable ? 0 : -1}
                      aria-pressed={isSelected}
                      aria-disabled={disabled || !isAvailable}
                    >
                      <CardContent className={contractCreateMobileStyles.optionCardContent}>
                        <div className={contractCreateMobileStyles.optionRow}>
                          <div className={contractCreateMobileStyles.optionLeading}>
                            <div
                              className={cn(
                                contractCreateMobileStyles.avatarBox,
                                isSelected
                                  ? contractCreateMobileStyles.avatarBoxSelected
                                  : undefined
                              )}
                            >
                              <Home
                                className={cn(
                                  contractCreateMobileStyles.avatarIcon,
                                  isSelected
                                    ? contractCreateMobileStyles.avatarIconSelected
                                    : undefined
                                )}
                              />
                            </div>
                            <div className="flex-1">
                              <div className={contractCreateMobileStyles.optionTitle}>
                                房间 {room.roomNumber}
                                {!isAvailable && (
                                  <span
                                    className={
                                      contractCreateMobileStyles.optionDisabledText
                                    }
                                  >
                                    (不可用)
                                  </span>
                                )}
                              </div>
                              <div className={contractCreateMobileStyles.optionMeta}>
                                {formatCurrency(room.rent)}/月 ·{' '}
                                {getRoomTypeLabel(room.roomType)}
                                {room.area && ` · ${room.area}㎡`}
                              </div>
                              <div
                                className={contractCreateMobileStyles.optionBadgeRow}
                              >
                                <Badge
                                  className={cn(
                                    'px-2 py-0.5 text-[11px]',
                                    getRoomStatusColor(room.status)
                                  )}
                                >
                                  {getRoomStatusLabel(room.status)}
                                </Badge>
                                <span
                                  className={
                                    contractCreateMobileStyles.optionFloorText
                                  }
                                >
                                  {room.floorNumber}楼
                                </span>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check
                              className={contractCreateMobileStyles.optionCheck}
                            />
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
        <div className={contractCreateMobileStyles.resultText}>
          共找到 {filteredRooms.length} 个房间
          {filteredRooms.filter((r) => r.status === 'VACANT').length > 0 && (
            <span className="ml-2">
              ({filteredRooms.filter((r) => r.status === 'VACANT').length}{' '}
              个可用)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
