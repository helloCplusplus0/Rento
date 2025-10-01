'use client'

import { Edit, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BillActionsProps {
  bill: any
  onEdit: () => void
  onDelete: () => void
}

/**
 * 账单操作组件 - 简化版
 * 专注于管理端的核心操作：编辑和删除
 */
export function BillActions({ bill, onEdit, onDelete }: BillActionsProps) {
  // 判断是否可以删除账单
  const canDelete =
    bill.status === 'PENDING' ||
    (bill.status === 'PAID' && bill.receivedAmount === 0)

  // 判断是否可以编辑账单
  const canEdit = bill.status === 'PENDING'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">操作</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* 编辑账单 */}
          <Button
            variant="outline"
            onClick={onEdit}
            disabled={!canEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            编辑账单
          </Button>

          {/* 删除账单 */}
          {canDelete && (
            <Button
              variant="outline"
              onClick={onDelete}
              className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              删除账单
            </Button>
          )}
        </div>

        {/* 操作说明 */}
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <div className="space-y-1 text-sm text-gray-600">
            {!canEdit && <p>• 只有"待付款"状态的账单才能编辑</p>}
            {!canDelete && <p>• 已收款的账单不能删除，以保证财务数据完整性</p>}
            <p>• 账单信息可通过移动端截屏分享给租客</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
