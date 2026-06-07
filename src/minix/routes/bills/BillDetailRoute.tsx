import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { billDetailMobileStyles } from '@/components/business/bill-detail-mobile-styles'
import { PageContainer } from '@/components/layout/PageContainer'
import { BillDetailPage } from '@/components/pages/BillDetailPage'

import {
  loadBillDetailRouteData,
  type BillDetailRouteData,
} from '../../lib/primary-route-data'
import { navigateToMinixOrDocument } from '../../lib/route-navigation'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface BillDetailLoaderPayload {
  pageData: Promise<BillDetailRouteData>
}

export function billDetailLoader({ params, request }: LoaderFunctionArgs) {
  const billId = params.id?.trim()

  if (!billId) {
    throw new Response('账单标识无效', {
      status: 400,
      statusText: '账单标识无效',
    })
  }

  return defer({
    pageData: loadBillDetailRouteData(billId, { signal: request.signal }),
  })
}

function BillDetailPending() {
  return (
    <PageContainer title="账单详情" showBackButton>
      <div className={billDetailMobileStyles.pageSection}>
        <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-56 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    </PageContainer>
  )
}

function BillDetailInlineError() {
  return (
    <RouteStateErrorPanel
      title="账单详情"
      message="账单详情暂时不可用，请稍后重试。"
      retryLabel="重新加载账单"
    />
  )
}

function BillDetailRouteContent({ data }: { data: BillDetailRouteData }) {
  const navigate = useNavigate()
  const revalidator = useRevalidator()

  return (
    <BillDetailPage
      bill={data.bill}
      utilityDetailsData={data.utilityDetailsData}
      navigation={{
        push: (href) => navigate(href),
        replace: (href) => navigate(href, { replace: true }),
        back: () => navigate(-1),
        refresh: () => revalidator.revalidate(),
      }}
      onOpenContract={(contractId) =>
        navigateToMinixOrDocument(navigate, `/contracts/${contractId}`)
      }
      onOpenRenter={(renterId) =>
        navigateToMinixOrDocument(navigate, `/renters/${renterId}`)
      }
    />
  )
}

export function BillDetailRoute() {
  const { pageData } = useLoaderData() as BillDetailLoaderPayload

  return (
    <Suspense fallback={<BillDetailPending />}>
      <Await resolve={pageData} errorElement={<BillDetailInlineError />}>
        {(data) => <BillDetailRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function BillDetailRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="账单详情"
      fallbackMessage="账单详情暂时不可用，请稍后重试。"
      retryLabel="重新加载账单"
    />
  )
}
