import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'
import { EditBillPage } from '@/components/pages/EditBillPage'

import {
  loadEditBillRouteData,
  type EditBillRouteData,
} from '../../lib/primary-route-data'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface EditBillLoaderPayload {
  pageData: Promise<EditBillRouteData>
}

export function editBillLoader({ params, request }: LoaderFunctionArgs) {
  const billId = params.id?.trim()

  if (!billId) {
    throw new Response('账单标识无效', {
      status: 400,
      statusText: '账单标识无效',
    })
  }

  return defer({
    pageData: loadEditBillRouteData(billId, { signal: request.signal }),
  })
}

function EditBillPending() {
  return (
    <PageContainer title="编辑账单" showBackButton>
      <div className="mx-auto max-w-2xl space-y-6 pb-6">
        <div className="h-52 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-[34rem] animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </PageContainer>
  )
}

function EditBillInlineError() {
  return (
    <RouteStateErrorPanel
      title="编辑账单"
      message="账单编辑页暂时不可用，请稍后重试。"
      retryLabel="重新加载编辑页"
    />
  )
}

function EditBillRouteContent({ data }: { data: EditBillRouteData }) {
  const navigate = useNavigate()

  return (
    <EditBillPage
      bill={data.bill}
      navigation={{
        push: (href) => navigate(href),
        replace: (href) => navigate(href, { replace: true }),
        back: () => navigate(-1),
      }}
    />
  )
}

export function EditBillRoute() {
  const { pageData } = useLoaderData() as EditBillLoaderPayload

  return (
    <Suspense fallback={<EditBillPending />}>
      <Await resolve={pageData} errorElement={<EditBillInlineError />}>
        {(data) => <EditBillRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function EditBillRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="编辑账单"
      fallbackMessage="账单编辑页暂时不可用，请稍后重试。"
      retryLabel="重新加载编辑页"
    />
  )
}
