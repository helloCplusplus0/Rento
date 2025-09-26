'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { BillCard } from '@/components/business/bill-card'
import { VirtualList } from '@/components/ui/VirtualList'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, RefreshCw } from 'lucide-react'
import type { BillStatus } from '@prisma/client'

/**
 * 账单列表页面属性接口
 */
interface OptimizedBillListPageProps {
  /** 初始账单数据 */
  initialBills: any[]
  /** 是否启用虚拟滚动 */
  enableVirtualScroll?: boolean
  /** 虚拟滚动容器高度 */
  containerHeight?: number
}

/**
 * 账单筛选状态
 */
const BILL_STATUS_OPTIONS = [
  { value: null, label: '全部', color: 'default' },
  { value: 'PENDING', label: '待付', color: 'yellow' },
  { value: 'PAID', label: '已付', color: 'green' },
  { value: 'OVERDUE', label: '逾期', color: 'red' },
  { value: 'COMPLETED', label: '已完成', color: 'blue' }
] as const

/**
 * 优化版账单列表页面组件
 * 
 * 特性：
 * - 虚拟滚动支持大数据量展示
 * - 实时搜索和筛选
 * - 性能优化的渲染
 * - 响应式设计
 * 
 * @example
 * ```tsx
 * <OptimizedBillListPage 
 *   initialBills={bills}
 *   enableVirtualScroll={true}
 *   containerHeight={600}
 * />
 * ```
 */
export function OptimizedBillListPage({ 
  initialBills,
  enableVirtualScroll = true,
  containerHeight = 600
}: OptimizedBillListPageProps) {
  const router = useRouter()
  const [bills, setBills] = useState(initialBills)
  const [selectedStatus, setSelectedStatus] = useState<BillStatus | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // 筛选和搜索逻辑
  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      // 状态筛选
      if (selectedStatus && bill.status !== selectedStatus) {
        return false
      }

      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          bill.billNumber?.toLowerCase().includes(query) ||
          bill.contract?.renter?.name?.toLowerCase().includes(query) ||
          bill.contract?.room?.roomNumber?.toLowerCase().includes(query) ||
          bill.contract?.room?.building?.name?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [bills, selectedStatus, searchQuery])

  // 统计数据
  const stats = useMemo(() => {
    const total = filteredBills.length
    const pending = filteredBills.filter(b => b.status === 'PENDING').length
    const paid = filteredBills.filter(b => b.status === 'PAID').length
    const overdue = filteredBills.filter(b => b.status === 'OVERDUE').length
    const totalAmount = filteredBills.reduce((sum, b) => sum + Number(b.amount || 0), 0)

    return { total, pending, paid, overdue, totalAmount }
  }, [filteredBills])

  // 账单点击处理
  const handleBillClick = useCallback((bill: any) => {
    router.push(`/bills/${bill.id}`)
  }, [router])

  // 渲染账单项目
  const renderBillItem = useCallback((bill: any, index: number) => (
    <div className="px-4 py-2">
      <BillCard 
        bill={bill}
        onClick={() => handleBillClick(bill)}
        className="hover:shadow-md transition-shadow duration-200"
      />
    </div>
  ), [handleBillClick])

  // 搜索处理
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // 状态筛选处理
  const handleStatusFilter = useCallback((status: BillStatus | null) => {
    setSelectedStatus(status)
  }, [])

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setLoading(true)
    try {
      // 这里可以调用API刷新数据
      // const freshBills = await fetchBills()
      // setBills(freshBills)
    } catch (error) {
      console.error('Failed to refresh bills:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 虚拟滚动配置
  const ITEM_HEIGHT = 140 // 账单卡片高度（包含padding）

  return (
    <PageContainer title="账单管理" showBackButton>
      <div className="space-y-6 pb-6">
        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">总账单</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">待付款</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
              <div className="text-sm text-gray-600">已付款</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-gray-600">已逾期</div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>账单列表</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 搜索栏 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索账单号、租客姓名、房间号..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 状态筛选 */}
            <div className="flex flex-wrap gap-2">
              <Filter className="h-4 w-4 text-gray-400 mt-1" />
              {BILL_STATUS_OPTIONS.map((option) => (
                <Badge
                  key={option.value || 'all'}
                  variant={selectedStatus === option.value ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleStatusFilter(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 账单列表 */}
        <Card>
          <CardContent className="p-0">
            {filteredBills.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-lg font-medium">暂无账单数据</div>
                <div className="text-sm">请尝试调整筛选条件或添加新账单</div>
              </div>
            ) : enableVirtualScroll ? (
              <VirtualList
                  items={filteredBills}
                  itemHeight={ITEM_HEIGHT}
                  containerHeight={containerHeight}
                  renderItem={renderBillItem}
                  overscan={10}
                  className="rounded-lg"
                  enableRenderCache={true}
                  cacheSize={100}
                />
            ) : (
              <div className="space-y-2 p-4 max-h-96 overflow-y-auto">
                {filteredBills.map((bill, index) => (
                  <div key={bill.id}>
                    {renderBillItem(bill, index)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 性能信息（开发模式下显示） */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                <div>总账单数: {bills.length}</div>
                <div>筛选后: {filteredBills.length}</div>
                <div>虚拟滚动: {enableVirtualScroll ? '已启用' : '已禁用'}</div>
                {enableVirtualScroll && (
                  <div>预计DOM节点: ~{Math.ceil(containerHeight / ITEM_HEIGHT) + 20}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}

export default OptimizedBillListPage