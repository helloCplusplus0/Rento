'use client'

import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showBackButton?: boolean
  className?: string
  loading?: boolean
  error?: string
  actions?: React.ReactNode
}

/**
 * 页面容器组件
 * 提供页面级的布局、标题、返回按钮、加载状态等功能
 */
export function PageContainer({
  children,
  title,
  subtitle,
  showBackButton = false,
  className,
  loading = false,
  error,
  actions,
}: PageContainerProps) {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div
        className={cn(
          'flex min-h-screen items-center justify-center bg-gray-50',
          className
        )}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex min-h-screen items-center justify-center bg-gray-50',
          className
        )}
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">出错了</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* 页面头部 */}
      {(title || showBackButton || actions) && (
        <div className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="container-mobile sm:container-tablet lg:container-desktop">
            <div className="flex h-14 items-center justify-between sm:h-16">
              {/* 左侧：返回按钮和标题 */}
              <div className="flex items-center space-x-3">
                {showBackButton && (
                  <button
                    onClick={handleBack}
                    className="-ml-2 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    aria-label="返回"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                )}

                {title && (
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 右侧：操作按钮 */}
              {actions && (
                <div className="flex items-center space-x-2">{actions}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 页面内容 */}
      <main className="container-mobile sm:container-tablet lg:container-desktop py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}

/**
 * 页面容器骨架屏
 */
export function PageContainerSkeleton({
  showHeader = true,
  className,
}: {
  showHeader?: boolean
  className?: string
}) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {showHeader && (
        <div className="border-b border-gray-200 bg-white">
          <div className="container-mobile sm:container-tablet lg:container-desktop">
            <div className="flex h-14 items-center justify-between sm:h-16">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 animate-pulse rounded bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
                </div>
              </div>
              <div className="h-8 w-20 animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      )}

      <main className="container-mobile sm:container-tablet lg:container-desktop py-4 sm:py-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg bg-white p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
              <div className="h-20 w-full animate-pulse rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
