'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { RoomGrid, RoomStatusFilter } from '@/components/business/room-grid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RoomWithBuildingForClient } from '@/types/database'

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
  placeholder = "搜索房间号、楼栋或租客姓名", 
  value, 
  onChange,
  className 
}: RoomSearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
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
  const [searchQuery, setSearchQuery] = useState('')
  
  // 数据过滤
  const filteredRooms = useMemo(() => {
    return initialRooms.filter(room => {
      // 状态筛选
      if (selectedStatus && room.status !== selectedStatus) {
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
  }, [initialRooms, selectedStatus, searchQuery])
  
  // 统计数据
  const statusCounts = useMemo(() => {
    return initialRooms.reduce((acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [initialRooms])
  
  // 房间点击处理 - 使用 Next.js 路由优化性能
  const handleRoomClick = (room: RoomWithBuildingForClient) => {
    // 使用 Next.js 路由进行客户端导航，比 window.location.href 更快
    router.push(`/rooms/${room.id}`)
  }
  
  return (
    <PageContainer title="房源管理" showBackButton>
      <div className="space-y-6 pb-6">
        {/* 搜索栏 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <RoomSearchBar
            placeholder="搜索房间号、楼栋或租客姓名"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        
        {/* 状态筛选 */}
        <RoomStatusFilter
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          statusCounts={statusCounts}
        />
        
        {/* 统计信息 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>共 {initialRooms.length} 套房间</span>
            {filteredRooms.length !== initialRooms.length && (
              <span>筛选后 {filteredRooms.length} 套</span>
            )}
          </div>
        </div>
        
        {/* 房间网格 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
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