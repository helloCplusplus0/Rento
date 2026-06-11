import type { Metadata } from 'next'

import { globalSettings } from '@/lib/global-settings'
import { DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS } from '@/lib/contract-alert-semantics'
import { billQueries } from '@/lib/queries'
import { BillListPage } from '@/components/pages/BillListPage'

// 禁用静态生成，强制使用服务端渲染
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '账单管理',
  description: '管理和查看所有账单信息',
}

export default async function BillsPage() {
  try {
    const [bills, contractAlertSettingsLoadResult] = await Promise.all([
      billQueries.findAll(),
      globalSettings.getContractAlertSettings(),
    ])
    const contractExpiryAlertDays =
      contractAlertSettingsLoadResult.settings.contractExpiryAlertDays

    // 转换 Decimal 类型为 number
    const billsData = bills.map((bill) => ({
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
      contract: {
        ...bill.contract,
        monthlyRent: Number(bill.contract.monthlyRent),
        totalRent: Number(bill.contract.totalRent),
        deposit: Number(bill.contract.deposit),
        keyDeposit: bill.contract.keyDeposit
          ? Number(bill.contract.keyDeposit)
          : null,
        cleaningFee: bill.contract.cleaningFee
          ? Number(bill.contract.cleaningFee)
          : null,
        room: {
          ...bill.contract.room,
          rent: Number(bill.contract.room.rent),
          area: bill.contract.room.area
            ? Number(bill.contract.room.area)
            : null,
          building: {
            ...bill.contract.room.building,
            totalRooms: Number(bill.contract.room.building.totalRooms),
          },
        },
      },
    }))

    return (
      <BillListPage
        initialBills={billsData}
        contractExpiryAlertDays={contractExpiryAlertDays}
      />
    )
  } catch (error) {
    console.error('Failed to load bills:', error)
    return (
      <BillListPage
        initialBills={[]}
        contractExpiryAlertDays={DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS}
      />
    )
  }
}
