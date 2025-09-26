import { Suspense } from 'react'
import { PageContainer } from '@/components/layout'
import { BusinessFlowValidationPage } from '@/components/pages/BusinessFlowValidationPage'

export const metadata = {
  title: '核心业务流程验证',
  description: '验证Rento应用的核心业务流程完整性和数据一致性'
}

export default function BusinessFlowValidationRoute() {
  return (
    <PageContainer>
      <Suspense fallback={<div>加载验证控制台...</div>}>
        <BusinessFlowValidationPage />
      </Suspense>
    </PageContainer>
  )
}