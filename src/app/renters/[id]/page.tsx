import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RenterDetailPage } from '@/components/pages/RenterDetailPage'
import { loadLegacyRenterDetailPageData } from '../../../../server/lib/legacy-next-page-data'

interface RenterDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: RenterDetailPageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const renter = await loadLegacyRenterDetailPageData(id)
    return {
      title: `${renter?.name || '租客'} - 详情`,
      description: `查看 ${renter?.name || '租客'} 的详细信息、合同历史和账单记录`,
    }
  } catch {
    return {
      title: '租客详情',
      description: '查看租客的详细信息',
    }
  }
}

export default async function RenterDetailRoute({
  params,
}: RenterDetailPageProps) {
  const { id } = await params

  try {
    const renter = await loadLegacyRenterDetailPageData(id)

    if (!renter) {
      notFound()
    }

    return <RenterDetailPage renter={renter} />
  } catch (error) {
    console.error('Failed to load renter:', error)
    notFound()
  }
}
