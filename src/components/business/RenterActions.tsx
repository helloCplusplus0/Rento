import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Edit, Trash2, Plus, FileText } from 'lucide-react'

interface RenterActionsProps {
  renter: any
  onEdit: () => void
  onDelete: () => void
  isLoading?: boolean
}

/**
 * 租客操作按钮组件
 * 提供租客的各种操作功能，如编辑、删除、添加合同等
 * 参考房间详情页面的操作布局设计
 */
export function RenterActions({ renter, onEdit, onDelete, isLoading }: RenterActionsProps) {
  const hasActiveContract = renter.contracts?.some((c: any) => c.status === 'ACTIVE')
  
  const handleAddContract = () => {
    // 跳转到添加合同页面，并预选当前租客
    window.location.href = `/add/contract?renterId=${renter.id}`
  }
  
  const handleViewContracts = () => {
    // 跳转到合同列表页面，筛选当前租客的合同
    window.location.href = `/contracts?renterId=${renter.id}`
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {/* 编辑租客 */}
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            编辑租客
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
          
          {/* 查看合同 */}
          {renter.contracts && renter.contracts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewContracts}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              查看合同
            </Button>
          )}
          
          {/* 删除租客 */}
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={hasActiveContract || isLoading}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4" />
            删除租客
          </Button>
        </div>
        
        {/* 删除提示 */}
        {hasActiveContract && (
          <div className="mt-3 text-sm text-gray-500">
            <span className="text-yellow-600">⚠️</span> 该租客有活跃合同，无法删除
          </div>
        )}
      </CardContent>
    </Card>
  )
}