import type { BillWithContract } from '@/types/database'
import { calculateOverdueDays, formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BillStatusBadge } from '@/components/ui/status-badge'
import { TouchCard } from '@/components/ui/touch-button'

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
    ? Math.ceil(
        (Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="h-full overflow-hidden transition-all hover:shadow-md">
        {/* 黄金比例布局 */}
        <div className="flex aspect-[1.618/1] flex-col">
          {/* 头部区域 - 38.2% */}
          <div
            className={cn(
              'flex flex-[0.382] items-center justify-between p-3',
              isOverdue
                ? 'bg-gradient-to-r from-red-50 to-red-100'
                : 'from-primary/5 to-primary/10 bg-gradient-to-r'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold',
                  isOverdue
                    ? 'bg-red-200 text-red-700'
                    : 'bg-primary/20 text-primary'
                )}
              >
                ¥
              </div>
              <div>
                <div className="text-sm font-medium">{bill.billNumber}</div>
                <div className="text-muted-foreground text-xs">
                  {bill.contract.room.building.name} -{' '}
                  {bill.contract.room.roomNumber}
                </div>
              </div>
            </div>
            <BillStatusBadge
              status={bill.status}
              className="px-2 py-1 text-xs"
            />
          </div>

          {/* 内容区域 - 61.8% */}
          <div className="flex flex-[0.618] flex-col justify-between p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">应收金额</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(Number(bill.amount))}
                </span>
              </div>

              {/* 已收金额 - 与移动端保持一致 */}
              {Number(bill.receivedAmount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    已收金额
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(Number(bill.receivedAmount))}
                  </span>
                </div>
              )}

              {/* 待收金额 - 与移动端保持一致 */}
              {Number(bill.pendingAmount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    待收金额
                  </span>
                  <span className="text-sm font-medium text-orange-600">
                    {formatCurrency(Number(bill.pendingAmount))}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">到期日期</span>
                <span className="text-sm font-medium">
                  {formatDate(bill.dueDate)}
                </span>
              </div>

              {/* 账期信息 - 与移动端保持一致 */}
              {bill.period && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">账期</span>
                  <span className="text-xs">{bill.period}</span>
                </div>
              )}

              {/* 支付方式 - 与移动端保持一致 */}
              {bill.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    支付方式
                  </span>
                  <span className="text-xs">{bill.paymentMethod}</span>
                </div>
              )}
            </div>

            {/* 底部信息 */}
            <div className="mt-2">
              <div className="mb-1 flex items-center gap-1">
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

              {/* 备注信息 - 与移动端保持一致 */}
              {bill.remarks && (
                <div className="mb-1">
                  <span className="text-muted-foreground text-xs">备注：</span>
                  <span className="ml-1 text-xs">{bill.remarks}</span>
                </div>
              )}

              {/* 操作员信息 - 与移动端保持一致 */}
              {bill.operator && (
                <div className="mb-1">
                  <span className="text-muted-foreground text-xs">
                    操作员：
                  </span>
                  <span className="ml-1 text-xs">{bill.operator}</span>
                </div>
              )}

              {isOverdue && (
                <div className="text-xs font-medium text-red-600">
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
              <span className="max-w-[120px] truncate text-sm font-semibold">
                {bill.billNumber}
              </span>
              <BillStatusBadge
                status={bill.status}
                showIndicator={true}
                className="px-1.5 py-0.5 text-xs"
              />
            </div>
            <div className="text-muted-foreground truncate text-xs">
              {bill.contract.room.building.name} -{' '}
              {bill.contract.room.roomNumber}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">金额</span>
              <span className="text-sm font-medium">
                {formatCurrency(Number(bill.amount))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">到期</span>
              <span className="text-xs font-medium">
                {formatDate(bill.dueDate)}
              </span>
            </div>
            {bill.status === 'OVERDUE' && overdueDays > 0 && (
              <div className="text-xs font-medium text-red-600">
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
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-12 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-8 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-3 w-8 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
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
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-12 animate-pulse rounded bg-gray-200" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  )
}
