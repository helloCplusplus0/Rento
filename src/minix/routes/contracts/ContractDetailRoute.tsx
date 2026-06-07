import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { ContractDetailPage } from '@/components/pages/ContractDetailPage'

import {
  loadContractDetailRouteData,
  type ContractDetailRouteData,
} from '../../lib/primary-route-data'
import { navigateToMinixOrDocument } from '../../lib/route-navigation'
import { RouteStateErrorBoundary } from '../RouteStateBoundary'
import {
  ContractRouteInlineError,
  ContractRoutePending,
} from './ContractRouteState'

export async function contractDetailLoader({
  params,
  request,
}: LoaderFunctionArgs) {
  if (!params.id) {
    throw new Response('合同ID缺失', {
      status: 400,
      statusText: '合同ID缺失',
    })
  }

  return defer({
    pageData: loadContractDetailRouteData(params.id, { signal: request.signal }),
  })
}

interface ContractDetailLoaderPayload {
  pageData: Promise<ContractDetailRouteData>
}

function ContractDetailRouteContent({ data }: { data: ContractDetailRouteData }) {
  const navigate = useNavigate()
  const revalidator = useRevalidator()

  return (
    <ContractDetailPage
      contract={data.contract}
      contractExpiryAlertDays={data.contractExpiryAlertDays}
      navigation={{
        push: (href) => navigate(href),
        replace: (href) => navigate(href, { replace: true }),
        back: () => navigate(-1),
        reload: () => revalidator.revalidate(),
      }}
      onOpenRenter={(renterId) =>
        navigateToMinixOrDocument(navigate, `/renters/${renterId}`)
      }
      onOpenRoom={(roomId) =>
        navigateToMinixOrDocument(navigate, `/rooms/${roomId}`)
      }
      onOpenBill={(billId) =>
        navigateToMinixOrDocument(navigate, `/bills/${billId}`)
      }
    />
  )
}

export function ContractDetailRoute() {
  const { pageData } = useLoaderData() as ContractDetailLoaderPayload

  return (
    <Suspense fallback={<ContractRoutePending title="合同详情" variant="detail" />}>
      <Await
        resolve={pageData}
        errorElement={
          <ContractRouteInlineError
            title="合同详情"
            message="合同详情暂时不可用，请稍后重试。"
            retryLabel="重新加载合同"
          />
        }
      >
        {(data) => <ContractDetailRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function ContractDetailRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="合同详情"
      fallbackMessage="合同详情暂时不可用，请稍后重试。"
      retryLabel="重新加载合同"
    />
  )
}
