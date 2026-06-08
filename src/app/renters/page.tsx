import type { Metadata } from 'next'

import { RenterListPage } from '@/components/pages/RenterListPage'
import { loadLegacyRentersPageData } from '../../../server/lib/legacy-next-page-data'

// 禁用静态生成，强制使用服务端渲染
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '租客管理',
  description: '管理租客信息，查看合同历史和账单记录',
}

export default async function RentersPage() {
  try {
    const { renters, stats } = await loadLegacyRentersPageData()

    return <RenterListPage initialRenters={renters} initialStats={stats} />
  } catch (error) {
    console.error('Failed to load renters:', error)
    return (
      <RenterListPage
        initialRenters={[]}
        initialStats={{
          totalCount: 0,
          activeCount: 0,
          inactiveCount: 0,
          newThisMonth: 0,
        }}
      />
    )
  }
}
