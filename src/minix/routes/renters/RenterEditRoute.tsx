import { Suspense } from 'react'
import {
  Await,
  defer,
  isRouteErrorResponse,
  useAsyncError,
  useLoaderData,
  useNavigate,
  useRouteError,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'
import { RenterEditPage } from '@/components/pages/RenterEditPage'

import {
  loadRenterEditRouteData,
  type RenterEditRouteData,
} from '../../lib/primary-route-data'
import {
  isRouteNotFoundError,
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
  RouteStateNotFoundPanel,
} from '../RouteStateBoundary'

interface RenterEditLoaderPayload {
  pageData: Promise<RenterEditRouteData>
}

export function renterEditLoader({ params, request }: LoaderFunctionArgs) {
  const renterId = params.id?.trim()

  if (!renterId) {
    throw new Response('租客标识无效', {
      status: 400,
      statusText: 'Bad Request',
    })
  }

  return defer({
    pageData: loadRenterEditRouteData(renterId, { signal: request.signal }),
  })
}

function RenterEditPending() {
  return (
    <PageContainer title="编辑租客" showBackButton>
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-52 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </PageContainer>
  )
}

function RenterEditInlineError() {
  const routeError = useAsyncError()

  if (isRouteNotFoundError(routeError)) {
    return (
      <RouteStateNotFoundPanel
        title="编辑租客"
        message="该租客不存在、已被删除，暂时无法继续编辑。"
        backTo="/renters"
        backLabel="返回租客列表"
      />
    )
  }

  return (
    <RouteStateErrorPanel
      title="编辑租客"
      message="租客编辑页暂时不可用，请稍后重试。"
      retryLabel="重新加载编辑页"
    />
  )
}

function RenterEditRouteContent({ data }: { data: RenterEditRouteData }) {
  const navigate = useNavigate()

  return (
    <RenterEditPage
      renter={data.renter}
      navigation={{
        push: (href) => navigate(href),
        replace: (href) => navigate(href, { replace: true }),
        back: () => navigate(-1),
      }}
    />
  )
}

export function RenterEditRoute() {
  const { pageData } = useLoaderData() as RenterEditLoaderPayload

  return (
    <Suspense fallback={<RenterEditPending />}>
      <Await resolve={pageData} errorElement={<RenterEditInlineError />}>
        {(data) => <RenterEditRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function RenterEditRouteErrorBoundary() {
  const routeError = useRouteError()

  if (isRouteErrorResponse(routeError) && routeError.status === 404) {
    return (
      <RouteStateNotFoundPanel
        title="编辑租客"
        message="该租客不存在、已被删除，暂时无法继续编辑。"
        backTo="/renters"
        backLabel="返回租客列表"
      />
    )
  }

  return (
    <RouteStateErrorBoundary
      title="编辑租客"
      fallbackMessage="租客编辑页暂时不可用，请稍后重试。"
      retryLabel="重新加载编辑页"
    />
  )
}
