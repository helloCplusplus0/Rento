import type { Metadata } from 'next'

import { PageContainer } from '@/components/layout'

export const metadata: Metadata = {
  title: '新增合同',
  description: '创建新的租赁合同',
}

export default function NewContractPage() {
  return (
    <PageContainer title="新增合同" showBackButton>
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-8 w-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          新增合同功能
        </h2>
        <p className="mb-6 text-gray-600">此功能正在开发中，敬请期待</p>
        <div className="text-sm text-gray-500">
          预计在下个版本中提供完整的合同创建功能
        </div>
      </div>
    </PageContainer>
  )
}
