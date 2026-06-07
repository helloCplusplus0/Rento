import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { roomDetailMobileStyles } from '@/components/business/room-detail-mobile-styles'
import { PageContainer } from '@/components/layout/PageContainer'
import { RoomDetailPage } from '@/components/pages/RoomDetailPage'

import {
  loadRoomDetailRouteData,
  type RoomDetailRouteData,
} from '../../lib/primary-route-data'
import { navigateToMinixOrDocument } from '../../lib/route-navigation'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface RoomDetailLoaderPayload {
  pageData: Promise<RoomDetailRouteData>
}

export function roomDetailLoader({ params, request }: LoaderFunctionArgs) {
  const roomId = params.id?.trim()

  if (!roomId) {
    throw new Response('房间标识无效', {
      status: 400,
      statusText: '房间标识无效',
    })
  }

  return defer({
    pageData: loadRoomDetailRouteData(roomId, { signal: request.signal }),
  })
}

function RoomDetailPending() {
  return (
    <PageContainer title="房间详情" showBackButton>
      <div className={roomDetailMobileStyles.pageSection}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-gray-200"
          />
        ))}
      </div>
    </PageContainer>
  )
}

function RoomDetailInlineError() {
  return (
    <RouteStateErrorPanel
      title="房间详情"
      message="房间详情暂时不可用，请稍后重试。"
      retryLabel="重新加载房间"
    />
  )
}

function RoomDetailRouteContent({ data }: { data: RoomDetailRouteData }) {
  const navigate = useNavigate()
  const revalidator = useRevalidator()

  return (
    <RoomDetailPage
      room={data.room}
      onEdit={(room) => navigate(`/rooms/${room.id}/edit`)}
      onDeleted={() => navigate('/rooms')}
      onOpenAddContract={(room) =>
        navigateToMinixOrDocument(navigate, `/add/contract?roomId=${room.id}`)
      }
      onRefresh={() => revalidator.revalidate()}
    />
  )
}

export function RoomDetailRoute() {
  const { pageData } = useLoaderData() as RoomDetailLoaderPayload

  return (
    <Suspense fallback={<RoomDetailPending />}>
      <Await resolve={pageData} errorElement={<RoomDetailInlineError />}>
        {(data) => <RoomDetailRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function RoomDetailRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="房间详情"
      fallbackMessage="房间详情暂时不可用，请稍后重试。"
      retryLabel="重新加载房间"
    />
  )
}
