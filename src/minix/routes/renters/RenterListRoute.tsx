import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { renterListMobileStyles } from '@/components/business/renter-list-mobile-styles'
import { PageContainer } from '@/components/layout/PageContainer'
import { RenterListPage } from '@/components/pages/RenterListPage'

import {
  loadRenterListRouteData,
  type RenterListRouteData,
} from '../../lib/primary-route-data'
import { navigateToMinixOrDocument } from '../../lib/route-navigation'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface RenterListLoaderPayload {
  pageData: Promise<RenterListRouteData>
}

export function renterListLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadRenterListRouteData(request.url, { signal: request.signal }),
  })
}

function RenterListPending() {
  return (
    <PageContainer title="租客管理" showBackButton>
      <div className={renterListMobileStyles.pageSection}>
        <div className={renterListMobileStyles.toolbarStack}>
          <div className={renterListMobileStyles.toolbarCard}>
            <div className="h-10 animate-pulse rounded bg-gray-200" />
          </div>
          <div className={renterListMobileStyles.filterCard}>
            <div className="space-y-4">
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-9 w-20 animate-pulse rounded bg-gray-200"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={renterListMobileStyles.listGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>
      </div>
    </PageContainer>
  )
}

function RenterListInlineError() {
  return (
    <RouteStateErrorPanel
      title="租客管理"
      message="租客列表暂时不可用，请稍后重试。"
      retryLabel="重新加载租客"
    />
  )
}

function RenterListRouteContent({ data }: { data: RenterListRouteData }) {
  const navigate = useNavigate()

  return (
    <RenterListPage
      initialRenters={data.renters}
      initialSearchQuery={data.initialSearchQuery}
      initialStats={data.stats}
      onOpenRenter={(renterId) => navigateToMinixOrDocument(navigate, `/renters/${renterId}`)}
    />
  )
}

export function RenterListRoute() {
  const { pageData } = useLoaderData() as RenterListLoaderPayload

  return (
    <Suspense fallback={<RenterListPending />}>
      <Await resolve={pageData} errorElement={<RenterListInlineError />}>
        {(data) => <RenterListRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function RenterListRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="租客管理"
      fallbackMessage="租客列表暂时不可用，请稍后重试。"
      retryLabel="重新加载租客"
    />
  )
}
