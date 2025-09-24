'use client'

import { Suspense } from 'react'
import { PageContainer } from '@/components/layout'
import { SearchBar, SearchBarSkeleton } from '@/components/business/SearchBar'
import { StatisticsCards } from '@/components/business/StatisticsCards'
import { FunctionGrid, FunctionGridSkeleton } from '@/components/business/FunctionGrid'
import { DashboardContractAlerts } from '@/components/business/DashboardContractAlerts'
import { defaultAlerts } from '@/components/business/dashboard-home'
import { useStatistics } from '@/hooks/useStatistics'

/**
 * 增强的主页面组件
 * 集成了新的统计卡片功能
 */
export function DashboardPageWithStats() {
  // 使用统计数据Hook，启用自动刷新（30秒间隔）
  const { stats, isLoading, error, refreshStats } = useStatistics(true, 30000)

  return (
    <PageContainer className="space-y-6 pb-20 lg:pb-6">
      {/* 搜索栏区域 */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <Suspense fallback={<SearchBarSkeleton />}>
          <SearchBar placeholder="搜索房源、合同" />
        </Suspense>
      </div>

      {/* 增强的统计卡片区域 */}
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
            {defaultAlerts.map((alert) => {
              const getColorClass = (color: string) => {
                switch (color) {
                  case 'red': return 'bg-red-500'
                  case 'orange': return 'bg-orange-500'
                  case 'blue': return 'bg-blue-500'
                  case 'green': return 'bg-green-500'
                  default: return 'bg-gray-500'
                }
              }

              return (
                <div key={alert.id} className="text-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-lg md:text-xl mb-2 mx-auto ${getColorClass(alert.color)}`}>
                    {alert.count}
                  </div>
                  <div className="text-xs text-gray-600 break-words">
                    {alert.title}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* 合同到期提醒区域 */}
          <div className="mt-6 pt-4 border-t">
            <DashboardContractAlerts
              onViewContract={(contractId) => window.location.href = `/contracts/${contractId}`}
              onRenewContract={(contractId) => window.location.href = `/contracts/${contractId}/renew`}
            />
          </div>
        </div>

        {/* 工单区域 */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            工单
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </h3>
          <div className="text-center py-8 text-gray-500">
            暂无工单
          </div>
        </div>
      </div>
    </PageContainer>
  )
}