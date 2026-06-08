import { Suspense, lazy } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import {
  loadMeterReadingBatchRouteData,
  type MeterReadingBatchRouteData,
} from '../../lib/primary-route-data'
import { navigateToMinixOrDocument } from '../../lib/route-navigation'
import { RouteStateErrorBoundary } from '../RouteStateBoundary'
import {
  MeterReadingRouteInlineError,
  MeterReadingRoutePending,
} from './MeterReadingRouteState'

const BatchMeterReadingPage = lazy(() =>
  import('@/components/pages/BatchMeterReadingPage').then((module) => ({
    default: module.BatchMeterReadingPage,
  }))
)

interface MeterReadingBatchLoaderPayload {
  pageData: Promise<MeterReadingBatchRouteData>
}

export function meterReadingBatchLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadMeterReadingBatchRouteData({ signal: request.signal }),
  })
}

function MeterReadingBatchRouteContent({
  data,
}: {
  data: MeterReadingBatchRouteData
}) {
  const navigate = useNavigate()

  return (
    <BatchMeterReadingPage
      initialRooms={data.rooms}
      navigation={{
        push: (href) => navigateToMinixOrDocument(navigate, href),
      }}
    />
  )
}

export function MeterReadingBatchRoute() {
  const { pageData } = useLoaderData() as MeterReadingBatchLoaderPayload

  return (
    <Suspense
      fallback={
        <MeterReadingRoutePending title="批量抄表" variant="batch" />
      }
    >
      <Await
        resolve={pageData}
        errorElement={
          <MeterReadingRouteInlineError
            title="批量抄表"
            message="批量抄表数据暂时不可用，请稍后重试。"
            retryLabel="重新加载批量抄表"
          />
        }
      >
        {(data) => <MeterReadingBatchRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function MeterReadingBatchRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="批量抄表"
      fallbackMessage="批量抄表页面暂时不可用，请稍后重试。"
      retryLabel="重新加载批量抄表"
    />
  )
}
