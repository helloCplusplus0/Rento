import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { billCreateMobileStyles } from '@/components/business/bill-create-mobile-styles'
import { PageContainer } from '@/components/layout/PageContainer'
import { CreateBillPage } from '@/components/pages/CreateBillPage'

import { minixClientEnv } from '../../env'
import {
  loadCreateBillRouteData,
  type CreateBillRouteData,
} from '../../lib/primary-route-data'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface CreateBillLoaderPayload {
  pageData: Promise<CreateBillRouteData>
}

export function createBillLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadCreateBillRouteData({ signal: request.signal }),
  })
}

function CreateBillPending() {
  return (
    <PageContainer title="创建账单" showBackButton>
      <div className={billCreateMobileStyles.pageSection}>
        <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-[28rem] animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </PageContainer>
  )
}

function CreateBillInlineError() {
  return (
    <RouteStateErrorPanel
      title="创建账单"
      message="创建账单页暂时不可用，请稍后重试。"
      retryLabel="重新加载创建页"
    />
  )
}

function CreateBillRouteContent({ data }: { data: CreateBillRouteData }) {
  const navigate = useNavigate()

  return (
    <CreateBillPage
      contracts={data.contracts}
      showErrorDetails={minixClientEnv.isDevelopment}
      navigation={{
        push: (href) => navigate(href),
        replace: (href) => navigate(href, { replace: true }),
        back: () => navigate(-1),
      }}
    />
  )
}

export function CreateBillRoute() {
  const { pageData } = useLoaderData() as CreateBillLoaderPayload

  return (
    <Suspense fallback={<CreateBillPending />}>
      <Await resolve={pageData} errorElement={<CreateBillInlineError />}>
        {(data) => <CreateBillRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function CreateBillRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="创建账单"
      fallbackMessage="创建账单页暂时不可用，请稍后重试。"
      retryLabel="重新加载创建页"
    />
  )
}
