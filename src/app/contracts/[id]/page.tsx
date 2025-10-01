import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { contractQueries } from '@/lib/queries'
import { ContractDetailPage } from '@/components/pages/ContractDetailPage'

interface ContractDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: ContractDetailPageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const contract = await contractQueries.findById(id)
    return {
      title: `${contract?.contractNumber || '合同'} - 详情`,
      description: `查看 ${contract?.contractNumber || '合同'} 的详细信息、租客信息和账单记录`,
    }
  } catch {
    return {
      title: '合同详情',
      description: '查看合同的详细信息',
    }
  }
}

export default async function ContractDetailRoute({
  params,
}: ContractDetailPageProps) {
  const { id } = await params

  try {
    const contract = await contractQueries.findById(id)

    if (!contract) {
      notFound()
    }

    // 转换数据类型
    const contractData = {
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
    }

    return <ContractDetailPage contract={contractData} />
  } catch (error) {
    console.error('Failed to load contract:', error)
    notFound()
  }
}
