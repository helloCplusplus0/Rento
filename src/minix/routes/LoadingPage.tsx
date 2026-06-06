import { LoaderCircle } from 'lucide-react'

import { StatusPageShell } from './StatusPageShell'

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden">
        <StatusPageShell
          badge="Loading"
          title="页面加载中"
          description="该页面用于承接 React Router 宿主中的最小 loading 路由，实际视觉骨架继续复用现有全局加载表达。"
          icon={<LoaderCircle className="h-6 w-6 animate-spin" />}
        />
      </div>
      <LoadingPageSkeleton />
    </div>
  )
}

function LoadingPageSkeleton() {
  return (
    <div className="min-h-app bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container-mobile sm:container-tablet lg:container-desktop">
          <div className="flex h-14 items-center justify-between sm:h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>

      <main className="page-safe-bottom container-mobile py-4 sm:container-tablet sm:py-6 lg:container-desktop">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-lg bg-white p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
