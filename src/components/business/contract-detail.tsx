import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ContractStatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ContractWithDetails } from '@/types/database'

interface ContractDetailProps {
  contract: ContractWithDetails
  onEdit?: () => void
  onRenew?: () => void
  onTerminate?: () => void
  onViewPDF?: () => void
  className?: string
}

/**
 * 合同详情页面组件
 * 完整展示合同信息，支持各种操作按钮
 */
export function ContractDetail({
  contract,
  onEdit,
  onRenew,
  onTerminate,
  onViewPDF,
  className
}: ContractDetailProps) {
  const isActive = contract.status === 'ACTIVE'
  const isExpired = contract.status === 'EXPIRED'
  const daysUntilExpiry = Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* 顶部状态栏 */}
      <div className={cn(
        'px-4 py-4 sm:py-6 text-white',
        isActive ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' :
        isExpired ? 'bg-gradient-to-r from-red-500 to-red-600' :
        'bg-gradient-to-r from-gray-500 to-gray-600'
      )}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-xl font-bold">合同详情</h1>
            <ContractStatusBadge 
              status={contract.status} 
              className="bg-white/20 text-white border-white/30 text-xs sm:text-sm"
            />
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-lg sm:text-xl font-bold break-words">
              {contract.room.building.name}_{contract.room.roomNumber}
            </h2>
            <p className="text-white/90 text-sm sm:text-base break-words">
              {contract.renter.name} - {contract.contractNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* 快捷操作按钮 - 移动端优化 */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onViewPDF && (
            <Button variant="outline" onClick={onViewPDF} className="flex-1 h-12 sm:h-10 text-sm">
              查看PDF
            </Button>
          )}
          <Button className="flex-1 h-12 sm:h-10 bg-cyan-600 hover:bg-cyan-700 text-sm">
            邀请绑定
          </Button>
        </div>

        {/* 合同详情 */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>合同详情</CardTitle>
              {onViewPDF && (
                <Button variant="ghost" size="sm" onClick={onViewPDF}>
                  查看PDF
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600">合同周期</label>
                <p className="font-medium text-sm sm:text-base break-words">
                  {formatDate(contract.startDate)}至{formatDate(contract.endDate)}
                  {contract.isExtended && (
                    <Badge variant="secondary" className="ml-2 text-xs">延期</Badge>
                  )}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">计划退租</label>
                <p className="font-medium">{formatDate(contract.endDate)}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">常规租金</label>
                <p className="font-medium">{formatCurrency(Number(contract.monthlyRent))}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">付款方式</label>
                <p className="font-medium">{contract.paymentMethod || '付6押金自定义'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">租金单价</label>
                <p className="font-medium">{formatCurrency(Number(contract.monthlyRent))}/月</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">总租金</label>
                <p className="font-medium text-lg text-green-600">
                  {formatCurrency(Number(contract.totalRent))}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">免租天数</label>
                <p className="font-medium">0</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">支付时间</label>
                <p className="font-medium">{contract.paymentTiming || '账单开始前提前7天收租'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">委托模式</label>
                <p className="font-medium">包租</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">业务状态</label>
                <p className="font-medium">在租中</p>
              </div>
            </div>

            <Separator />

            {/* 费用明细 */}
            <div className="space-y-3">
              <h4 className="font-medium">费用明细</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">门卡押金</label>
                  <p className="font-medium">{formatCurrency(Number(contract.keyDeposit))}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-600">保洁费</label>
                  <p className="font-medium">
                    {formatCurrency(Number(contract.cleaningFee))} (一次付清)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 其他信息 */}
        <Card>
          <CardHeader>
            <CardTitle>其他信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">签约人</label>
                <p className="font-medium">{contract.renter.name}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">签约时间</label>
                <p className="font-medium">
                  {contract.signedDate ? formatDate(contract.signedDate) : '2022-09-19'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 底部操作按钮 */}
        <div className="flex gap-3 pb-6">
          <Button variant="outline" className="flex-1">
            更多
          </Button>
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            重签
          </Button>
          <Button variant="outline" className="flex-1">
            换房
          </Button>
          {isActive && onRenew && (
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={onRenew}>
              续租
            </Button>
          )}
          {isActive && onTerminate && (
            <Button 
              variant="destructive" 
              className="flex-1 bg-gray-600 hover:bg-gray-700" 
              onClick={onTerminate}
            >
              退租
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 合同详情骨架屏
 */
export function ContractDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部状态栏骨架 */}
      <div className="bg-gray-300 px-4 py-6 animate-pulse">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-400 rounded w-24"></div>
            <div className="h-6 bg-gray-400 rounded w-16"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-400 rounded w-48"></div>
            <div className="h-5 bg-gray-400 rounded w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 按钮骨架 */}
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
        </div>

        {/* 卡片骨架 */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}