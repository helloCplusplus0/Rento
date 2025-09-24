import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BillDetailPage } from '@/components/pages/BillDetailPage'
import { billQueries } from '@/lib/queries'

interface BillDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: BillDetailPageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    const bill = await billQueries.findById(id)
    
    if (!bill) {
      return {
        title: '账单不存在',
        description: '请求的账单信息不存在'
      }
    }

    return {
      title: `账单详情 - ${bill.billNumber}`,
      description: `查看账单 ${bill.billNumber} 的详细信息和支付状态`
    }
  } catch (error) {
    return {
      title: '账单详情',
      description: '查看账单详细信息'
    }
  }
}

export default async function BillDetailPageRoute({ params }: BillDetailPageProps) {
  const { id } = await params
  
  try {
    const bill = await billQueries.findById(id)
    
    if (!bill) {
      notFound()
    }

    // 转换 Decimal 类型为 number，避免序列化问题
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
          area: bill.contract.room.area ? Number(bill.contract.room.area) : null
        }
      }
    }

    return <BillDetailPage bill={billData as any} />
  } catch (error) {
    console.error('Failed to fetch bill details:', error)
    notFound()
  }
}