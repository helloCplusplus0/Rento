import { Suspense } from 'react'

import { DashboardPageWithStats } from '@/components/pages/DashboardPageWithStats'

/**
 * 兼容入口：复用当前正式首页实现，避免旧版提醒装配路径继续并存。
 */
export async function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageWithStats />
    </Suspense>
  )
}
