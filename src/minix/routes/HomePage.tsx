import { Suspense, useState } from 'react'
import { AlertTriangle, RefreshCw, User } from 'lucide-react'
import {
  Await,
  defer,
  isRouteErrorResponse,
  Link,
  useLoaderData,
  useRevalidator,
  useRouteError,
} from 'react-router-dom'

import { dashboardMobileStyles } from '@/components/business/dashboard-mobile-styles'
import {
  StatisticsCards,
  StatisticsCardsSkeleton,
} from '@/components/business/StatisticsCards'
import { useStatistics } from '@/hooks/useStatistics'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import {
  MinixFunctionGrid,
  MinixFunctionGridSkeleton,
  MinixNotificationEntryButton,
  MinixSearchBar,
  MinixSearchBarSkeleton,
  MinixUnifiedAlertsPanel,
  MinixUnifiedAlertsPanelSkeleton,
  MinixUserProfileSheet,
} from '../components/homepage/MinixDashboardAdapters'

interface HomePageLoaderData {
  pageReady: Promise<null>
}

export function homePageLoader() {
  return defer({
    pageReady: Promise.resolve(null),
  })
}

function normalizeHomePageError(error: unknown) {
  if (isRouteErrorResponse(error)) {
    if (error.status >= 500) {
      return '工作台暂时不可用，请稍后重试。'
    }

    return error.statusText || '工作台暂时不可用，请稍后重试。'
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return '工作台暂时不可用，请稍后重试。'
}

function HomePageErrorPanel({ message }: { message: string }) {
  const revalidator = useRevalidator()

  return (
    <section className="px-4 py-4 sm:px-6 sm:py-6 lg:px-0 lg:py-8">
      <Card className="border-red-200 bg-red-50/60">
        <CardHeader className="px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base text-red-900 sm:text-lg">
                工作台装配失败
              </CardTitle>
              <p className="text-sm leading-6 text-red-700">{message}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 px-4 pb-4 sm:px-6">
          <Button
            type="button"
            onClick={() => revalidator.revalidate()}
            disabled={revalidator.state === 'loading'}
          >
            <RefreshCw
              className={cn(
                'h-4 w-4',
                revalidator.state === 'loading' && 'animate-spin'
              )}
            />
            重新加载首页
          </Button>
          <Button asChild variant="outline">
            <Link to="/">返回工作台</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}

function HomePageInlineError() {
  return <HomePageErrorPanel message="工作台暂时不可用，请稍后重试。" />
}

export function HomePageRouteErrorBoundary() {
  const routeError = useRouteError()

  return <HomePageErrorPanel message={normalizeHomePageError(routeError)} />
}

export function HomePagePending() {
  return (
    <section className="space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-0 lg:py-8">
      <div className={dashboardMobileStyles.pageSection}>
        <div className="lg:hidden">
          <div className={dashboardMobileStyles.workbenchHero}>
            <div className={dashboardMobileStyles.workbenchTopBar}>
              <div className="h-10 w-10 animate-pulse rounded-xl bg-white/20" />
              <MinixSearchBarSkeleton />
              <div className="h-10 w-16 animate-pulse rounded-xl bg-white/20" />
            </div>
          </div>
        </div>

        <div className={dashboardMobileStyles.section}>
          <div className="flex items-center justify-between gap-3">
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
          </div>
          <StatisticsCardsSkeleton />
        </div>

        <MinixFunctionGridSkeleton />
        <MinixUnifiedAlertsPanelSkeleton />
      </div>
    </section>
  )
}

function HomePageContent() {
  const { stats, isLoading, error, refreshStats } = useStatistics(true, 3600000)
  const [showUserSheet, setShowUserSheet] = useState(false)

  return (
    <section className="space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-0 lg:py-8">
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
              <Suspense fallback={<MinixSearchBarSkeleton />}>
                <MinixSearchBar
                  placeholder="搜房源、房间号、合同"
                  showButton={false}
                />
              </Suspense>
              <MinixNotificationEntryButton variant="hero" />
            </div>
          </div>
        </div>

        <StatisticsCards
          stats={stats}
          isLoading={isLoading}
          error={error}
          onRefresh={refreshStats}
        />

        <Suspense fallback={<MinixFunctionGridSkeleton />}>
          <MinixFunctionGrid />
        </Suspense>

        <Suspense fallback={<MinixUnifiedAlertsPanelSkeleton />}>
          <MinixUnifiedAlertsPanel />
        </Suspense>

        <MinixUserProfileSheet
          open={showUserSheet}
          onOpenChange={setShowUserSheet}
        />
      </div>
    </section>
  )
}

export function HomePage() {
  const loaderData = useLoaderData() as HomePageLoaderData

  return (
    <Suspense fallback={<HomePagePending />}>
      <Await resolve={loaderData.pageReady} errorElement={<HomePageInlineError />}>
        {() => <HomePageContent />}
      </Await>
    </Suspense>
  )
}
