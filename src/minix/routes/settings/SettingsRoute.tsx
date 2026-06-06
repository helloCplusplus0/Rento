import { Suspense } from 'react'
import { Await, defer, useLoaderData } from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'

import { settingsMobileStyles } from '@/components/business/settings-mobile-styles'
import { PageContainer } from '@/components/layout/PageContainer'
import { SettingsPage } from '@/components/pages/SettingsPage'
import { Card, CardContent } from '@/components/ui/card'

import {
  loadSettingsRouteData,
  type SettingsRouteData,
} from '../../lib/primary-route-data'
import { openDocumentPath } from '../../lib/route-navigation'
import {
  RouteStateErrorBoundary,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

interface SettingsLoaderPayload {
  pageData: Promise<SettingsRouteData>
}

export function settingsLoader({ request }: LoaderFunctionArgs) {
  return defer({
    pageData: loadSettingsRouteData({ signal: request.signal }),
  })
}

function SettingsPending() {
  return (
    <PageContainer title="设置" showBackButton>
      <div className={settingsMobileStyles.pageSection}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className={settingsMobileStyles.card}>
            <CardContent className={settingsMobileStyles.cardContent}>
              <div className="space-y-3">
                <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-20 animate-pulse rounded bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}

function SettingsInlineError() {
  return (
    <RouteStateErrorPanel
      title="设置"
      message="设置页暂时不可用，请稍后重试。"
      retryLabel="重新加载设置"
    />
  )
}

function SettingsRouteContent({ data }: { data: SettingsRouteData }) {
  return (
    <SettingsPage
      initialSettings={data.settings}
      appVersion={import.meta.env.VITE_APP_VERSION || '未配置版本号'}
      onOpenUtilityPage={(path) => openDocumentPath(path, '_blank')}
    />
  )
}

export function SettingsRoute() {
  const { pageData } = useLoaderData() as SettingsLoaderPayload

  return (
    <Suspense fallback={<SettingsPending />}>
      <Await resolve={pageData} errorElement={<SettingsInlineError />}>
        {(data) => <SettingsRouteContent data={data} />}
      </Await>
    </Suspense>
  )
}

export function SettingsRouteErrorBoundary() {
  return (
    <RouteStateErrorBoundary
      title="设置"
      fallbackMessage="设置页暂时不可用，请稍后重试。"
      retryLabel="重新加载设置"
    />
  )
}
