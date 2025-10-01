'use client'

import type { BillWithContract } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { BillStatusBadge } from '@/components/ui/status-badge'
import { TouchCard } from '@/components/ui/touch-button'

interface BillCardCompactProps {
  bill: BillWithContract
  onClick?: () => void
  className?: string
}

/**
 * 紧凑型账单卡片组件
 * 专为移动端设计，但保持与桌面端完全相同的功能
 * 确保移动端和桌面端功能完全一致，无功能缺失
 */
export function BillCardCompact({
  bill,
  onClick,
  className,
}: BillCardCompactProps) {
  const isOverdue = bill.status === 'OVERDUE'
  const overdueDays = isOverdue
    ? Math.ceil(
        (Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-3">
          {/* 头部信息行 - 与桌面端功能完全一致 */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold',
                  isOverdue
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                )}
              >
                ¥
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {bill.billNumber}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {bill.contract.room.building.name} -{' '}
                  {bill.contract.room.roomNumber}
                </div>
              </div>
            </div>
            <BillStatusBadge
              status={bill.status}
              className="ml-2 flex-shrink-0 px-2 py-0.5 text-xs"
            />
          </div>

          {/* 详细信息区域 - 补齐桌面端的所有功能 */}
          <div className="space-y-2">
            {/* 金额信息 - 与桌面端一致 */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">应收金额</span>
              <span className="text-sm font-semibold">
                {formatCurrency(Number(bill.amount))}
              </span>
            </div>

            {/* 已收金额 - 补齐桌面端功能 */}
            {Number(bill.receivedAmount) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">已收金额</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(Number(bill.receivedAmount))}
                </span>
              </div>
            )}

            {/* 待收金额 - 补齐桌面端功能 */}
            {Number(bill.pendingAmount) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">待收金额</span>
                <span className="text-sm font-medium text-orange-600">
                  {formatCurrency(Number(bill.pendingAmount))}
                </span>
              </div>
            )}

            {/* 到期日期 - 与桌面端一致 */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">到期日期</span>
              <span className="text-sm font-medium">
                {formatDate(bill.dueDate)}
              </span>
            </div>

            {/* 账期信息 - 补齐桌面端功能 */}
            {bill.period && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">账期</span>
                <span className="text-xs">{bill.period}</span>
              </div>
            )}

            {/* 支付方式 - 补齐桌面端功能 */}
            {bill.paymentMethod && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">支付方式</span>
                <span className="text-xs">{bill.paymentMethod}</span>
              </div>
            )}

            {/* 操作员信息 - 补齐桌面端功能 */}
            {bill.operator && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">操作员</span>
                <span className="text-xs">{bill.operator}</span>
              </div>
            )}
          </div>

          {/* 底部信息 - 与桌面端功能一致 */}
          <div className="mt-2 border-t border-gray-100 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isOverdue ? 'bg-red-500' : 'bg-blue-500'
                  )}
                ></div>
                <span className="text-muted-foreground truncate text-xs">
                  租客：{bill.contract.renter.name}
                </span>
              </div>

              {/* 逾期信息 - 与桌面端一致 */}
              {isOverdue && (
                <div className="text-xs font-medium text-red-600">
                  已逾期 {overdueDays} 天
                </div>
              )}
            </div>

            {/* 备注信息 - 补齐桌面端功能 */}
            {bill.remarks && (
              <div className="mt-1">
                <span className="text-muted-foreground text-xs">备注：</span>
                <span className="ml-1 text-xs">{bill.remarks}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TouchCard>
  )
}

/**
 * 紧凑型账单卡片骨架屏
 */
export function BillCardCompactSkeleton({ className }: { className?: string }) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded bg-gray-200"></div>
            <div className="flex-1">
              <div className="mb-1 h-4 animate-pulse rounded bg-gray-200"></div>
              <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
          <div className="h-5 w-12 animate-pulse rounded bg-gray-200"></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="mb-1 h-3 w-8 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
            </div>
            <div>
              <div className="mb-1 h-3 w-8 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-3 w-12 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
