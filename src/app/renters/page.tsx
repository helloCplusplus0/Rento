import type { Metadata } from 'next'
import { RenterListPage } from '@/components/pages/RenterListPage'
import { renterQueries } from '@/lib/queries'

export const metadata: Metadata = {
  title: '租客管理',
  description: '管理租客信息，查看合同历史和账单记录'
}

export default async function RentersPage() {
  try {
    // 获取租客数据和统计信息
    const [renters, stats] = await Promise.all([
      renterQueries.findAll(),
      renterQueries.getRenterStats()
    ])
    
    // 转换数据类型
    const rentersData = renters.map(renter => ({
      ...renter,
      contracts: renter.contracts.map(contract => ({
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
        }
      }))
    }))
    
    return <RenterListPage initialRenters={rentersData} initialStats={stats} />
  } catch (error) {
    console.error('Failed to load renters:', error)
    return <RenterListPage 
      initialRenters={[]} 
      initialStats={{
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        newThisMonth: 0
      }} 
    />
  }
}