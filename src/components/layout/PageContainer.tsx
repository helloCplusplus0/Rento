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
  actions
}: PageContainerProps) {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className={cn('min-h-screen bg-gray-50 flex items-center justify-center', className)}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('min-h-screen bg-gray-50 flex items-center justify-center', className)}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">出错了</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="container-mobile sm:container-tablet lg:container-desktop">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* 左侧：返回按钮和标题 */}
              <div className="flex items-center space-x-3">
                {showBackButton && (
                  <button
                    onClick={handleBack}
                    className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    aria-label="返回"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                
                {title && (
                  <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-sm text-gray-600 mt-1">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 右侧：操作按钮 */}
              {actions && (
                <div className="flex items-center space-x-2">
                  {actions}
                </div>
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
  className 
}: { 
  showHeader?: boolean
  className?: string 
}) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {showHeader && (
        <div className="bg-white border-b border-gray-200">
          <div className="container-mobile sm:container-tablet lg:container-desktop">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      <main className="container-mobile sm:container-tablet lg:container-desktop py-4 sm:py-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 space-y-3">
              <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}