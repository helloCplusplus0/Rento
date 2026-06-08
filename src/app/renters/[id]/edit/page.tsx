import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RenterEditPage } from '@/components/pages/RenterEditPage'
import { loadLegacyRenterDetailPageData } from '../../../../../server/lib/legacy-next-page-data'

interface RenterEditPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: RenterEditPageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const renter = await loadLegacyRenterDetailPageData(id)
    return {
      title: `编辑 ${renter?.name || '租客'}`,
      description: `编辑 ${renter?.name || '租客'} 的详细信息`,
    }
  } catch {
    return {
      title: '编辑租客',
      description: '编辑租客的详细信息',
    }
  }
}

export default async function RenterEditRoute({ params }: RenterEditPageProps) {
  const { id } = await params

  try {
    const renter = await loadLegacyRenterDetailPageData(id)

    if (!renter) {
      notFound()
    }

    return <RenterEditPage renter={renter} />
  } catch (error) {
    console.error('Failed to load renter for edit:', error)
    notFound()
  }
}
