import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Edit, Trash2, Plus, FileText } from 'lucide-react'
import type { RoomWithBuildingForClient } from '@/types/database'

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
export function RoomActions({ room, onEdit, onDelete, isLoading }: RoomActionsProps) {
  const handleAddContract = () => {
    // TODO: 跳转到添加合同页面
    console.log('Add contract for room:', room.id)
  }
  
  const handleViewBills = () => {
    // TODO: 跳转到账单列表页面
    console.log('View bills for room:', room.id)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {/* 编辑房间 */}
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            编辑房间
          </Button>
          
          {/* 添加合同 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddContract}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            添加合同
          </Button>
          
          {/* 查看账单 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewBills}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            查看账单
          </Button>
          
          {/* 删除房间 */}
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isLoading}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            删除房间
          </Button>
        </div>
        
        {/* 操作说明 */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>编辑房间</strong>: 修改房间基本信息，如租金、面积等</p>
            <p><strong>添加合同</strong>: 为房间创建新的租赁合同</p>
            <p><strong>查看账单</strong>: 查看该房间相关的所有账单记录</p>
            <p><strong>删除房间</strong>: 永久删除房间信息（谨慎操作）</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}