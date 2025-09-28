import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BillStatusBadge } from '@/components/ui/status-badge'
import { TouchCard } from '@/components/ui/touch-button'
import { formatDate, formatCurrency, calculateOverdueDays } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BillWithContract } from '@/types/database'

interface BillCardProps {
  bill: BillWithContract
  onClick?: () => void
  className?: string
}

/**
 * 账单卡片组件
 * 显示账单基本信息和状态
 * 采用黄金比例设计，优化移动端展示
 */
export function BillCard({ bill, onClick, className }: BillCardProps) {
  const isOverdue = bill.status === 'OVERDUE'
  const overdueDays = isOverdue 
    ? Math.ceil((Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="h-full transition-all hover:shadow-md overflow-hidden">
        {/* 黄金比例布局 */}
        <div className="aspect-[1.618/1] flex flex-col">
          {/* 头部区域 - 38.2% */}
          <div className={cn(
            'flex-[0.382] p-3 flex items-center justify-between',
            isOverdue ? 'bg-gradient-to-r from-red-50 to-red-100' : 'bg-gradient-to-r from-primary/5 to-primary/10'
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                isOverdue ? 'bg-red-200 text-red-700' : 'bg-primary/20 text-primary'
              )}>
                ¥
              </div>
              <div>
                <div className="font-medium text-sm">{bill.billNumber}</div>
                <div className="text-xs text-muted-foreground">
                  {bill.contract.room.building.name} - {bill.contract.room.roomNumber}
                </div>
              </div>
            </div>
            <BillStatusBadge status={bill.status} className="text-xs px-2 py-1" />
          </div>
          
          {/* 内容区域 - 61.8% */}
          <div className="flex-[0.618] p-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">应收金额</span>
                <span className="font-semibold text-sm">{formatCurrency(Number(bill.amount))}</span>
              </div>
              
              {/* 已收金额 - 与移动端保持一致 */}
              {Number(bill.receivedAmount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">已收金额</span>
                  <span className="font-medium text-sm text-green-600">{formatCurrency(Number(bill.receivedAmount))}</span>
                </div>
              )}
              
              {/* 待收金额 - 与移动端保持一致 */}
              {Number(bill.pendingAmount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">待收金额</span>
                  <span className="font-medium text-sm text-orange-600">{formatCurrency(Number(bill.pendingAmount))}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">到期日期</span>
                <span className="font-medium text-sm">{formatDate(bill.dueDate)}</span>
              </div>
              
              {/* 账期信息 - 与移动端保持一致 */}
              {bill.period && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">账期</span>
                  <span className="text-xs">{bill.period}</span>
                </div>
              )}
              
              {/* 支付方式 - 与移动端保持一致 */}
              {bill.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">支付方式</span>
                  <span className="text-xs">{bill.paymentMethod}</span>
                </div>
              )}
            </div>
            
            {/* 底部信息 */}
            <div className="mt-2">
              <div className="flex items-center gap-1 mb-1">
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isOverdue ? 'bg-red-500' : 'bg-blue-500'
                )}></div>
                <span className="text-xs text-muted-foreground truncate">
                  租客：{bill.contract.renter.name}
                </span>
              </div>
              
              {/* 备注信息 - 与移动端保持一致 */}
              {bill.remarks && (
                <div className="mb-1">
                  <span className="text-xs text-muted-foreground">备注：</span>
                  <span className="text-xs ml-1">{bill.remarks}</span>
                </div>
              )}
              
              {/* 操作员信息 - 与移动端保持一致 */}
              {bill.operator && (
                <div className="mb-1">
                  <span className="text-xs text-muted-foreground">操作员：</span>
                  <span className="text-xs ml-1">{bill.operator}</span>
                </div>
              )}
              
              {isOverdue && (
                <div className="text-red-600 text-xs font-medium">
                  已逾期 {overdueDays} 天
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </TouchCard>
  )
}

/**
 * 紧凑型账单卡片
 * 用于列表中的小尺寸显示
 */
export function CompactBillCard({ bill, onClick, className }: BillCardProps) {
  const overdueDays = calculateOverdueDays(bill.dueDate)
  
  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm truncate max-w-[120px]">
                {bill.billNumber}
              </span>
              <BillStatusBadge 
                status={bill.status} 
                showIndicator={true}
                className="text-xs px-1.5 py-0.5"
              />
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {bill.contract.room.building.name} - {bill.contract.room.roomNumber}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">金额</span>
              <span className="text-sm font-medium">
                {formatCurrency(Number(bill.amount))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">到期</span>
              <span className="text-xs font-medium">
                {formatDate(bill.dueDate)}
              </span>
            </div>
            {bill.status === 'OVERDUE' && overdueDays > 0 && (
              <div className="text-red-600 text-xs font-medium">
                逾期{overdueDays}天
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TouchCard>
  )
}

/**
 * 账单卡片骨架屏
 * 用于加载状态
 */
export function BillCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Card className="h-full">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-12 animate-pulse" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-12 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}