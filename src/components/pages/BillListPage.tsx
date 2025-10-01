'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Bill, Building, Contract, Renter, Room } from '@prisma/client'
import { BarChart3 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BillCard, BillCardSkeleton } from '@/components/business/bill-card'
import {
  BillCardCompact,
  BillCardCompactSkeleton,
} from '@/components/business/BillCardCompact'
import { BillSearchBar } from '@/components/business/BillSearchBar'
import { BillStatsOverview } from '@/components/business/BillStatsOverview'
import { BillStatusFilter } from '@/components/business/BillStatusFilter'
import { PageContainer } from '@/components/layout'

// 简化类型定义，使用any避免复杂的类型转换
interface BillListPageProps {
  initialBills: any[]
}

/**
 * 账单网格布局组件
 * 响应式网格显示账单卡片，支持加载状态和空状态
 * 移动端使用紧凑型卡片，桌面端使用标准卡片
 */
function BillGrid({
  bills,
  onBillClick,
  loading,
  className,
}: {
  bills: any[]
  onBillClick?: (bill: any) => void
  loading?: boolean
  className?: string
}) {
  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* 移动端显示紧凑型骨架屏 */}
        <div className="block lg:hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <BillCardCompactSkeleton key={i} />
          ))}
        </div>
        {/* 桌面端显示网格骨架屏 */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BillCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (bills.length === 0) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">暂无账单</h3>
        <p className="text-gray-600">
          还没有创建任何账单，点击添加按钮开始创建
        </p>
      </div>
    )
  }

  return (
    <>
      {/* 移动端：单列紧凑型卡片 */}
      <div className="block space-y-3 lg:hidden">
        {bills.map((bill) => (
          <BillCardCompact
            key={bill.id}
            bill={bill as any}
            onClick={() => onBillClick?.(bill)}
          />
        ))}
      </div>

      {/* 桌面端：网格布局标准卡片 */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        {bills.map((bill) => (
          <BillCard
            key={bill.id}
            bill={bill as any}
            onClick={() => onBillClick?.(bill)}
          />
        ))}
      </div>
    </>
  )
}

/**
 * 账单列表页面组件
 * 实现账单展示、搜索、筛选和统计功能
 */
export function BillListPage({ initialBills }: BillListPageProps) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 筛选账单数据
  const filteredBills = useMemo(() => {
    return initialBills.filter((bill) => {
      // 状态筛选
      if (selectedStatus && bill.status !== selectedStatus) {
        return false
      }

      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          bill.billNumber.toLowerCase().includes(query) ||
          bill.contract.renter.name.toLowerCase().includes(query) ||
          bill.contract.room.roomNumber.toLowerCase().includes(query) ||
          bill.contract.room.building.name.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [initialBills, selectedStatus, searchQuery])

  // 计算状态统计
  const statusCounts = useMemo(() => {
    const counts = { PENDING: 0, PAID: 0, OVERDUE: 0, COMPLETED: 0 }
    initialBills.forEach((bill) => {
      const status = bill.status as keyof typeof counts
      if (status in counts) {
        counts[status] = (counts[status] || 0) + 1
      }
    })
    return counts
  }, [initialBills])

  // 账单点击处理 - 使用 Next.js 路由优化性能
  const handleBillClick = (bill: any) => {
    // 使用 Next.js 路由进行客户端导航，比 window.location.href 更快
    router.push(`/bills/${bill.id}`)
  }

  return (
    <PageContainer title="账单管理" showBackButton>
      <div className="space-y-6 pb-6">
        {/* 页面头部操作 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">账单概览</h2>
          <Link href="/bills/stats">
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              统计分析
            </Button>
          </Link>
        </div>

        {/* 搜索栏 */}
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <BillSearchBar
            placeholder="搜索账单号、租客姓名或房间号"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {/* 统计概览 */}
        <BillStatsOverview
          bills={initialBills as any} // 临时类型转换
          statusCounts={statusCounts}
        />

        {/* 状态筛选 */}
        <BillStatusFilter
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          statusCounts={statusCounts}
        />

        {/* 账单网格 */}
        <BillGrid
          bills={filteredBills}
          onBillClick={handleBillClick}
          loading={false}
        />
      </div>
    </PageContainer>
  )
}
