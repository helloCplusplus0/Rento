import type { Metadata } from 'next'
import { ContractListPage } from '@/components/pages/ContractListPage'
import { contractQueries } from '@/lib/queries'

export const metadata: Metadata = {
  title: '合同管理',
  description: '管理租赁合同信息，跟踪合同状态和到期提醒'
}

export default async function ContractsPage() {
  try {
    // 获取合同数据和统计信息
    const [contracts, stats, expiryAlerts] = await Promise.all([
      contractQueries.findAll(),
      contractQueries.getContractStats(),
      contractQueries.getExpiryAlerts()
    ])
    
    // 转换数据类型
    const contractsData = contracts.map(contract => ({
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
          totalRooms: Number(contract.room.building.totalRooms)
        }
      },
      bills: contract.bills.map(bill => ({
        ...bill,
        amount: Number(bill.amount),
        receivedAmount: Number(bill.receivedAmount),
        pendingAmount: Number(bill.pendingAmount)
      }))
    }))
    
    return (
      <ContractListPage 
        initialContracts={contractsData} 
        initialStats={stats}
        initialExpiryAlerts={expiryAlerts}
      />
    )
  } catch (error) {
    console.error('Failed to load contracts:', error)
    return (
      <ContractListPage 
        initialContracts={[]} 
        initialStats={{
          totalCount: 0,
          activeCount: 0,
          expiredCount: 0,
          terminatedCount: 0,
          expiringSoonCount: 0,
          newThisMonth: 0,
          statusDistribution: { pending: 0, active: 0, expired: 0, terminated: 0 }
        }}
        initialExpiryAlerts={[]}
      />
    )
  }
}