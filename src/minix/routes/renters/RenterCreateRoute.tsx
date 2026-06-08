import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'
import { RenterCreatePage } from '@/components/pages/RenterCreatePage'

import {
  loadRenterCreateRouteData,
  type RenterCreateRouteData,
} from '../../lib/primary-route-data'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface RenterCreateLoaderPayload {
  pageData: Promise<RenterCreateRouteData>
}

export function renterCreateLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadRenterCreateRouteData({ signal: request.signal }),
  })
}

function RenterCreatePending() {
  return (
    <PageContainer title="添加租客" showBackButton>
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-52 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </PageContainer>
  )
}

function RenterCreateInlineError() {
  return (
    <RouteStateErrorPanel
      title="添加租客"
      message="租客创建页暂时不可用，请稍后重试。"
      retryLabel="重新加载创建页"
    />
  )
}

function RenterCreateRouteContent() {
  const navigate = useNavigate()

  return (
    <RenterCreatePage
      navigation={{
        push: (href) => navigate(href),
        replace: (href) => navigate(href, { replace: true }),
        back: () => navigate(-1),
      }}
    />
  )
}

export function RenterCreateRoute() {
  const { pageData } = useLoaderData() as RenterCreateLoaderPayload

  return (
    <Suspense fallback={<RenterCreatePending />}>
      <Await resolve={pageData} errorElement={<RenterCreateInlineError />}>
        {() => <RenterCreateRouteContent />}
      </Await>
    </Suspense>
  )
}

export function RenterCreateRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="添加租客"
      fallbackMessage="租客创建页暂时不可用，请稍后重试。"
      retryLabel="重新加载创建页"
    />
  )
}
