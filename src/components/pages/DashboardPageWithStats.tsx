'use client'

import { Suspense } from 'react'

import { useStatistics } from '@/hooks/useStatistics'
import { DashboardContractAlerts } from '@/components/business/DashboardContractAlerts'
import {
  FunctionGrid,
  FunctionGridSkeleton,
} from '@/components/business/FunctionGrid'
import {
  MobileSearchBar,
  MobileSearchBarSkeleton,
} from '@/components/business/MobileSearchBar'
import { SearchBar, SearchBarSkeleton } from '@/components/business/SearchBar'
import { StatisticsCards } from '@/components/business/StatisticsCards'
import { UnifiedAlertsPanel } from '@/components/business/UnifiedAlertsPanel'
import { PageContainer } from '@/components/layout'

/**
 * 主页面组件 - 带统计数据
 * 展示仪表板统计数据、搜索功能和快捷操作
 */
export function DashboardPageWithStats() {
  // 设置自动刷新频率为1小时（3600000毫秒），避免高频请求后端
  const { stats, isLoading, error, refreshStats } = useStatistics(true, 3600000)

  return (
    <PageContainer className="space-y-6 pb-20 lg:pb-6">
      {/* 搜索栏区域 - 响应式显示 */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        {/* 移动端：显示带用户头像的搜索栏 */}
        <div className="block lg:hidden">
          <Suspense fallback={<MobileSearchBarSkeleton />}>
            <MobileSearchBar placeholder="搜索房源、合同" />
          </Suspense>
        </div>

        {/* 桌面端：显示普通搜索栏 */}
        <div className="hidden lg:block">
          <Suspense fallback={<SearchBarSkeleton />}>
            <SearchBar placeholder="搜索房源、合同" />
          </Suspense>
        </div>
      </div>

      {/* 统计卡片区域 */}
      <StatisticsCards
        stats={stats}
        isLoading={isLoading}
        error={error}
        onRefresh={refreshStats}
      />

      {/* 功能模块网格 */}
      <Suspense fallback={<FunctionGridSkeleton />}>
        <FunctionGrid />
      </Suspense>

      {/* 统一提醒面板 */}
      <Suspense
        fallback={
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="animate-pulse">
              <div className="mb-4 h-6 w-1/4 rounded bg-gray-200"></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="text-center">
                    <div className="mx-auto mb-2 h-10 w-10 rounded-lg bg-gray-200 sm:h-12 sm:w-12"></div>
                    <div className="mx-auto h-3 w-16 rounded bg-gray-200"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <UnifiedAlertsPanel />
      </Suspense>
    </PageContainer>
  )
}
