import { Suspense } from 'react'
import {
  Await,
  defer,
  isRouteErrorResponse,
  useLoaderData,
  useNavigate,
  useRouteError,
  useAsyncError,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { renterDetailMobileStyles } from '@/components/business/renter-detail-mobile-styles'
import { PageContainer } from '@/components/layout/PageContainer'
import { RenterDetailPage } from '@/components/pages/RenterDetailPage'

import {
  loadRenterDetailRouteData,
  type RenterDetailRouteData,
} from '../../lib/primary-route-data'
import { navigateToMinixOrDocument } from '../../lib/route-navigation'
import {
  isRouteNotFoundError,
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
  RouteStateNotFoundPanel,
} from '../RouteStateBoundary'

interface RenterDetailLoaderPayload {
  pageData: Promise<RenterDetailRouteData>
}

export function renterDetailLoader({ params, request }: LoaderFunctionArgs) {
  const renterId = params.id?.trim()

  if (!renterId) {
    throw new Response('租客标识无效', {
      status: 400,
      statusText: 'Bad Request',
    })
  }

  return defer({
    pageData: loadRenterDetailRouteData(renterId, { signal: request.signal }),
  })
}

function RenterDetailPending() {
  return (
    <PageContainer title="租客详情" showBackButton>
      <div className={renterDetailMobileStyles.pageSection}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-gray-200"
          />
        ))}
      </div>
    </PageContainer>
  )
}

function RenterDetailInlineError() {
  const routeError = useAsyncError()

  if (isRouteNotFoundError(routeError)) {
    return (
      <RouteStateNotFoundPanel
        title="租客详情"
        message="该租客不存在、已被删除，或当前详情链接已失效。"
        backTo="/renters"
        backLabel="返回租客列表"
      />
    )
  }

  return (
    <RouteStateErrorPanel
      title="租客详情"
      message="租客详情暂时不可用，请稍后重试。"
      retryLabel="重新加载租客"
    />
  )
}

function RenterDetailRouteContent({ data }: { data: RenterDetailRouteData }) {
  const navigate = useNavigate()

  return (
    <RenterDetailPage
      renter={data.renter}
      onEdit={(renter) => navigate(`/renters/${renter.id}/edit`)}
      onDeleted={() => navigate('/renters')}
      onOpenContract={(contractId) =>
        navigateToMinixOrDocument(navigate, `/contracts/${contractId}`)
      }
      onOpenAddContract={(renter) =>
        navigateToMinixOrDocument(navigate, `/add/contract?renterId=${renter.id}`)
      }
      onOpenContracts={(renter) =>
        navigateToMinixOrDocument(navigate, `/contracts?renterId=${renter.id}`)
      }
    />
  )
}

export function RenterDetailRoute() {
  const { pageData } = useLoaderData() as RenterDetailLoaderPayload

  return (
    <Suspense fallback={<RenterDetailPending />}>
      <Await resolve={pageData} errorElement={<RenterDetailInlineError />}>
        {(data) => <RenterDetailRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function RenterDetailRouteErrorBoundary() {
  const routeError = useRouteError()

  if (isRouteErrorResponse(routeError) && routeError.status === 404) {
    return (
      <RouteStateNotFoundPanel
        title="租客详情"
        message="该租客不存在、已被删除，或当前详情链接已失效。"
        backTo="/renters"
        backLabel="返回租客列表"
      />
    )
  }

  return (
    <RouteStateErrorBoundary
      title="租客详情"
      fallbackMessage="租客详情暂时不可用，请稍后重试。"
      retryLabel="重新加载租客"
    />
  )
}
