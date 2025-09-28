import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RenewContractPage } from '@/components/pages/RenewContractPage'
import { contractQueries } from '@/lib/queries'

interface RenewContractPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: '续约合同',
  description: '续约租赁合同'
}

export default async function RenewContractRoute({ params }: RenewContractPageProps) {
  const { id } = await params
  
  // 验证合同是否存在
  try {
    const contract = await contractQueries.findById(id)
    if (!contract) {
      notFound()
    }
  } catch (error) {
    notFound()
  }
  
  return <RenewContractPage contractId={id} />
}