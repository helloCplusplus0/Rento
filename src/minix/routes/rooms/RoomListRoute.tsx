import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { roomListMobileStyles } from '@/components/business/room-list-mobile-styles'
import { RoomGridSkeleton } from '@/components/business/room-grid'
import { PageContainer } from '@/components/layout/PageContainer'
import { RoomListPage } from '@/components/pages/RoomListPage'

import {
  loadRoomListRouteData,
  type RoomListRouteData,
} from '../../lib/primary-route-data'
import { navigateToMinixOrDocument } from '../../lib/route-navigation'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface RoomListLoaderPayload {
  pageData: Promise<RoomListRouteData>
}

export function roomListLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadRoomListRouteData(request.url, { signal: request.signal }),
  })
}

function RoomListPending() {
  return (
    <PageContainer title="房源管理" showBackButton>
      <div className={roomListMobileStyles.pageSection}>
        <div className={roomListMobileStyles.toolbarCard}>
          <div className="h-10 animate-pulse rounded bg-gray-200" />
        </div>
        <div className={roomListMobileStyles.filterCard}>
          <div className="space-y-4">
            <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-9 w-20 animate-pulse rounded bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
        <div className={roomListMobileStyles.toolbarCard}>
          <RoomGridSkeleton className="p-0" />
        </div>
      </div>
    </PageContainer>
  )
}

function RoomListInlineError() {
  return (
    <RouteStateErrorPanel
      title="房源管理"
      message="房源列表暂时不可用，请稍后重试。"
      retryLabel="重新加载房源"
    />
  )
}

function RoomListRouteContent({ data }: { data: RoomListRouteData }) {
  const navigate = useNavigate()

  return (
    <RoomListPage
      initialRooms={data.rooms}
      initialSearchQuery={data.initialSearchQuery}
      onOpenRoom={(room) =>
        navigateToMinixOrDocument(navigate, `/rooms/${room.id}`)
      }
    />
  )
}

export function RoomListRoute() {
  const { pageData } = useLoaderData() as RoomListLoaderPayload

  return (
    <Suspense fallback={<RoomListPending />}>
      <Await resolve={pageData} errorElement={<RoomListInlineError />}>
        {(data) => <RoomListRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function RoomListRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="房源管理"
      fallbackMessage="房源列表暂时不可用，请稍后重试。"
      retryLabel="重新加载房源"
    />
  )
}
