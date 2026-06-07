import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { RenewContractPage } from '@/components/pages/RenewContractPage'

import {
  loadContractRenewRouteData,
  type ContractRenewRouteData,
} from '../../lib/primary-route-data'
import { RouteStateErrorBoundary } from '../RouteStateBoundary'
import {
  ContractRouteInlineError,
  ContractRoutePending,
} from './ContractRouteState'

export async function contractRenewLoader({
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
    pageData: loadContractRenewRouteData(params.id, { signal: request.signal }),
  })
}

interface ContractRenewLoaderPayload {
  pageData: Promise<ContractRenewRouteData>
}

function ContractRenewRouteContent({ data }: { data: ContractRenewRouteData }) {
  const navigate = useNavigate()

  return (
    <RenewContractPage
      contractId={data.contract.id}
      initialContract={data.contract}
      navigation={{
        push: (href) => navigate(href),
        replace: (href) => navigate(href, { replace: true }),
        back: () => navigate(-1),
      }}
    />
  )
}

export function ContractRenewRoute() {
  const { pageData } = useLoaderData() as ContractRenewLoaderPayload

  return (
    <Suspense fallback={<ContractRoutePending title="续租合同" variant="flow" />}>
      <Await
        resolve={pageData}
        errorElement={
          <ContractRouteInlineError
            title="续租合同"
            message="续租合同所需数据暂时不可用，请稍后重试。"
            retryLabel="重新加载续租页"
          />
        }
      >
        {(data) => <ContractRenewRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function ContractRenewRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="续租合同"
      fallbackMessage="续租合同所需数据暂时不可用，请稍后重试。"
      retryLabel="重新加载续租页"
    />
  )
}
