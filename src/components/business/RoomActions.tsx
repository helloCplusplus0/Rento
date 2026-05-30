import { Edit, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { RoomWithBuildingForClient } from '@/types/database'
import { roomDetailMobileStyles } from '@/components/business/room-detail-mobile-styles'
import { Button } from '@/components/ui/button'

interface RoomActionsProps {
  room: RoomWithBuildingForClient
  onEdit: () => void
  onDelete: () => void
  isLoading?: boolean
}

/**
 * 房间操作按钮组件
 * 提供房间的各种操作功能，如编辑、删除等
 */
export function RoomActions({
  room,
  onEdit,
  onDelete,
  isLoading,
}: RoomActionsProps) {
  const handleAddContract = () => {
    // 跳转到添加合同页面，并预选当前房间
    window.location.href = `/add/contract?roomId=${room.id}`
  }

  return (
    <div className={roomDetailMobileStyles.actionsRow}>
      <Button
        variant="outline"
        onClick={onEdit}
        disabled={isLoading}
        className={roomDetailMobileStyles.actionButton}
      >
        <Edit className="h-4 w-4" />
        编辑房间
      </Button>

      <Button
        variant="outline"
        onClick={handleAddContract}
        disabled={isLoading}
        className={roomDetailMobileStyles.actionButton}
      >
        <Plus className="h-4 w-4" />
        添加合同
      </Button>

      <Button
        variant="outline"
        onClick={onDelete}
        disabled={isLoading}
        className={cn(
          roomDetailMobileStyles.actionButton,
          'border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700'
        )}
      >
        <Trash2 className="h-4 w-4" />
        删除房间
      </Button>
    </div>
  )
}
