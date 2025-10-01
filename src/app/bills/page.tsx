import type { Metadata } from 'next'
import Link from 'next/link'
import { BillListPage } from '@/components/pages/BillListPage'
import { billQueries } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'

// 禁用静态生成，强制使用服务端渲染
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '账单管理',
  description: '管理和查看所有账单信息'
}

export default async function BillsPage() {
  try {
    // 获取所有账单数据
    const bills = await billQueries.findAll()
    
    // 转换 Decimal 类型为 number
    const billsData = bills.map(bill => ({
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
    }))
    
    return (
      <BillListPage initialBills={billsData} />
    )
  } catch (error) {
    console.error('Failed to load bills:', error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h2>
        <p className="text-gray-600 mb-4">无法加载账单数据，请稍后重试</p>
        <Button onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    )
  }
}