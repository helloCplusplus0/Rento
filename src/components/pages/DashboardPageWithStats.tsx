'use client'

import { Suspense } from 'react'
import { PageContainer } from '@/components/layout'
import { SearchBar, SearchBarSkeleton } from '@/components/business/SearchBar'
import { MobileSearchBar, MobileSearchBarSkeleton } from '@/components/business/MobileSearchBar'
import { StatisticsCards } from '@/components/business/StatisticsCards'
import { FunctionGrid, FunctionGridSkeleton } from '@/components/business/FunctionGrid'
import { DashboardContractAlerts } from '@/components/business/DashboardContractAlerts'
import { defaultAlerts } from '@/components/business/dashboard-home'
import { useStatistics } from '@/hooks/useStatistics'

/**
 * 主页面组件 - 带统计数据
 * 展示仪表板统计数据、搜索功能和快捷操作
 */
export function DashboardPageWithStats() {
  const { stats, isLoading, error, refreshStats } = useStatistics()

  return (
    <PageContainer className="space-y-6 pb-20 lg:pb-6">
      {/* 搜索栏区域 - 响应式显示 */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
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

      {/* 其他内容区域 - 使用默认数据 */}
      <div className="space-y-6">
        {/* 提醒面板 */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            提醒
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {defaultAlerts.map(alert => (
              <div key={alert.id} className="text-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl mb-2 mx-auto ${
                  alert.color === 'red' ? 'bg-red-500' :
                  alert.color === 'orange' ? 'bg-orange-500' :
                  alert.color === 'blue' ? 'bg-blue-500' :
                  alert.color === 'green' ? 'bg-green-500' :
                  'bg-gray-500'
                }`}>
                  {alert.count}
                </div>
                <div className="text-xs text-gray-600">
                  {alert.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 合同到期提醒 */}
        <Suspense fallback={
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        }>
          <DashboardContractAlerts />
        </Suspense>
      </div>
    </PageContainer>
  )
}