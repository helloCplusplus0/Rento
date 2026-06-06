import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { billListMobileStyles } from '@/components/business/bill-list-mobile-styles'
import { BillCardCompactSkeleton } from '@/components/business/BillCardCompact'
import { PageContainer } from '@/components/layout/PageContainer'
import { BillListPage } from '@/components/pages/BillListPage'

import {
  loadBillListRouteData,
  type BillListRouteData,
} from '../../lib/primary-route-data'
import { navigateToMinixOrDocument } from '../../lib/route-navigation'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface BillListLoaderPayload {
  pageData: Promise<BillListRouteData>
}

export function billListLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadBillListRouteData(request.url, { signal: request.signal }),
  })
}

function BillListPending() {
  return (
    <PageContainer title="账单管理" showBackButton>
      <div className={billListMobileStyles.pageSection}>
        <div className={billListMobileStyles.toolbarCard}>
          <div className={billListMobileStyles.toolbarRow}>
            <div className="h-10 flex-1 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <BillCardCompactSkeleton key={index} />
          ))}
        </div>
      </div>
    </PageContainer>
  )
}

function BillListInlineError() {
  return (
    <RouteStateErrorPanel
      title="账单管理"
      message="账单列表暂时不可用，请稍后重试。"
      retryLabel="重新加载账单"
    />
  )
}

function BillListRouteContent({ data }: { data: BillListRouteData }) {
  const navigate = useNavigate()

  return (
    <BillListPage
      initialBills={data.bills}
      initialSearchQuery={data.initialSearchQuery}
      onOpenBill={(bill) =>
        navigateToMinixOrDocument(navigate, `/bills/${bill.id}`)
      }
      onOpenStats={() => navigateToMinixOrDocument(navigate, '/bills/stats')}
    />
  )
}

export function BillListRoute() {
  const { pageData } = useLoaderData() as BillListLoaderPayload

  return (
    <Suspense fallback={<BillListPending />}>
      <Await resolve={pageData} errorElement={<BillListInlineError />}>
        {(data) => <BillListRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function BillListRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="账单管理"
      fallbackMessage="账单列表暂时不可用，请稍后重试。"
      retryLabel="重新加载账单"
    />
  )
}
