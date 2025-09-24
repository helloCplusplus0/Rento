import { AppLayout } from '@/components/layout'
import { DashboardPageWithStats } from '@/components/pages/DashboardPageWithStats'

/**
 * 应用首页
 * 展示增强的仪表板内容，包含统计卡片
 */
export default function HomePage() {
  return (
    <AppLayout>
      <DashboardPageWithStats />
    </AppLayout>
  )
}
