import { useAsyncError } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'

import {
  normalizeRouteErrorMessage,
  RouteStateErrorPanel,
} from '../RouteStateBoundary'

type ContractPendingVariant = 'detail' | 'form' | 'flow'

interface ContractRoutePendingProps {
  title: string
  variant: ContractPendingVariant
}

interface ContractRouteInlineErrorProps {
  title: string
  message: string
  retryLabel: string
}

function getPendingBlocks(variant: ContractPendingVariant) {
  switch (variant) {
    case 'detail':
      return ['h-24', 'h-72', 'h-56']
    case 'flow':
      return ['h-28', 'h-64', 'h-80']
    case 'form':
    default:
      return ['h-24', 'h-44', 'h-[30rem]']
  }
}

export function ContractRoutePending({
  title,
  variant,
}: ContractRoutePendingProps) {
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

export function ContractRouteInlineError({
  title,
  message,
  retryLabel,
}: ContractRouteInlineErrorProps) {
  const routeError = useAsyncError()

  return (
    <RouteStateErrorPanel
      title={title}
      message={normalizeRouteErrorMessage(routeError, message)}
      retryLabel={retryLabel}
    />
  )
}
