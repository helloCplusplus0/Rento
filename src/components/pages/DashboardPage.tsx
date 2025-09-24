import { Suspense } from 'react'
import { PageContainer } from '@/components/layout'
import { SearchBar, SearchBarSkeleton } from '@/components/business/SearchBar'
import { DashboardHome, DashboardHomeSkeleton, defaultQuickActions } from '@/components/business/dashboard-home'
import { getEnhancedDashboardStats, getDashboardAlerts } from '@/lib/dashboard-queries'

/**
 * 主页面组件
 * 展示仪表板统计数据、搜索功能和快捷操作
 */
export async function DashboardPage() {
  // 获取统计数据和提醒数据
  const [enhancedStats, alerts] = await Promise.all([
    getEnhancedDashboardStats(),
    getDashboardAlerts()
  ])

  // 转换为DashboardHome组件期望的格式
  const stats = {
    pendingReceivables: enhancedStats.pendingReceivables,
    pendingPayables: enhancedStats.pendingPayables,
    todayReceivables: enhancedStats.todayReceivables.amount,
    todayPayables: enhancedStats.todayPayables.amount,
    monthlyReceivables: enhancedStats.monthlyReceivables.amount,
    monthlyPayables: enhancedStats.monthlyPayables.amount
  }

  return (
    <PageContainer className="space-y-6 pb-20 lg:pb-6">
      {/* 搜索栏区域 */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <Suspense fallback={<SearchBarSkeleton />}>
          <SearchBar
            placeholder="搜索房源、合同"
          />
        </Suspense>
      </div>

      {/* 主要内容区域 */}
      <Suspense fallback={<DashboardHomeSkeleton />}>
        <DashboardHome
          stats={stats}
          alerts={alerts}
          quickActions={defaultQuickActions}
        />
      </Suspense>
    </PageContainer>
  )
}