'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building, Search, X } from 'lucide-react'

import type { RoomWithBuildingForClient } from '@/types/database'
import { cn } from '@/lib/utils'
import { roomListMobileStyles } from '@/components/business/room-list-mobile-styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoomGrid, RoomStatusFilter } from '@/components/business/room-grid'
import { PageContainer } from '@/components/layout'

interface RoomListPageProps {
  initialRooms: RoomWithBuildingForClient[]
  initialSearchQuery?: string
}

/**
 * 房间搜索栏组件
 */
interface RoomSearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

function RoomSearchBar({
  placeholder = '搜索房间号、楼栋或租客姓名',
  value,
  onChange,
  className,
}: RoomSearchBarProps) {
  return (
    <div className={cn(roomListMobileStyles.searchWrap, className)}>
      <div className="relative">
        <Search className={roomListMobileStyles.searchIcon} />
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={roomListMobileStyles.searchInput}
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 transform p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * 楼栋筛选组件
 */
interface BuildingFilterProps {
  selectedBuilding: string | null
  onBuildingChange: (buildingId: string | null) => void
  buildingCounts: Record<string, { name: string; count: number }>
  className?: string
}

function BuildingFilter({
  selectedBuilding,
  onBuildingChange,
  buildingCounts,
  className,
}: BuildingFilterProps) {
  const buildingOptions = [
    {
      key: null,
      label: '全部楼栋',
      count: Object.values(buildingCounts).reduce(
        (sum, building) => sum + building.count,
        0
      ),
    },
    ...Object.entries(buildingCounts).map(([id, building]) => ({
      key: id,
      label: building.name,
      count: building.count,
    })),
  ]

  return (
    <div className={cn(roomListMobileStyles.filterActions, className)}>
      {buildingOptions.map((option) => {
        const isSelected = selectedBuilding === option.key

        return (
          <Button
            key={option.key || 'all'}
            onClick={() => onBuildingChange(option.key)}
            className={cn(
              roomListMobileStyles.filterButton,
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50'
            )}
          >
            <Building className="h-3 w-3" />
            {option.label}
            {option.count > 0 && (
              <Badge variant="secondary" className={roomListMobileStyles.filterCount}>
                {option.count}
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}

/**
 * 房间列表页面组件
 * 实现楼栋-楼层-房间层级展示，支持状态筛选和搜索
 */
export function RoomListPage({
  initialRooms,
  initialSearchQuery = '',
}: RoomListPageProps) {
  const router = useRouter()
  // 状态管理
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)

  useEffect(() => {
    setSearchQuery(initialSearchQuery)
  }, [initialSearchQuery])

  const matchRoomQuery = (room: RoomWithBuildingForClient, queryText: string) => {
    const query = queryText.toLowerCase()
    return (
      room.roomNumber.toLowerCase().includes(query) ||
      room.building.name.toLowerCase().includes(query) ||
      room.currentRenter?.toLowerCase().includes(query)
    )
  }

  // 数据过滤
  const filteredRooms = useMemo(() => {
    return initialRooms.filter((room) => {
      // 状态筛选
      if (selectedStatus && room.status !== selectedStatus) {
        return false
      }

      // 楼栋筛选
      if (selectedBuilding && room.building.id !== selectedBuilding) {
        return false
      }

      // 搜索筛选
      if (searchQuery) {
        return matchRoomQuery(room, searchQuery)
      }

      return true
    })
  }, [initialRooms, selectedStatus, selectedBuilding, searchQuery])

  // 统计数据 - 基于筛选结果计算状态统计
  const statusCounts = useMemo(() => {
    const roomsForStatusCounts = initialRooms.filter((room) => {
      if (selectedBuilding && room.building.id !== selectedBuilding) {
        return false
      }

      if (searchQuery) {
        return matchRoomQuery(room, searchQuery)
      }

      return true
    })

    return roomsForStatusCounts.reduce(
      (acc, room) => {
        acc[room.status] = (acc[room.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }, [initialRooms, searchQuery, selectedBuilding])

  // 楼栋统计数据 - 基于原始数据计算，不受筛选影响
  const buildingCounts = useMemo(() => {
    // 基于原始房间数据计算楼栋统计，确保所有楼栋始终可见
    const allBuildingCounts = initialRooms.reduce(
      (acc, room) => {
        const buildingId = room.building.id
        if (!acc[buildingId]) {
          acc[buildingId] = {
            name: room.building.name,
            count: 0,
          }
        }
        acc[buildingId].count += 1
        return acc
      },
      {} as Record<string, { name: string; count: number }>
    )

    // 如果有筛选条件（状态或搜索），则显示筛选后的房间数量
    if (selectedStatus || searchQuery) {
      const filteredByOtherConditions = initialRooms.filter((room) => {
        // 只应用状态和搜索筛选，不应用楼栋筛选
        if (selectedStatus && room.status !== selectedStatus) {
          return false
        }

        if (searchQuery) {
          return matchRoomQuery(room, searchQuery)
        }

        return true
      })

      // 重新计算各楼栋在其他筛选条件下的房间数量
      const filteredBuildingCounts = filteredByOtherConditions.reduce(
        (acc, room) => {
          const buildingId = room.building.id
          if (!acc[buildingId]) {
            acc[buildingId] = {
              name: room.building.name,
              count: 0,
            }
          }
          acc[buildingId].count += 1
          return acc
        },
        {} as Record<string, { name: string; count: number }>
      )

      // 合并结果：保留所有楼栋，但显示筛选后的数量
      Object.keys(allBuildingCounts).forEach((buildingId) => {
        if (filteredBuildingCounts[buildingId]) {
          allBuildingCounts[buildingId].count =
            filteredBuildingCounts[buildingId].count
        } else {
          allBuildingCounts[buildingId].count = 0
        }
      })
    }

    return allBuildingCounts
  }, [initialRooms, selectedStatus, searchQuery]) // 注意：不依赖 selectedBuilding

  const shouldShowBuildingFilter = useMemo(() => {
    return Object.keys(buildingCounts).length > 1 || !!selectedBuilding
  }, [buildingCounts, selectedBuilding])

  // 房间点击处理 - 使用 Next.js 路由优化性能
  const handleRoomClick = (room: RoomWithBuildingForClient) => {
    // 使用 Next.js 路由进行客户端导航，比 window.location.href 更快
    router.push(`/rooms/${room.id}`)
  }

  return (
    <PageContainer title="房源管理" showBackButton>
      <div className={roomListMobileStyles.pageSection}>
        {/* 搜索栏 */}
        <div className={roomListMobileStyles.toolbarCard}>
          <RoomSearchBar
            placeholder="搜索房间号、楼栋或租客姓名"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {/* 筛选面板 */}
        <div className={roomListMobileStyles.filterCard}>
          <div className={roomListMobileStyles.filterPanel}>
            <div className={roomListMobileStyles.filterSubsection}>
              <h3 className={roomListMobileStyles.filterHeader}>房态筛选</h3>
              <RoomStatusFilter
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                statusCounts={statusCounts}
              />
            </div>

            {shouldShowBuildingFilter && (
              <div className={roomListMobileStyles.filterSubsection}>
                <h3 className={roomListMobileStyles.filterHeader}>楼栋筛选</h3>
                <BuildingFilter
                  selectedBuilding={selectedBuilding}
                  onBuildingChange={setSelectedBuilding}
                  buildingCounts={buildingCounts}
                />
              </div>
            )}
          </div>
        </div>

        {/* 结果统计 */}
        {(searchQuery || selectedStatus || selectedBuilding) && (
          <div className={roomListMobileStyles.statsSummary}>
            找到 {filteredRooms.length} 套房间
            {searchQuery && ` (搜索: ${searchQuery})`}
            {selectedStatus &&
              ` (房态: ${
                {
                  VACANT: '空房',
                  OCCUPIED: '在租',
                  OVERDUE: '逾期',
                  MAINTENANCE: '维护',
                }[selectedStatus] || selectedStatus
              })`}
            {selectedBuilding &&
              ` (楼栋: ${buildingCounts[selectedBuilding]?.name || '已选楼栋'})`}
          </div>
        )}

        {/* 房间网格 */}
        <div className={roomListMobileStyles.toolbarCard}>
          <RoomGrid
            rooms={filteredRooms}
            onRoomClick={handleRoomClick}
            className="p-0"
          />
        </div>
      </div>
    </PageContainer>
  )
}
