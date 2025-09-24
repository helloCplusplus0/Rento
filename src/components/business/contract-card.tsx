import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ContractStatusBadge } from '@/components/ui/status-badge'
import { TouchCard } from '@/components/ui/touch-button'
import { formatDate, formatCurrency, calculateOverdueDays } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ContractWithDetails } from '@/types/database'

interface ContractCardProps {
  contract: ContractWithDetails
  onClick?: () => void
  className?: string
}

interface ContractListProps {
  contracts: ContractWithDetails[]
  onContractClick?: (contract: ContractWithDetails) => void
  onInviteBinding?: (contract: ContractWithDetails) => void
  className?: string
}

/**
 * 合同卡片组件
 * 显示合同基本信息和状态
 */
export function ContractCard({ contract, onClick, className }: ContractCardProps) {
  const overdueDays = calculateOverdueDays(contract.endDate)
  
  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {contract.contractNumber}
            </CardTitle>
            <ContractStatusBadge status={contract.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {contract.room.building.name} - {contract.room.roomNumber}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">租客</span>
            <span className="font-medium">{contract.renter.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">月租金</span>
            <span className="font-medium">{formatCurrency(Number(contract.monthlyRent))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">合同期限</span>
            <span className="font-medium text-xs">
              {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
            </span>
          </div>
          {contract.status === 'EXPIRED' && overdueDays > 0 && (
            <div className="text-red-600 text-xs font-medium">
              已过期 {overdueDays} 天
            </div>
          )}
        </CardContent>
      </Card>
    </TouchCard>
  )
}

/**
 * 合同列表组件
 * 支持状态筛选、逾期提醒、搜索等功能
 */
export function ContractList({
  contracts,
  onContractClick,
  onInviteBinding,
  className
}: ContractListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date')

  // 筛选和搜索逻辑
  const filteredContracts = contracts.filter(contract => {
    const matchesStatus = selectedStatus === 'all' || contract.status === selectedStatus
    const matchesSearch = !searchTerm || 
      contract.room.building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.renter.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  // 排序逻辑
  const sortedContracts = [...filteredContracts].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    }
    return a.status.localeCompare(b.status)
  })

  // 计算逾期天数
  const getOverdueDays = (contract: ContractWithDetails) => {
    const today = new Date()
    const endDate = new Date(contract.endDate)
    const diffTime = today.getTime() - endDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // 状态选项
  const statusOptions = [
    { value: 'all', label: '全部', count: contracts.length },
    { value: 'ACTIVE', label: '在租中', count: contracts.filter(c => c.status === 'ACTIVE').length },
    { value: 'EXPIRED', label: '已到期', count: contracts.filter(c => c.status === 'EXPIRED').length },
    { value: 'PENDING', label: '待生效', count: contracts.filter(c => c.status === 'PENDING').length },
    { value: 'TERMINATED', label: '已终止', count: contracts.filter(c => c.status === 'TERMINATED').length }
  ]

  return (
    <div className={cn('space-y-4', className)}>
      {/* 顶部筛选栏 */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>租客合同</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                部门
              </Button>
              <Button variant="ghost" size="sm">
                合同状态
              </Button>
              <Button variant="ghost" size="sm">
                筛选
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSortBy(sortBy === 'date' ? 'status' : 'date')}>
                排序
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 搜索框 */}
          <Input
            placeholder="搜索合同、房间或租客..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          {/* 状态筛选标签 */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <Button
                key={option.value}
                variant={selectedStatus === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(option.value)}
                className="h-8"
              >
                {option.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 合同列表 */}
      <div className="space-y-3">
        {sortedContracts.map(contract => {
          const overdueDays = getOverdueDays(contract)
          const isOverdue = overdueDays > 0
          
          return (
            <Card 
              key={contract.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isOverdue && 'border-red-200 bg-red-50'
              )}
              onClick={() => onContractClick?.(contract)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {contract.room.building.name}_{contract.room.roomNumber}
                      </h3>
                      <ContractStatusBadge status={contract.status} />
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        {formatDate(contract.startDate)} 至 {formatDate(contract.endDate)} | {contract.renter.name}
                      </p>
                      
                      {isOverdue && (
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            已到期{overdueDays}天
                          </Badge>
                          <span className="text-red-600 text-xs">备注</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onInviteBinding && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onInviteBinding(contract)
                        }}
                        className="text-cyan-600 hover:text-cyan-700"
                      >
                        邀请绑定
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      ⋯
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 空状态 */}
      {sortedContracts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">暂无符合条件的合同</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * 紧凑型合同卡片
 * 用于列表中的小尺寸显示
 */
export function CompactContractCard({ contract, onClick, className }: ContractCardProps) {
  const getExpiryText = () => {
    const daysToExpiry = calculateOverdueDays(contract.endDate)
    if (daysToExpiry > 0) {
      return `过期${daysToExpiry}天`
    } else if (daysToExpiry >= -30) {
      return `${Math.abs(daysToExpiry)}天后到期`
    }
    return null
  }

  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm truncate max-w-[100px]">
                {contract.contractNumber}
              </span>
              <ContractStatusBadge 
                status={contract.status} 
                showIndicator={true}
                className="text-xs px-1.5 py-0.5"
              />
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {contract.room.building.name} - {contract.room.roomNumber}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {contract.renter.name}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">月租</span>
              <span className="text-sm font-medium">
                {formatCurrency(Number(contract.monthlyRent))}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              至 {formatDate(contract.endDate)}
            </div>
            {getExpiryText() && (
              <div className="text-red-600 text-xs font-medium">
                {getExpiryText()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TouchCard>
  )
}

/**
 * 合同概览卡片
 * 显示合同的关键信息摘要
 */
export function ContractSummaryCard({ contract, onClick, className }: ContractCardProps) {
  const totalBills = contract.bills?.length || 0
  const paidBills = contract.bills?.filter(bill => bill.status === 'PAID').length || 0
  const overdueBills = contract.bills?.filter(bill => bill.status === 'OVERDUE').length || 0

  return (
    <TouchCard onClick={onClick} className={className}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {contract.renter.name}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {contract.room.building.name} - {contract.room.roomNumber}
              </div>
            </div>
            <ContractStatusBadge status={contract.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">
                {paidBills}
              </div>
              <div className="text-xs text-muted-foreground">已付账单</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">
                {overdueBills}
              </div>
              <div className="text-xs text-muted-foreground">逾期账单</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium">
              月租 {formatCurrency(Number(contract.monthlyRent))}
            </div>
            <div className="text-xs text-muted-foreground">
              至 {formatDate(contract.endDate)}
            </div>
          </div>
        </CardContent>
      </Card>
    </TouchCard>
  )
}

/**
 * 合同卡片骨架屏
 * 用于加载状态
 */
export function ContractCardSkeleton({ 
  compact = false, 
  summary = false 
}: { 
  compact?: boolean
  summary?: boolean 
}) {
  if (summary) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
            <div className="h-6 bg-gray-200 rounded w-12 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className="h-6 bg-gray-200 rounded w-8 mx-auto animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-6 bg-gray-200 rounded w-8 mx-auto animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="h-4 bg-gray-200 rounded w-20 mx-auto animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-16 mx-auto animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

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
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
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
          <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}