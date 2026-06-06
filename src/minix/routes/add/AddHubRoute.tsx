import { Suspense } from 'react'
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
} from 'react-router-dom'

import { addPageMobileStyles } from '@/app/add/add-page-mobile-styles'
import { PageContainer } from '@/components/layout/PageContainer'
import { AddHubPage } from '@/components/pages/AddHubPage'
import { Card, CardContent } from '@/components/ui/card'

import { navigateToMinixOrDocument } from '../../lib/route-navigation'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface AddHubLoaderData {
  pageReady: Promise<null>
}

export function addHubLoader() {
  return defer({
    pageReady: Promise.resolve(null),
  })
}

function AddHubPending() {
  return (
    <PageContainer title="添加功能" showBackButton>
      <div className={addPageMobileStyles.pageSection}>
        <div className={addPageMobileStyles.grid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className={`${addPageMobileStyles.card} h-full`}>
              <CardContent className={addPageMobileStyles.cardContent}>
                <div className="h-20 animate-pulse rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}

function AddHubInlineError() {
  return (
    <RouteStateErrorPanel
      title="添加功能"
      message="添加入口暂时不可用，请稍后重试。"
      retryLabel="重新加载入口"
    />
  )
}

function AddHubRouteContent() {
  const navigate = useNavigate()

  return (
    <AddHubPage
      onNavigate={(href) => navigateToMinixOrDocument(navigate, href)}
    />
  )
}

export function AddHubRoute() {
  const { pageReady } = useLoaderData() as AddHubLoaderData

  return (
    <Suspense fallback={<AddHubPending />}>
      <Await resolve={pageReady} errorElement={<AddHubInlineError />}>
        {() => <AddHubRouteContent />}
      </Await>
    </Suspense>
  )
}

export function AddHubRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="添加功能"
      fallbackMessage="添加入口暂时不可用，请稍后重试。"
      retryLabel="重新加载入口"
    />
  )
}
