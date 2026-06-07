import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { EditContractPageSimple } from '@/components/pages/EditContractPageSimple'

import {
  loadContractEditRouteData,
  type ContractEditRouteData,
} from '../../lib/primary-route-data'
import { RouteStateErrorBoundary } from '../RouteStateBoundary'
import {
  ContractRouteInlineError,
  ContractRoutePending,
} from './ContractRouteState'

export async function contractEditLoader({ params, request }: LoaderFunctionArgs) {
  if (!params.id) {
    throw new Response('合同ID缺失', {
      status: 400,
      statusText: '合同ID缺失',
    })
  }

  return defer({
    pageData: loadContractEditRouteData(params.id, { signal: request.signal }),
  })
}

interface ContractEditLoaderPayload {
  pageData: Promise<ContractEditRouteData>
}

function ContractEditRouteContent({ data }: { data: ContractEditRouteData }) {
  const navigate = useNavigate()

  return (
    <EditContractPageSimple
      contract={data.contract}
      navigation={{
        push: (href) => navigate(href),
        replace: (href) => navigate(href, { replace: true }),
        back: () => navigate(-1),
      }}
    />
  )
}

export function ContractEditRoute() {
  const { pageData } = useLoaderData() as ContractEditLoaderPayload

  return (
    <Suspense fallback={<ContractRoutePending title="编辑合同" variant="form" />}>
      <Await
        resolve={pageData}
        errorElement={
          <ContractRouteInlineError
            title="编辑合同"
            message="编辑合同所需数据暂时不可用，请稍后重试。"
            retryLabel="重新加载编辑页"
          />
        }
      >
        {(data) => <ContractEditRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function ContractEditRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="编辑合同"
      fallbackMessage="编辑合同所需数据暂时不可用，请稍后重试。"
      retryLabel="重新加载编辑页"
    />
  )
}
