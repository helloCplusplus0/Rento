'use client'

import type { BillWithContract } from '@/types/database'
import {
  getBillDisplayLabel,
  getBillVisualConfig,
} from '@/lib/bill-display'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { billListMobileStyles } from '@/components/business/bill-list-mobile-styles'
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
      <Card className="gap-0 overflow-hidden py-0 transition-all hover:shadow-md">
        <CardContent className={billListMobileStyles.compactCardContent}>
          {(() => {
            const visualConfig = getBillVisualConfig(bill)
            const Icon = visualConfig.icon

            return (
              <>
          {/* 头部信息行 - 与桌面端功能完全一致 */}
          <div className={billListMobileStyles.compactCardHeader}>
            <div className={billListMobileStyles.compactCardLeading}>
              <div
                className={cn(
                  billListMobileStyles.compactIconBox,
                  isOverdue
                    ? 'bg-red-100 text-red-700'
                    : visualConfig.iconClassName
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={billListMobileStyles.compactTitle}>
                  {getBillDisplayLabel(bill)}
                </div>
                <div className={billListMobileStyles.compactMeta}>
                  {bill.billNumber}
                </div>
                <div className={billListMobileStyles.compactMeta}>
                  {bill.contract.room.building.name} -{' '}
                  {bill.contract.room.roomNumber}
                </div>
              </div>
            </div>
            <BillStatusBadge
              status={bill.status}
              className={billListMobileStyles.compactBadge}
            />
          </div>

          {/* 详细信息区域 - 补齐桌面端的所有功能 */}
          <div className={billListMobileStyles.compactDetails}>
            {/* 金额信息 - 与桌面端一致 */}
            <div className={billListMobileStyles.compactDetailRow}>
              <span className={billListMobileStyles.compactLabel}>
                应收金额
              </span>
              <span
                className={cn(
                  billListMobileStyles.compactValue,
                  'font-semibold text-gray-900'
                )}
              >
                {formatCurrency(Number(bill.amount))}
              </span>
            </div>

            {/* 已收金额 - 补齐桌面端功能 */}
            {Number(bill.receivedAmount) > 0 && (
              <div className={billListMobileStyles.compactDetailRow}>
                <span className={billListMobileStyles.compactLabel}>
                  已收金额
                </span>
                <span
                  className={cn(
                    billListMobileStyles.compactValue,
                    'text-green-600'
                  )}
                >
                  {formatCurrency(Number(bill.receivedAmount))}
                </span>
              </div>
            )}

            {/* 待收金额 - 补齐桌面端功能 */}
            {Number(bill.pendingAmount) > 0 && (
              <div className={billListMobileStyles.compactDetailRow}>
                <span className={billListMobileStyles.compactLabel}>
                  待收金额
                </span>
                <span
                  className={cn(
                    billListMobileStyles.compactValue,
                    'text-orange-600'
                  )}
                >
                  {formatCurrency(Number(bill.pendingAmount))}
                </span>
              </div>
            )}

            {/* 到期日期 - 与桌面端一致 */}
            <div className={billListMobileStyles.compactDetailRow}>
              <span className={billListMobileStyles.compactLabel}>
                到期日期
              </span>
              <span
                className={cn(
                  billListMobileStyles.compactValue,
                  'text-gray-900'
                )}
              >
                {formatDate(bill.dueDate)}
              </span>
            </div>

            {/* 账期信息 - 补齐桌面端功能 */}
            {bill.period && (
              <div className={billListMobileStyles.compactDetailPairRow}>
                <span className={billListMobileStyles.compactDetailPairLabel}>
                  账期
                </span>
                <span className={billListMobileStyles.compactDetailPairValue}>
                  {bill.period}
                </span>
              </div>
            )}

            {/* 支付方式 - 补齐桌面端功能 */}
            {bill.paymentMethod && (
              <div className={billListMobileStyles.compactDetailPairRow}>
                <span className={billListMobileStyles.compactDetailPairLabel}>
                  支付方式
                </span>
                <span className={billListMobileStyles.compactDetailPairValue}>
                  {bill.paymentMethod}
                </span>
              </div>
            )}

            {/* 操作员信息 - 补齐桌面端功能 */}
            {bill.operator && (
              <div className={billListMobileStyles.compactDetailPairRow}>
                <span className={billListMobileStyles.compactDetailPairLabel}>
                  操作员
                </span>
                <span className={billListMobileStyles.compactDetailPairValue}>
                  {bill.operator}
                </span>
              </div>
            )}
          </div>

          {/* 底部信息 - 与桌面端功能一致 */}
          <div className={billListMobileStyles.compactFooter}>
            <div className={billListMobileStyles.compactFooterRow}>
              <div className={billListMobileStyles.compactFooterLeading}>
                <div
                  className={cn(
                    billListMobileStyles.compactFooterDot,
                    isOverdue ? 'bg-red-500' : 'bg-blue-500'
                  )}
                ></div>
                <span className={billListMobileStyles.compactMeta}>
                  租客：{bill.contract.renter.name}
                </span>
              </div>

              {/* 逾期信息 - 与桌面端一致 */}
              {isOverdue && (
                <div className={billListMobileStyles.compactOverdueInfo}>
                  已逾期 {overdueDays} 天
                </div>
              )}
            </div>

            {/* 备注信息 - 补齐桌面端功能 */}
            {bill.remarks && (
              <div className={billListMobileStyles.compactRemarks}>
                <span className={billListMobileStyles.compactLabel}>
                  备注：
                </span>
                <span className={billListMobileStyles.compactRemarksValue}>
                  {bill.remarks}
                </span>
              </div>
            )}
          </div>
              </>
            )
          })()}
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
    <Card className={`gap-0 overflow-hidden py-0 ${className}`}>
      <CardContent className={billListMobileStyles.compactCardContent}>
        <div className="mb-1.5 flex items-center justify-between">
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
