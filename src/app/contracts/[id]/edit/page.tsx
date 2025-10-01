import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { contractQueries } from '@/lib/queries'
import { EditContractPageSimple } from '@/components/pages/EditContractPageSimple'

interface EditContractPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: '编辑合同',
  description: '编辑租赁合同签约信息',
}

export default async function EditContractRoute({
  params,
}: EditContractPageProps) {
  const { id } = await params

  try {
    // 获取合同详情
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
      bills:
        contract.bills?.map((bill) => ({
          ...bill,
          amount: Number(bill.amount),
          receivedAmount: Number(bill.receivedAmount),
          pendingAmount: Number(bill.pendingAmount),
        })) || [],
    }

    return <EditContractPageSimple contract={contractData} />
  } catch (error) {
    console.error('Failed to load contract for editing:', error)
    notFound()
  }
}
