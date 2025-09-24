import type { Metadata } from 'next'
import { CreateContractPage } from '@/components/pages/CreateContractPage'
import { renterQueries, roomQueries } from '@/lib/queries'

export const metadata: Metadata = {
  title: '创建合同',
  description: '新建租赁合同，设置租客信息和房间信息'
}

export default async function AddContractRoute() {
  try {
    // 获取租客和可用房间数据
    const [renters, availableRooms] = await Promise.all([
      renterQueries.findAll(),
      roomQueries.findByStatus('VACANT') // 只获取空闲房间
    ])
    
    // 转换数据类型 - 确保所有Decimal类型都转换为number
    const rentersData = renters.map(renter => ({
      ...renter,
      contracts: renter.contracts.map(contract => ({
        ...contract,
        monthlyRent: Number(contract.monthlyRent),
        totalRent: Number(contract.totalRent),
        deposit: Number(contract.deposit),
        keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
        cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
        room: contract.room ? {
          ...contract.room,
          rent: Number(contract.room.rent),
          area: contract.room.area ? Number(contract.room.area) : null,
          building: {
            ...contract.room.building,
            totalRooms: Number(contract.room.building.totalRooms)
          }
        } : undefined
      }))
    }))
    
    const roomsData = availableRooms.map(room => ({
      ...room,
      rent: Number(room.rent),
      area: room.area ? Number(room.area) : null,
      contracts: room.contracts.map(contract => ({
        ...contract,
        monthlyRent: Number(contract.monthlyRent),
        totalRent: Number(contract.totalRent),
        deposit: Number(contract.deposit),
        keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
        cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null
      })),
      building: {
        ...room.building,
        totalRooms: Number(room.building.totalRooms)
      }
    }))
    
    return (
      <CreateContractPage 
        renters={rentersData}
        availableRooms={roomsData}
      />
    )
  } catch (error) {
    console.error('Failed to load contract creation data:', error)
    return (
      <CreateContractPage 
        renters={[]}
        availableRooms={[]}
      />
    )
  }
}