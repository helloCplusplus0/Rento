import { LoaderCircle } from 'lucide-react'

import { PageContainerSkeleton } from '@/components/layout'

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
      <PageContainerSkeleton />
    </div>
  )
}
