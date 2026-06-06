import { AlertTriangle, RefreshCw } from 'lucide-react'
import {
  isRouteErrorResponse,
  Link,
  useRevalidator,
  useRouteError,
} from 'react-router-dom'

import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RouteStateErrorPanelProps {
  title: string
  message: string
  retryLabel?: string
}

interface RouteErrorBoundaryProps {
  title: string
  fallbackMessage: string
  retryLabel?: string
}

export function normalizeRouteErrorMessage(
  error: unknown,
  fallbackMessage: string
) {
  if (isRouteErrorResponse(error)) {
    return error.data?.toString() || error.statusText || fallbackMessage
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return fallbackMessage
}

export function RouteStateErrorPanel({
  title,
  message,
  retryLabel = '重新加载',
}: RouteStateErrorPanelProps) {
  const revalidator = useRevalidator()

  return (
    <PageContainer title={title} showBackButton>
      <Card className="border-red-200 bg-red-50/60">
        <CardHeader className="px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base text-red-900 sm:text-lg">
                {title}加载失败
              </CardTitle>
              <p className="text-sm leading-6 text-red-700">{message}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 px-4 pb-4 sm:px-6">
          <Button
            type="button"
            onClick={() => revalidator.revalidate()}
            disabled={revalidator.state === 'loading'}
          >
            <RefreshCw
              className={cn(
                'h-4 w-4',
                revalidator.state === 'loading' && 'animate-spin'
              )}
            />
            {retryLabel}
          </Button>
          <Button asChild variant="outline">
            <Link to="/">返回工作台</Link>
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

export function RouteStateErrorBoundary({
  title,
  fallbackMessage,
  retryLabel,
}: RouteErrorBoundaryProps) {
  const routeError = useRouteError()

  return (
    <RouteStateErrorPanel
      title={title}
      message={normalizeRouteErrorMessage(routeError, fallbackMessage)}
      retryLabel={retryLabel}
    />
  )
}
