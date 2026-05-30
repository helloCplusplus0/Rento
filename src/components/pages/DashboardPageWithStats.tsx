'use client'

import { Suspense, useState } from 'react'
import { User } from 'lucide-react'

import { dashboardMobileStyles } from '@/components/business/dashboard-mobile-styles'
import { UserProfileSheet } from '@/components/business/UserProfileSheet'
import { useStatistics } from '@/hooks/useStatistics'
import {
  FunctionGrid,
  FunctionGridSkeleton,
} from '@/components/business/FunctionGrid'
import { NotificationEntryButton } from '@/components/business/NotificationEntryButton'
import { SearchBar, SearchBarSkeleton } from '@/components/business/SearchBar'
import { StatisticsCards } from '@/components/business/StatisticsCards'
import { UnifiedAlertsPanel } from '@/components/business/UnifiedAlertsPanel'
import { PageContainer } from '@/components/layout'

/**
 * 主页面组件 - 带统计数据
 * 展示工作台核心概览、快速跳转搜索、快捷操作和提醒
 */
export function DashboardPageWithStats() {
  // 设置自动刷新频率为1小时（3600000毫秒），避免高频请求后端
  const { stats, isLoading, error, refreshStats } = useStatistics(true, 3600000)
  const [showUserSheet, setShowUserSheet] = useState(false)

  return (
    <PageContainer>
      <div className={dashboardMobileStyles.pageSection}>
        <div className="lg:hidden">
          <div className={dashboardMobileStyles.workbenchHero}>
            <div className={dashboardMobileStyles.workbenchTopBar}>
              <button
                type="button"
                onClick={() => setShowUserSheet(true)}
                className={dashboardMobileStyles.workbenchAvatarButton}
                aria-label="打开个人中心"
              >
                <User className="h-5 w-5" />
              </button>
              <Suspense fallback={<SearchBarSkeleton />}>
                <SearchBar
                  placeholder="搜房源、房间号、合同"
                  showButton={false}
                />
              </Suspense>
              <NotificationEntryButton variant="hero" />
            </div>
          </div>
        </div>

        <StatisticsCards
          stats={stats}
          isLoading={isLoading}
          error={error}
          onRefresh={refreshStats}
        />

        <Suspense fallback={<FunctionGridSkeleton />}>
          <FunctionGrid />
        </Suspense>

        <Suspense
          fallback={
            <div className={dashboardMobileStyles.alertsCard}>
              <div className={dashboardMobileStyles.alertsContent}>
                <div className="animate-pulse">
                  <div className="mb-3 h-5 w-20 rounded bg-gray-200"></div>
                  <div className={dashboardMobileStyles.alertsGrid}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-gray-100 p-2.5 text-center"
                      >
                        <div className="mx-auto mb-1.5 h-9 w-9 rounded-lg bg-gray-200"></div>
                        <div className="mx-auto h-3 w-14 rounded bg-gray-200"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <UnifiedAlertsPanel />
        </Suspense>
      </div>
      <UserProfileSheet open={showUserSheet} onOpenChange={setShowUserSheet} />
    </PageContainer>
  )
}
