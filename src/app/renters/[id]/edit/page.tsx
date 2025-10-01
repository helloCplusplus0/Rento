import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { renterQueries } from '@/lib/queries'
import { RenterEditPage } from '@/components/pages/RenterEditPage'

interface RenterEditPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: RenterEditPageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const renter = await renterQueries.findById(id)
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
    const renter = await renterQueries.findById(id)

    if (!renter) {
      notFound()
    }

    // 转换数据类型
    const renterData = {
      ...renter,
      contracts: renter.contracts.map((contract) => ({
        ...contract,
        monthlyRent: Number(contract.monthlyRent),
        totalRent: Number(contract.totalRent),
        deposit: Number(contract.deposit),
        keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
        cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
        room: {
          ...contract.room,
          rent: Number(contract.room.rent),
          area: contract.room.area ? Number(contract.room.area) : null,
          building: {
            ...contract.room.building,
            totalRooms: Number(contract.room.building.totalRooms),
          },
        },
        bills: contract.bills.map((bill) => ({
          ...bill,
          amount: Number(bill.amount),
          receivedAmount: Number(bill.receivedAmount),
          pendingAmount: Number(bill.pendingAmount),
        })),
      })),
    }

    return <RenterEditPage renter={renterData} />
  } catch (error) {
    console.error('Failed to load renter for edit:', error)
    notFound()
  }
}
