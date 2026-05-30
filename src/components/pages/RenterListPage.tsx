'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { renterListMobileStyles } from '@/components/business/renter-list-mobile-styles'
import { RenterGrid } from '@/components/business/RenterGrid'
import { RenterSearchBar } from '@/components/business/RenterSearchBar'
import { PageContainer } from '@/components/layout'

interface RenterListPageProps {
  initialRenters: any[]
  initialStats: {
    totalCount: number
    activeCount: number
    inactiveCount: number
    newThisMonth: number
  }
}

export function RenterListPage({
  initialRenters,
  initialStats,
}: RenterListPageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [renterFilter, setRenterFilter] = useState<string | null>(null)
  const loading = false

  // 筛选租客数据
  const filteredRenters = useMemo(() => {
    return initialRenters.filter((renter) => {
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !renter.name.toLowerCase().includes(query) &&
          !renter.phone.includes(query) &&
          !renter.idCard?.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // 状态筛选
      if (renterFilter) {
        if (renterFilter === 'active') {
          return renter.contracts.some((c: any) => c.status === 'ACTIVE')
        } else if (renterFilter === 'inactive') {
          return !renter.contracts.some((c: any) => c.status === 'ACTIVE')
        } else if (renterFilter === 'new_this_month') {
          const createdAt = renter.createdAt ? new Date(renter.createdAt) : null
          if (!createdAt || Number.isNaN(createdAt.getTime())) {
            return false
          }

          const now = new Date()
          return (
            createdAt.getFullYear() === now.getFullYear() &&
            createdAt.getMonth() === now.getMonth()
          )
        }
      }

      return true
    })
  }, [initialRenters, searchQuery, renterFilter])

  const filterCounts = useMemo(
    () => ({
      total: initialStats.totalCount,
      active: initialStats.activeCount,
      inactive: initialStats.inactiveCount,
      newThisMonth: initialStats.newThisMonth,
    }),
    [initialStats]
  )

  // 处理租客点击
  const handleRenterClick = (renter: any) => {
    router.push(`/renters/${renter.id}`)
  }

  return (
    <PageContainer title="租客管理" showBackButton>
      <div className={renterListMobileStyles.pageSection}>
        {/* 搜索栏 */}
        <RenterSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          renterFilter={renterFilter}
          onRenterFilterChange={setRenterFilter}
          filterCounts={filterCounts}
          loading={loading}
        />

        {/* 结果统计 */}
        {(searchQuery || renterFilter) && (
          <div className={renterListMobileStyles.resultText}>
            找到 {filteredRenters.length} 个租客
            {searchQuery && ` (搜索: ${searchQuery})`}
            {renterFilter &&
              ` (状态: ${
                renterFilter === 'active'
                  ? '在租'
                  : renterFilter === 'inactive'
                    ? '空闲'
                    : '本月新增'
              })`}
          </div>
        )}

        {/* 租客网格 */}
        <RenterGrid
          renters={filteredRenters}
          onRenterClick={handleRenterClick}
          loading={loading}
        />
      </div>
    </PageContainer>
  )
}
