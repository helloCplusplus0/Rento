'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { RoomBasicInfo } from '@/components/business/RoomBasicInfo'
import { TenantContractInfo } from '@/components/business/TenantContractInfo'
import { RoomStatusManagement } from '@/components/business/RoomStatusManagement'
import { RoomActions } from '@/components/business/RoomActions'
import { RoomMeterManagement } from '@/components/business/RoomMeterManagement'
import type { RoomWithBuildingForClient } from '@/types/database'
import type { RoomStatus } from '@prisma/client'
import type { MeterWithReadingsForClient } from '@/types/meter'

interface RoomDetailPageProps {
  room: RoomWithBuildingForClient
}

/**
 * 房间详情页面组件
 * 显示房间的完整信息，包括基本信息、租客信息、合同信息、仪表管理等
 */
export function RoomDetailPage({ room }: RoomDetailPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [meters, setMeters] = useState<MeterWithReadingsForClient[]>([])
  const [metersLoading, setMetersLoading] = useState(true)
  
  // 加载房间仪表数据
  const loadMeters = async () => {
    setMetersLoading(true)
    try {
      const response = await fetch(`/api/rooms/${room.id}/meters`)
      if (response.ok) {
        const metersData = await response.json()
        // 修复：从API响应中提取data字段，确保meters是数组
        setMeters(metersData.data || [])
      } else {
        console.error('Failed to load meters')
        setMeters([]) // 失败时设置为空数组
      }
    } catch (error) {
      console.error('Failed to load meters:', error)
      setMeters([]) // 出错时设置为空数组
    } finally {
      setMetersLoading(false)
    }
  }

  // 页面加载时获取仪表数据
  useEffect(() => {
    loadMeters()
  }, [room.id])
  
  const handleStatusChange = async (status: RoomStatus) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/rooms/${room.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        // 乐观更新：立即更新本地状态
        room.status = status
        
        // 刷新页面数据以确保数据一致性
        router.refresh()
        
        // 可选：显示成功提示
        console.log(`房间状态已更新为: ${status}`)
      } else {
        console.error('Failed to update room status')
        // 可选：显示错误提示
      }
    } catch (error) {
      console.error('Failed to update room status:', error)
      // 可选：显示错误提示
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleEdit = () => {
    // TODO: 实现编辑功能，暂时跳转到编辑页面
    router.push(`/rooms/${room.id}/edit`)
  }
  
  const handleDelete = async () => {
    if (!confirm(`确定要删除房间 ${room.roomNumber} 吗？此操作不可恢复。`)) {
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/rooms')
      } else {
        const error = await response.json()
        alert(error.message || '删除失败')
      }
    } catch (error) {
      console.error('删除房间失败:', error)
      alert('删除失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 仪表数据更新回调
  const handleMeterUpdate = () => {
    loadMeters()
  }
  
  return (
    <PageContainer 
      title={`房间 ${room.roomNumber}`} 
      showBackButton
    >
      <div className="space-y-6 pb-6">
        {/* 操作按钮 */}
        <RoomActions
          room={room}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
        
        {/* 基本信息 */}
        <RoomBasicInfo room={room} />
        
        {/* 状态管理 */}
        <RoomStatusManagement
          room={room}
          onStatusChange={handleStatusChange}
          isLoading={isLoading}
        />
        
        {/* 租客和合同信息 */}
        <TenantContractInfo room={room} />

        {/* 仪表管理 */}
        <RoomMeterManagement
          roomId={room.id}
          meters={meters}
          onMeterUpdate={handleMeterUpdate}
          loading={metersLoading}
        />
      </div>
    </PageContainer>
  )
}