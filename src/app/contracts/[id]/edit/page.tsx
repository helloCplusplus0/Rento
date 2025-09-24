import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout'

interface EditContractPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: '编辑合同',
  description: '编辑租赁合同信息'
}

export default async function EditContractPage({ params }: EditContractPageProps) {
  const { id } = await params
  
  return (
    <PageContainer title="编辑合同" showBackButton>
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          编辑合同功能
        </h2>
        <p className="text-gray-600 mb-6">
          此功能正在开发中，敬请期待
        </p>
        <div className="text-sm text-gray-500">
          合同ID: {id}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          预计在下个版本中提供完整的合同编辑功能
        </div>
      </div>
    </PageContainer>
  )
}