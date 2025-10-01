import type { Metadata } from 'next'

import { contractQueries } from '@/lib/queries'
import { CreateBillPage } from '@/components/pages/CreateBillPage'

// 禁用静态生成，强制使用服务端渲染
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '创建账单 - Rento',
  description: '手动创建账单，处理特殊费用和临时账单',
}

/**
 * 创建账单页面路由
 * 获取活跃合同列表并传递给页面组件
 */
export default async function CreateBillRoute() {
  try {
    // 获取活跃合同列表
    const activeContracts = await contractQueries.findByStatus('ACTIVE')

    // 转换 Decimal 类型为 number，确保可以传递给客户端组件
    const contractsData = activeContracts.map((contract) => ({
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
    }))

    return <CreateBillPage contracts={contractsData} />
  } catch (error) {
    console.error('获取合同数据失败:', error)

    // 错误情况下传递空数组
    return <CreateBillPage contracts={[]} />
  }
}
