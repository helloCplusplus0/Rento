import { Suspense, useEffect } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { CheckoutContractPage } from '@/components/pages/CheckoutContractPage'

import {
  loadContractCheckoutRouteData,
  type ContractCheckoutRouteData,
} from '../../lib/primary-route-data'
import { RouteStateErrorBoundary } from '../RouteStateBoundary'
import {
  ContractRouteInlineError,
  ContractRoutePending,
} from './ContractRouteState'

export async function contractCheckoutLoader({
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
    pageData: loadContractCheckoutRouteData(params.id, {
      signal: request.signal,
    }).then((data) => {
      if (data.contract.status !== 'ACTIVE' && data.contract.status !== 'TERMINATED') {
        throw new Response('仅生效中的合同允许办理退租', {
          status: 404,
          statusText: '合同当前状态不可退租',
        })
      }

      return data
    }),
  })
}

interface ContractCheckoutLoaderPayload {
  pageData: Promise<ContractCheckoutRouteData>
}

function ContractCheckoutRouteContent({
  data,
}: {
  data: ContractCheckoutRouteData
}) {
  const navigate = useNavigate()

  useEffect(() => {
    if (data.contract.status === 'TERMINATED') {
      navigate(`/contracts/${data.contract.id}`, { replace: true })
    }
  }, [data.contract.id, data.contract.status, navigate])

  if (data.contract.status === 'TERMINATED') {
    return <ContractRoutePending title="退租合同" variant="flow" />
  }

  return (
    <CheckoutContractPage
      contract={data.contract}
      navigation={{
        push: (href) => navigate(href),
        replace: (href) => navigate(href, { replace: true }),
        back: () => navigate(-1),
      }}
    />
  )
}

export function ContractCheckoutRoute() {
  const { pageData } = useLoaderData() as ContractCheckoutLoaderPayload

  return (
    <Suspense fallback={<ContractRoutePending title="退租合同" variant="flow" />}>
      <Await
        resolve={pageData}
        errorElement={
          <ContractRouteInlineError
            title="退租合同"
            message="退租合同所需数据暂时不可用，请稍后重试。"
            retryLabel="重新加载退租页"
          />
        }
      >
        {(data) => <ContractCheckoutRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function ContractCheckoutRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="退租合同"
      fallbackMessage="退租合同所需数据暂时不可用，请稍后重试。"
      retryLabel="重新加载退租页"
    />
  )
}
