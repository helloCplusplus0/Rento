import type { Metadata } from 'next'

import { CreateContractPage } from '@/components/pages/CreateContractPage'
import { loadLegacyContractCreatePageData } from '../../../../server/lib/legacy-next-page-data'

export const metadata: Metadata = {
  title: '创建合同',
  description: '新建租赁合同，设置租客信息和房间信息',
}

export default async function AddContractRoute({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string; renterId?: string }>
}) {
  const { roomId, renterId } = await searchParams

  try {
    const pageData = await loadLegacyContractCreatePageData({
      roomId,
      renterId,
    })

    return (
      <CreateContractPage
        renters={pageData.renters}
        availableRooms={pageData.availableRooms}
        preselectedRoomId={pageData.preselectedRoomId}
        preselectedRenterId={pageData.preselectedRenterId}
      />
    )
  } catch (error) {
    console.error('Failed to load contract creation data:', error)
    return (
      <CreateContractPage
        renters={[]}
        availableRooms={[]}
        preselectedRoomId={roomId}
        preselectedRenterId={renterId}
      />
    )
  }
}
