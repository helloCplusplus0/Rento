import { useAsyncError } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'

import {
  normalizeRouteErrorMessage,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

type MeterReadingPendingVariant = 'batch' | 'history'

interface MeterReadingRoutePendingProps {
  title: string
  variant: MeterReadingPendingVariant
}

interface MeterReadingRouteInlineErrorProps {
  title: string
  message: string
  retryLabel: string
}

function getPendingBlocks(variant: MeterReadingPendingVariant) {
  switch (variant) {
    case 'history':
      return ['h-12', 'h-32', 'h-24', 'h-48']
    case 'batch':
    default:
      return ['h-20', 'h-28', 'h-64', 'h-16']
  }
}

export function MeterReadingRoutePending({
  title,
  variant,
}: MeterReadingRoutePendingProps) {
  return (
    <PageContainer title={title} showBackButton>
      <div className="space-y-4">
        {getPendingBlocks(variant).map((blockClassName, index) => (
          <div
            key={`${variant}-${index}`}
            className={`animate-pulse rounded-2xl bg-gray-200 ${blockClassName}`}
          />
        ))}
      </div>
    </PageContainer>
  )
}

export function MeterReadingRouteInlineError({
  title,
  message,
  retryLabel,
}: MeterReadingRouteInlineErrorProps) {
  const routeError = useAsyncError()

  return (
    <RouteStateErrorPanel
      title={title}
      message={normalizeRouteErrorMessage(routeError, message)}
      retryLabel={retryLabel}
    />
  )
}
