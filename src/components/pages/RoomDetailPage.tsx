'use client'

import { useEffect, useState } from 'react'
import type { RoomStatus } from '@prisma/client'

import type { RoomWithBuildingForClient } from '@/types/database'
import type { MeterWithReadingsForClient } from '@/types/meter'
import {
  formatClientApiError,
  readClientApiError,
} from '@/lib/client-api-error'
import { RoomActions } from '@/components/business/RoomActions'
import { RoomBasicInfo } from '@/components/business/RoomBasicInfo'
import { roomDetailMobileStyles } from '@/components/business/room-detail-mobile-styles'
import { RoomMeterManagement } from '@/components/business/RoomMeterManagement'
import { RoomStatusManagement } from '@/components/business/RoomStatusManagement'
import { TenantContractInfo } from '@/components/business/TenantContractInfo'
import { PageContainer } from '@/components/layout/PageContainer'

interface RoomDetailPageProps {
  room: RoomWithBuildingForClient
  onEdit?: (room: RoomWithBuildingForClient) => void
  onDeleted?: () => void
  onOpenAddContract?: (room: RoomWithBuildingForClient) => void
  onRefresh?: () => void
}

/**
 * 房间详情页面组件
 * 显示房间的完整信息，包括基本信息、租客信息、合同信息、仪表管理等
 */
export function RoomDetailPage({
  room,
  onEdit,
  onDeleted,
  onOpenAddContract,
  onRefresh,
}: RoomDetailPageProps) {
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
        const metersArray = metersData.data || []

        setMeters(metersArray)
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
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        // 乐观更新：立即更新本地状态
        room.status = status

        if (onRefresh) {
          onRefresh()
        } else {
          window.location.reload()
        }

        // 可选：显示成功提示
        console.log(`房间状态已更新为: ${status}`)
      } else {
        const apiError = await readClientApiError(response, '房间状态更新失败')
        alert(
          formatClientApiError(apiError, {
            defaultTitle: '房间状态更新失败',
            includeCode: true,
          })
        )
      }
    } catch (error) {
      console.error('Failed to update room status:', error)
      // 可选：显示错误提示
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(room)
      return
    }

    window.location.assign(`/rooms/${room.id}/edit`)
  }

  const handleDelete = async () => {
    const canDelete = room.status === 'VACANT' || room.status === 'MAINTENANCE'
    const statusText = room.status === 'VACANT' ? '空房' : '维护中'
    const currentStatusText = room.status === 'OCCUPIED' ? '在租' : '逾期'
    const confirmationDescription = canDelete
      ? '此操作不可恢复，将永久删除房间信息。'
      : `房间当前状态为"${currentStatusText}"，系统会继续向服务端校验合同、账单和仪表历史门禁；若仍存在关联业务事实，将返回具体阻断原因。`

    if (
      !confirm(
        `确定要删除房间 ${room.roomNumber} 吗？\n\n` +
          `当前展示状态：${canDelete ? statusText : currentStatusText}\n` +
          `${confirmationDescription}`
      )
    ) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (onDeleted) {
          onDeleted()
        } else {
          window.location.assign('/rooms')
        }
      } else {
        const apiError = await readClientApiError(response, '删除房间失败')
        alert(
          formatClientApiError(apiError, {
            defaultTitle: '删除房间失败',
            includeCode: true,
          })
        )
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
    <PageContainer title={`房间 ${room.roomNumber}`} showBackButton>
      <div className={roomDetailMobileStyles.pageSection}>
        {/* 操作按钮 */}
        <RoomActions
          room={room}
          onEdit={handleEdit}
          onAddContract={
            onOpenAddContract ? () => onOpenAddContract(room) : undefined
          }
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
