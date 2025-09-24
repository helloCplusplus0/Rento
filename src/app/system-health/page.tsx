/**
 * 系统健康监控页面
 * 提供系统健康状态的实时监控和管理
 */

import { AppLayout } from '@/components/layout'
import { SystemHealthDashboard } from '@/components/business/SystemHealthDashboard'

export default function SystemHealthPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <SystemHealthDashboard />
      </div>
    </AppLayout>
  )
}

export const metadata = {
  title: '系统健康监控 - Rento',
  description: '实时监控系统健康状态，包括数据库连接、账单系统、数据一致性等关键指标'
}