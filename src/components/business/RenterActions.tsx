import { Edit, FileText, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import { renterDetailMobileStyles } from '@/components/business/renter-detail-mobile-styles'
import { Button } from '@/components/ui/button'

interface RenterActionsProps {
  renter: any
  onEdit: () => void
  onAddContract?: () => void
  onViewContracts?: () => void
  onDelete: () => void
  isLoading?: boolean
}

/**
 * 租客操作按钮组件
 * 提供租客的各种操作功能，如编辑、删除、添加合同等
 * 参考房间详情页面的操作布局设计
 */
export function RenterActions({
  renter,
  onEdit,
  onAddContract,
  onViewContracts,
  onDelete,
  isLoading,
}: RenterActionsProps) {
  const hasActiveContract = renter.contracts?.some(
    (c: any) => c.status === 'ACTIVE'
  )

  const handleAddContract = () => {
    if (onAddContract) {
      onAddContract()
      return
    }

    // 跳转到添加合同页面，并预选当前租客
    window.location.href = `/add/contract?renterId=${renter.id}`
  }

  const handleViewContracts = () => {
    if (onViewContracts) {
      onViewContracts()
      return
    }

    // 跳转到合同列表页面，筛选当前租客的合同
    window.location.href = `/contracts?renterId=${renter.id}`
  }

  return (
    <div className={renterDetailMobileStyles.actionsRow}>
      {/* 编辑租客 */}
      <Button
        variant="outline"
        onClick={onEdit}
        disabled={isLoading}
        className={renterDetailMobileStyles.actionButton}
      >
        <Edit className="h-4 w-4" />
        编辑租客
      </Button>

      {/* 添加合同 */}
      <Button
        variant="outline"
        onClick={handleAddContract}
        disabled={isLoading}
        className={renterDetailMobileStyles.actionButton}
      >
        <Plus className="h-4 w-4" />
        添加合同
      </Button>

      {/* 查看合同 */}
      {renter.contracts && renter.contracts.length > 0 && (
        <Button
          variant="outline"
          onClick={handleViewContracts}
          disabled={isLoading}
          className={renterDetailMobileStyles.actionButton}
        >
          <FileText className="h-4 w-4" />
          查看合同
        </Button>
      )}

      {/* 删除租客 */}
      <Button
        variant="outline"
        onClick={onDelete}
        disabled={hasActiveContract || isLoading}
        className={cn(
          renterDetailMobileStyles.actionButton,
          'border-red-300 text-red-600 hover:bg-red-50'
        )}
      >
        <Trash2 className="h-4 w-4" />
        删除租客
      </Button>
    </div>
  )
}
