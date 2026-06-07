import { Suspense } from 'react'
import { Await, defer, useLoaderData, useNavigate } from 'react-router-dom'

import { addRoomMobileStyles } from '@/components/pages/add-room-mobile-styles'
import { PageContainer } from '@/components/layout/PageContainer'
import { AddRoomPage } from '@/components/pages/AddRoomPage'

import {
  loadAddRoomRouteData,
  type AddRoomRouteData,
} from '../../lib/primary-route-data'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface AddRoomLoaderPayload {
  pageData: Promise<AddRoomRouteData>
}

export function addRoomLoader() {
  return defer({
    pageData: loadAddRoomRouteData(),
  })
}

function AddRoomPending() {
  return (
    <PageContainer title="添加房间" showBackButton>
      <div className={addRoomMobileStyles.pageSection}>
        <div className="h-72 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </PageContainer>
  )
}

function AddRoomInlineError() {
  return (
    <RouteStateErrorPanel
      title="添加房间"
      message="添加房间页面暂时不可用，请稍后重试。"
      retryLabel="重新加载添加页"
    />
  )
}

function AddRoomRouteContent({ data }: { data: AddRoomRouteData }) {
  const navigate = useNavigate()

  return (
    <AddRoomPage
      initialBuildings={data.buildings}
      onSubmitSuccess={() => navigate('/rooms')}
    />
  )
}

export function AddRoomRoute() {
  const { pageData } = useLoaderData() as AddRoomLoaderPayload

  return (
    <Suspense fallback={<AddRoomPending />}>
      <Await resolve={pageData} errorElement={<AddRoomInlineError />}>
        {(data) => <AddRoomRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function AddRoomRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="添加房间"
      fallbackMessage="添加房间页面暂时不可用，请稍后重试。"
      retryLabel="重新加载添加页"
    />
  )
}
