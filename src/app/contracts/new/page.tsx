import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout'

export const metadata: Metadata = {
  title: '新增合同',
  description: '创建新的租赁合同'
}

export default function NewContractPage() {
  return (
    <PageContainer title="新增合同" showBackButton>
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          新增合同功能
        </h2>
        <p className="text-gray-600 mb-6">
          此功能正在开发中，敬请期待
        </p>
        <div className="text-sm text-gray-500">
          预计在下个版本中提供完整的合同创建功能
        </div>
      </div>
    </PageContainer>
  )
}