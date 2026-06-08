import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import type { DateRange } from '@/lib/bill-stats'
import { PageContainer } from '@/components/layout/PageContainer'
import { BillStatsPage } from '@/components/pages/BillStatsPage'
import { Card, CardContent } from '@/components/ui/card'

import {
  loadBillStatsRouteData,
  type BillStatsRouteData,
} from '../../lib/primary-route-data'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface BillStatsLoaderPayload {
  pageData: Promise<BillStatsRouteData>
}

function buildBillStatsSearchParams(range: DateRange) {
  const searchParams = new URLSearchParams({
    start: range.startDate.toISOString().split('T')[0],
    end: range.endDate.toISOString().split('T')[0],
  })

  if (range.preset) {
    searchParams.set('range', range.preset)
  }

  return searchParams
}

export function billStatsLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadBillStatsRouteData(request.url, { signal: request.signal }),
  })
}

function BillStatsPending() {
  return (
    <PageContainer title="账单统计" showBackButton>
      <div className="space-y-6 pb-6">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-9 w-16 animate-pulse rounded-md bg-gray-200"
                />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardContent className="h-[320px] animate-pulse rounded-2xl bg-gray-100 p-4" />
          </Card>
          <Card>
            <CardContent className="h-[260px] animate-pulse rounded-2xl bg-gray-100 p-4" />
          </Card>
          <Card>
            <CardContent className="h-[260px] animate-pulse rounded-2xl bg-gray-100 p-4" />
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

function BillStatsInlineError() {
  return (
    <RouteStateErrorPanel
      title="账单统计"
      message="账单统计页暂时不可用，请稍后重试。"
      retryLabel="重新加载统计页"
    />
  )
}

function BillStatsRouteContent({ data }: { data: BillStatsRouteData }) {
  const navigate = useNavigate()

  return (
    <BillStatsPage
      initialData={data.statsData}
      initialRange={data.initialRange}
      onDateRangeChange={(range) => {
        const searchParams = buildBillStatsSearchParams(range)
        navigate(`/bills/stats?${searchParams.toString()}`)
      }}
    />
  )
}

export function BillStatsRoute() {
  const { pageData } = useLoaderData() as BillStatsLoaderPayload

  return (
    <Suspense fallback={<BillStatsPending />}>
      <Await resolve={pageData} errorElement={<BillStatsInlineError />}>
        {(data) => <BillStatsRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function BillStatsRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="账单统计"
      fallbackMessage="账单统计页暂时不可用，请稍后重试。"
      retryLabel="重新加载统计页"
    />
  )
}
