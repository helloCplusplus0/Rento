import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { CreateContractPage } from '@/components/pages/CreateContractPage'

import {
  loadContractCreateRouteData,
  type ContractCreateRouteData,
} from '../../lib/primary-route-data'
import { RouteStateErrorBoundary } from '../RouteStateBoundary'
import {
  ContractRouteInlineError,
  ContractRoutePending,
} from './ContractRouteState'

export async function contractCreateLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadContractCreateRouteData(request.url, { signal: request.signal }),
  })
}

interface ContractCreateLoaderPayload {
  pageData: Promise<ContractCreateRouteData>
}

function ContractCreateRouteContent({ data }: { data: ContractCreateRouteData }) {
  const navigate = useNavigate()

  return (
    <CreateContractPage
      renters={data.renters}
      availableRooms={data.availableRooms}
      preselectedRoomId={data.preselectedRoomId}
      preselectedRenterId={data.preselectedRenterId}
      navigation={{
        push: (href) => navigate(href),
        replace: (href) => navigate(href, { replace: true }),
        back: () => navigate(-1),
      }}
    />
  )
}

export function ContractCreateRoute() {
  const { pageData } = useLoaderData() as ContractCreateLoaderPayload

  return (
    <Suspense fallback={<ContractRoutePending title="创建合同" variant="form" />}>
      <Await
        resolve={pageData}
        errorElement={
          <ContractRouteInlineError
            title="创建合同"
            message="创建合同所需数据暂时不可用，请稍后重试。"
            retryLabel="重新加载创建页"
          />
        }
      >
        {(data) => <ContractCreateRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function ContractCreateRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="创建合同"
      fallbackMessage="创建合同所需数据暂时不可用，请稍后重试。"
      retryLabel="重新加载创建页"
    />
  )
}
