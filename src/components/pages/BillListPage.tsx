'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'

import { DEFAULT_BILL_TRACKING_ALERT_DAYS } from '@/lib/bill-alert-semantics'
import {
  buildBillPresentationStats,
  getBillPresentationStatus,
  sortBillsForDisplay,
  type BillPresentationStatus,
} from '@/lib/bill-semantics.shared'
import type { BillWithContractForClient } from '@/types/database'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  BillCardCompact,
  BillCardCompactSkeleton,
} from '@/components/business/BillCardCompact'
import { billListMobileStyles } from '@/components/business/bill-list-mobile-styles'
import { BillSearchBar } from '@/components/business/BillSearchBar'
import { BillStatsOverview } from '@/components/business/BillStatsOverview'
import { BillStatusFilter } from '@/components/business/BillStatusFilter'
import { PageContainer } from '@/components/layout/PageContainer'

interface BillListPageProps {
  initialBills: BillWithContractForClient[]
  initialSearchQuery?: string
  contractExpiryAlertDays?: number
  onOpenBill?: (bill: BillWithContractForClient) => void
  onOpenStats?: () => void
}

/**
 * 账单网格布局组件
 * 响应式网格显示账单卡片，支持加载状态和空状态
 * 移动端与桌面端共用紧凑型卡片结构，仅在桌面端切换为多列排布
 */
function BillGrid({
  bills,
  contractExpiryAlertDays,
  onBillClick,
  loading,
  className,
}: {
  bills: BillWithContractForClient[]
  contractExpiryAlertDays: number
  onBillClick?: (bill: BillWithContractForClient) => void
  loading?: boolean
  className?: string
}) {
  if (loading) {
    return (
      <div className={cn(billListMobileStyles.mobileSkeletonList, className)}>
        {/* 移动端显示紧凑型骨架屏 */}
        <div className="block lg:hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <BillCardCompactSkeleton key={i} />
          ))}
        </div>
        {/* 桌面端沿用与移动端一致的卡片结构，仅切换为多列排布 */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BillCardCompactSkeleton key={i} className="h-full" />
          ))}
        </div>
      </div>
    )
  }

  if (bills.length === 0) {
    return (
      <div className={cn('py-12 text-center', className)}>
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
      <div className={billListMobileStyles.mobileList}>
        {bills.map((bill) => (
          <BillCardCompact
            key={bill.id}
            bill={bill}
            contractExpiryAlertDays={contractExpiryAlertDays}
            onClick={() => onBillClick?.(bill)}
          />
        ))}
      </div>

      {/* 桌面端：保持与移动端一致的卡片结构，仅切换为多列布局 */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        {bills.map((bill) => (
          <BillCardCompact
            key={bill.id}
            bill={bill}
            className="h-full"
            contractExpiryAlertDays={contractExpiryAlertDays}
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
export function BillListPage({
  initialBills,
  initialSearchQuery = '',
  contractExpiryAlertDays = DEFAULT_BILL_TRACKING_ALERT_DAYS,
  onOpenBill,
  onOpenStats,
}: BillListPageProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)

  useEffect(() => {
    setSearchQuery(initialSearchQuery)
  }, [initialSearchQuery])

  // 筛选账单数据
  const filteredBills = useMemo(() => {
    return sortBillsForDisplay(
      initialBills.filter((bill) => {
        // 状态筛选
        if (
          selectedStatus &&
          getBillPresentationStatus(bill) !==
            (selectedStatus as BillPresentationStatus)
        ) {
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
    )
  }, [initialBills, selectedStatus, searchQuery])

  // 计算状态统计
  const presentationStats = useMemo(
    () => buildBillPresentationStats(initialBills),
    [initialBills]
  )

  const handleBillClick = (bill: BillWithContractForClient) => {
    if (onOpenBill) {
      onOpenBill(bill)
      return
    }

    if (typeof window !== 'undefined') {
      window.location.assign(`/bills/${bill.id}`)
    }
  }

  const handleOpenStats = () => {
    if (onOpenStats) {
      onOpenStats()
      return
    }

    if (typeof window !== 'undefined') {
      window.location.assign('/bills/stats')
    }
  }

  return (
    <PageContainer title="账单管理" showBackButton>
      <div className={billListMobileStyles.pageSection}>
        {/* 搜索与统计入口在移动端优先横向排布，减少首屏垂直占用 */}
        <div className={billListMobileStyles.toolbarCard}>
          <div className={billListMobileStyles.toolbarRow}>
            <BillSearchBar
              className="min-w-0 flex-1"
              placeholder="搜索账单号、租客姓名或房间号"
              value={searchQuery}
              onChange={setSearchQuery}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={billListMobileStyles.toolbarActionButton}
              onClick={handleOpenStats}
            >
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="sr-only sm:not-sr-only">统计分析</span>
            </Button>
          </div>
        </div>

        {/* 统计概览 */}
        <BillStatsOverview
          bills={initialBills}
          presentationStats={presentationStats}
        />

        {/* 状态筛选 */}
        <BillStatusFilter
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          presentationStats={presentationStats}
        />

        {/* 账单网格 */}
        <BillGrid
          bills={filteredBills}
          contractExpiryAlertDays={contractExpiryAlertDays}
          onBillClick={handleBillClick}
          loading={false}
        />
      </div>
    </PageContainer>
  )
}
