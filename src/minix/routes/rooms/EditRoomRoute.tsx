import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'
import { EditRoomPage } from '@/components/pages/EditRoomPage'

import {
  loadEditRoomRouteData,
  type EditRoomRouteData,
} from '../../lib/primary-route-data'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface EditRoomLoaderPayload {
  pageData: Promise<EditRoomRouteData>
}

export function editRoomLoader({ params, request }: LoaderFunctionArgs) {
  const roomId = params.id?.trim()

  if (!roomId) {
    throw new Response('房间标识无效', {
      status: 400,
      statusText: '房间标识无效',
    })
  }

  return defer({
    pageData: loadEditRoomRouteData(roomId, { signal: request.signal }),
  })
}

function EditRoomPending() {
  return (
    <PageContainer title="编辑房间" showBackButton>
      <div className="mx-auto max-w-2xl space-y-6 pb-6">
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </PageContainer>
  )
}

function EditRoomInlineError() {
  return (
    <RouteStateErrorPanel
      title="编辑房间"
      message="房间编辑页暂时不可用，请稍后重试。"
      retryLabel="重新加载编辑页"
    />
  )
}

function EditRoomRouteContent({ data }: { data: EditRoomRouteData }) {
  const navigate = useNavigate()

  return (
    <EditRoomPage
      room={data.room}
      buildings={data.buildings}
      onSubmitSuccess={(room) => navigate(`/rooms/${room.id}`)}
      onCancel={() => navigate(-1)}
    />
  )
}

export function EditRoomRoute() {
  const { pageData } = useLoaderData() as EditRoomLoaderPayload

  return (
    <Suspense fallback={<EditRoomPending />}>
      <Await resolve={pageData} errorElement={<EditRoomInlineError />}>
        {(data) => <EditRoomRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function EditRoomRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="编辑房间"
      fallbackMessage="房间编辑页暂时不可用，请稍后重试。"
      retryLabel="重新加载编辑页"
    />
  )
}
