import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout'

interface RenewContractPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: '续约合同',
  description: '续约租赁合同'
}

export default async function RenewContractPage({ params }: RenewContractPageProps) {
  const { id } = await params
  
  return (
    <PageContainer title="续约合同" showBackButton>
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          续约合同功能
        </h2>
        <p className="text-gray-600 mb-6">
          此功能正在开发中，敬请期待
        </p>
        <div className="text-sm text-gray-500">
          合同ID: {id}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          预计在下个版本中提供完整的合同续约功能
        </div>
      </div>
    </PageContainer>
  )
}