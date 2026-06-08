import { Suspense, lazy } from 'react'
import { Await, defer, useLoaderData } from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import {
  loadMeterReadingHistoryRouteData,
  type MeterReadingHistoryRouteData,
} from '../../lib/primary-route-data'
import { RouteStateErrorBoundary } from '../RouteStateBoundary'
import {
  MeterReadingRouteInlineError,
  MeterReadingRoutePending,
} from './MeterReadingRouteState'

const MeterReadingHistoryPage = lazy(() =>
  import('@/components/pages/MeterReadingHistoryPage').then((module) => ({
    default: module.MeterReadingHistoryPage,
  }))
)

interface MeterReadingHistoryLoaderPayload {
  pageData: Promise<MeterReadingHistoryRouteData>
}

export function meterReadingHistoryLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadMeterReadingHistoryRouteData(request.url, {
      signal: request.signal,
    }),
  })
}

export function MeterReadingHistoryRoute() {
  const { pageData } = useLoaderData() as MeterReadingHistoryLoaderPayload

  return (
    <Suspense
      fallback={
        <MeterReadingRoutePending title="抄表历史" variant="history" />
      }
    >
      <Await
        resolve={pageData}
        errorElement={
          <MeterReadingRouteInlineError
            title="抄表历史"
            message="抄表历史数据暂时不可用，请稍后重试。"
            retryLabel="重新加载抄表历史"
          />
        }
      >
        {(data) => (
          <MeterReadingHistoryPage
            initialReadings={data.readings}
            initialFilters={data.initialFilters}
          />
        )}
      </Await>
    </Suspense>
  )
}

export function MeterReadingHistoryRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="抄表历史"
      fallbackMessage="抄表历史页面暂时不可用，请稍后重试。"
      retryLabel="重新加载抄表历史"
    />
  )
}
