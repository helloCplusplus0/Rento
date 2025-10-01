'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building, Search, X } from 'lucide-react'

import type { RoomWithBuildingForClient } from '@/types/database'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoomGrid, RoomStatusFilter } from '@/components/business/room-grid'
import { PageContainer } from '@/components/layout'

interface RoomListPageProps {
  initialRooms: RoomWithBuildingForClient[]
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
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10 pl-10"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 transform p-0"
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
    <div className={cn('flex flex-wrap gap-2', className)}>
      {buildingOptions.map((option) => {
        const isSelected = selectedBuilding === option.key

        return (
          <button
            key={option.key || 'all'}
            onClick={() => onBuildingChange(option.key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              'flex items-center gap-1 border border-gray-200 hover:border-gray-300',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-gray-50'
            )}
          >
            <Building className="h-3 w-3" />
            {option.label}
            {option.count > 0 && (
              <span className="ml-1 text-xs opacity-75">({option.count})</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * 房间列表页面组件
 * 实现楼栋-楼层-房间层级展示，支持状态筛选和搜索
 */
export function RoomListPage({ initialRooms }: RoomListPageProps) {
  const router = useRouter()
  // 状态管理
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
        const query = searchQuery.toLowerCase()
        return (
          room.roomNumber.toLowerCase().includes(query) ||
          room.building.name.toLowerCase().includes(query) ||
          room.currentRenter?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [initialRooms, selectedStatus, selectedBuilding, searchQuery])

  // 统计数据 - 基于筛选结果计算状态统计
  const statusCounts = useMemo(() => {
    return filteredRooms.reduce(
      (acc, room) => {
        acc[room.status] = (acc[room.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }, [filteredRooms])

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
          const query = searchQuery.toLowerCase()
          return (
            room.roomNumber.toLowerCase().includes(query) ||
            room.building.name.toLowerCase().includes(query) ||
            room.currentRenter?.toLowerCase().includes(query)
          )
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

  // 房间点击处理 - 使用 Next.js 路由优化性能
  const handleRoomClick = (room: RoomWithBuildingForClient) => {
    // 使用 Next.js 路由进行客户端导航，比 window.location.href 更快
    router.push(`/rooms/${room.id}`)
  }

  return (
    <PageContainer title="房源管理" showBackButton>
      <div className="space-y-6 pb-6">
        {/* 搜索栏 */}
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <RoomSearchBar
            placeholder="搜索房间号、楼栋或租客姓名"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {/* 状态筛选 */}
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              按房间状态筛选
            </h3>
            <RoomStatusFilter
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              statusCounts={statusCounts}
            />
          </div>
        </div>

        {/* 楼栋筛选 */}
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">按楼栋筛选</h3>
            <BuildingFilter
              selectedBuilding={selectedBuilding}
              onBuildingChange={setSelectedBuilding}
              buildingCounts={buildingCounts}
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>共 {initialRooms.length} 套房间</span>
            <span>当前显示 {filteredRooms.length} 套</span>
          </div>
        </div>

        {/* 房间网格 */}
        <div className="rounded-lg border border-gray-100 bg-white shadow-sm">
          <RoomGrid
            rooms={filteredRooms}
            onRoomClick={handleRoomClick}
            className="p-4"
          />
        </div>
      </div>
    </PageContainer>
  )
}
