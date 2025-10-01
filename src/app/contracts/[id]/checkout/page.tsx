import { notFound } from 'next/navigation'

import { contractQueries } from '@/lib/queries'
import { CheckoutContractPage } from '@/components/pages/CheckoutContractPage'

interface CheckoutContractRouteProps {
  params: Promise<{ id: string }>
}

export default async function CheckoutContractRoute({
  params,
}: CheckoutContractRouteProps) {
  const { id } = await params

  try {
    const contract = await contractQueries.findById(id)

    if (!contract) {
      notFound()
    }

    // 检查合同状态，只有ACTIVE状态的合同才能退租
    // 但如果合同已经是TERMINATED状态，说明退租已完成，应该重定向到合同详情页
    if (contract.status !== 'ACTIVE') {
      if (contract.status === 'TERMINATED') {
        // 退租已完成，重定向到合同详情页而不是显示404
        const { redirect } = await import('next/navigation')
        redirect(`/contracts/${id}`)
      } else {
        notFound()
      }
    }

    // 转换数据类型以适配客户端组件
    const contractForClient = {
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

    return <CheckoutContractPage contract={contractForClient} />
  } catch (error) {
    console.error('Failed to load contract for checkout:', error)
    notFound()
  }
}

export async function generateMetadata({ params }: CheckoutContractRouteProps) {
  const { id } = await params

  try {
    const contract = await contractQueries.findById(id)

    if (!contract) {
      return {
        title: '合同不存在 | Rento',
      }
    }

    return {
      title: `退租 - ${contract.contractNumber} | Rento`,
      description: `退租合同 ${contract.contractNumber}，租客：${contract.renter.name}，房间：${contract.room.building.name}${contract.room.roomNumber}`,
    }
  } catch (error) {
    return {
      title: '退租合同 | Rento',
    }
  }
}
