import { notFound } from 'next/navigation'
import { billQueries } from '@/lib/queries'
import { EditBillPage } from '@/components/pages/EditBillPage'

interface EditBillPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBill({ params }: EditBillPageProps) {
  const { id } = await params
  
  try {
    const bill = await billQueries.findById(id)
    
    if (!bill) {
      notFound()
    }

    // 转换 Decimal 类型为 number，确保前端正确处理
    const billData = {
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
      contract: {
        ...bill.contract,
        monthlyRent: Number(bill.contract.monthlyRent),
        totalRent: Number(bill.contract.totalRent),
        deposit: Number(bill.contract.deposit),
        keyDeposit: bill.contract.keyDeposit ? Number(bill.contract.keyDeposit) : null,
        cleaningFee: bill.contract.cleaningFee ? Number(bill.contract.cleaningFee) : null,
        room: {
          ...bill.contract.room,
          rent: Number(bill.contract.room.rent),
          area: bill.contract.room.area ? Number(bill.contract.room.area) : null,
          building: {
            ...bill.contract.room.building,
            totalRooms: Number(bill.contract.room.building.totalRooms)
          }
        }
      }
    }

    return <EditBillPage bill={billData} />
  } catch (error) {
    console.error('Failed to load bill for editing:', error)
    notFound()
  }
}