import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { contractListMobileStyles } from '@/components/business/contract-list-mobile-styles'
import { PageContainer } from '@/components/layout'
import { ContractListPage } from '@/components/pages/ContractListPage'

import {
  loadContractListRouteData,
  type ContractListRouteData,
} from '../../lib/primary-route-data'
import { navigateToMinixOrDocument } from '../../lib/route-navigation'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface ContractListLoaderPayload {
  pageData: Promise<ContractListRouteData>
}

export function contractListLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadContractListRouteData(request.url, { signal: request.signal }),
  })
}

function ContractListPending() {
  return (
    <PageContainer title="合同管理" showBackButton>
      <div className={contractListMobileStyles.pageSection}>
        <div className={contractListMobileStyles.toolbarStack}>
          <div className={contractListMobileStyles.toolbarCard}>
            <div className="h-10 animate-pulse rounded bg-gray-200" />
          </div>
          <div className={contractListMobileStyles.filterCard}>
            <div className="space-y-4">
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-9 w-20 animate-pulse rounded bg-gray-200"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={contractListMobileStyles.listGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    </PageContainer>
  )
}

function ContractListInlineError() {
  return (
    <RouteStateErrorPanel
      title="合同管理"
      message="合同列表暂时不可用，请稍后重试。"
      retryLabel="重新加载合同"
    />
  )
}

function ContractListRouteContent({ data }: { data: ContractListRouteData }) {
  const navigate = useNavigate()

  return (
    <ContractListPage
      initialContracts={data.contracts}
      initialStats={data.stats}
      initialExpiryAlerts={data.expiryAlerts}
      contractExpiryAlertDays={data.contractExpiryAlertDays}
      initialSearchQuery={data.initialSearchQuery}
      onOpenContract={(contract) =>
        navigateToMinixOrDocument(navigate, `/contracts/${contract.id}`)
      }
      onOpenRenewContract={(contractId) =>
        navigateToMinixOrDocument(navigate, `/contracts/${contractId}/renew`)
      }
    />
  )
}

export function ContractListRoute() {
  const { pageData } = useLoaderData() as ContractListLoaderPayload

  return (
    <Suspense fallback={<ContractListPending />}>
      <Await resolve={pageData} errorElement={<ContractListInlineError />}>
        {(data) => <ContractListRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function ContractListRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="合同管理"
      fallbackMessage="合同列表暂时不可用，请稍后重试。"
      retryLabel="重新加载合同"
    />
  )
}
