import type { Metadata } from 'next'

import { DataConsistencyManager } from '@/components/business/DataConsistencyManager'
import { PageContainer } from '@/components/layout/PageContainer'

export const metadata: Metadata = {
  title: '数据一致性管理',
  description: '检查和修复系统数据一致性问题，确保数据完整性和准确性',
}

/**
 * 数据一致性管理页面
 * 提供数据一致性检查和修复功能
 */
export default function DataConsistencyPage() {
  return (
    <PageContainer title="数据一致性管理">
      <DataConsistencyManager />
    </PageContainer>
  )
}
