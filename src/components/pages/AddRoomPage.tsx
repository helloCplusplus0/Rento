'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { BuildingSelector } from '@/components/business/BuildingSelector'
import { RoomBatchForm } from '@/components/business/RoomBatchForm'
import { RoomPreviewList } from '@/components/business/RoomPreviewList'
import type { Building } from '@prisma/client'

interface AddRoomPageProps {
  initialBuildings: (Building & { totalRooms: number })[]
}

interface RoomData {
  roomNumber: string
  floorNumber: number
  roomType: 'SHARED' | 'WHOLE' | 'SINGLE'
  area?: number
  rent: number
}

/**
 * 添加房间页面组件
 * 支持楼栋选择、新建楼栋和房间批量添加
 */
export function AddRoomPage({ initialBuildings }: AddRoomPageProps) {
  const router = useRouter()
  const [buildings, setBuildings] = useState(initialBuildings)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [generatedRooms, setGeneratedRooms] = useState<RoomData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 处理楼栋选择
  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building)
    setGeneratedRooms([]) // 清空之前生成的房间
  }

  // 处理新建楼栋
  const handleNewBuilding = (building: Building) => {
    setBuildings(prev => [...prev, { ...building, totalRooms: 0 }])
    setSelectedBuilding(building)
    setGeneratedRooms([])
  }

  // 处理房间生成
  const handleRoomsGenerate = (rooms: RoomData[]) => {
    setGeneratedRooms(rooms)
  }

  // 提交房间数据
  const handleSubmitRooms = async () => {
    if (!selectedBuilding || generatedRooms.length === 0) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/rooms/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: selectedBuilding.id,
          rooms: generatedRooms
        })
      })

      if (response.ok) {
        const result = await response.json()
        // 跳转到房间列表页面
        router.push('/rooms')
      } else {
        const error = await response.json()
        alert(`创建失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to create rooms:', error)
      alert('创建房间失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer title="添加房间" showBackButton>
      <div className="space-y-6 pb-6">
        {/* 楼栋选择 */}
        <BuildingSelector
          buildings={buildings}
          onBuildingSelect={handleBuildingSelect}
          onNewBuilding={handleNewBuilding}
        />

        {/* 房间批量添加表单 */}
        {selectedBuilding && (
          <RoomBatchForm
            building={selectedBuilding}
            onRoomsGenerate={handleRoomsGenerate}
          />
        )}

        {/* 房间预览列表 */}
        {generatedRooms.length > 0 && (
          <RoomPreviewList
            rooms={generatedRooms}
            building={selectedBuilding!}
            onSubmit={handleSubmitRooms}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </PageContainer>
  )
}