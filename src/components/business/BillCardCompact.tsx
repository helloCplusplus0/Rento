'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BillStatusBadge } from '@/components/ui/status-badge'
import { TouchCard } from '@/components/ui/touch-button'
import { formatDate, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BillWithContract } from '@/types/database'

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
export function BillCardCompact({ bill, onClick, className }: BillCardCompactProps) {
  const isOverdue = bill.status === 'OVERDUE'
  const overdueDays = isOverdue 
    ? Math.ceil((Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="transition-all hover:shadow-md overflow-hidden">
        <CardContent className="p-3">
          {/* 头部信息行 - 与桌面端功能完全一致 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={cn(
                'w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0',
                isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              )}>
                ¥
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{bill.billNumber}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {bill.contract.room.building.name} - {bill.contract.room.roomNumber}
                </div>
              </div>
            </div>
            <BillStatusBadge status={bill.status} className="text-xs px-2 py-0.5 ml-2 flex-shrink-0" />
          </div>
          
          {/* 详细信息区域 - 补齐桌面端的所有功能 */}
          <div className="space-y-2">
            {/* 金额信息 - 与桌面端一致 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">应收金额</span>
              <span className="font-semibold text-sm">{formatCurrency(Number(bill.amount))}</span>
            </div>
            
            {/* 已收金额 - 补齐桌面端功能 */}
             {Number(bill.receivedAmount) > 0 && (
               <div className="flex items-center justify-between">
                 <span className="text-xs text-muted-foreground">已收金额</span>
                 <span className="font-medium text-sm text-green-600">{formatCurrency(Number(bill.receivedAmount))}</span>
               </div>
             )}
             
             {/* 待收金额 - 补齐桌面端功能 */}
             {Number(bill.pendingAmount) > 0 && (
               <div className="flex items-center justify-between">
                 <span className="text-xs text-muted-foreground">待收金额</span>
                 <span className="font-medium text-sm text-orange-600">{formatCurrency(Number(bill.pendingAmount))}</span>
               </div>
             )}
            
            {/* 到期日期 - 与桌面端一致 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">到期日期</span>
              <span className="font-medium text-sm">{formatDate(bill.dueDate)}</span>
            </div>
            
            {/* 账期信息 - 补齐桌面端功能 */}
            {bill.period && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">账期</span>
                <span className="text-xs">{bill.period}</span>
              </div>
            )}
            
            {/* 支付方式 - 补齐桌面端功能 */}
            {bill.paymentMethod && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">支付方式</span>
                <span className="text-xs">{bill.paymentMethod}</span>
              </div>
            )}
            
            {/* 操作员信息 - 补齐桌面端功能 */}
            {bill.operator && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">操作员</span>
                <span className="text-xs">{bill.operator}</span>
              </div>
            )}
          </div>
          
          {/* 底部信息 - 与桌面端功能一致 */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isOverdue ? 'bg-red-500' : 'bg-blue-500'
                )}></div>
                <span className="text-xs text-muted-foreground truncate">
                  租客：{bill.contract.renter.name}
                </span>
              </div>
              
              {/* 逾期信息 - 与桌面端一致 */}
              {isOverdue && (
                <div className="text-red-600 text-xs font-medium">
                  已逾期 {overdueDays} 天
                </div>
              )}
            </div>
            
            {/* 备注信息 - 补齐桌面端功能 */}
            {bill.remarks && (
              <div className="mt-1">
                <span className="text-xs text-muted-foreground">备注：</span>
                <span className="text-xs ml-1">{bill.remarks}</span>
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded bg-gray-200 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
          <div className="w-12 h-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-1 w-8"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-1 w-8"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}