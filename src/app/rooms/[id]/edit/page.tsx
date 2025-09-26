import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EditRoomPage } from '@/components/pages/EditRoomPage'
import { roomQueries, buildingQueries } from '@/lib/queries'

interface EditRoomPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditRoomPageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    const room = await roomQueries.findById(id)
    return {
      title: `编辑房间 ${room?.roomNumber || ''}`,
      description: `编辑房间 ${room?.roomNumber || ''} 的基本信息`
    }
  } catch {
    return {
      title: '编辑房间',
      description: '编辑房间基本信息'
    }
  }
}

export default async function EditRoomRoute({ params }: EditRoomPageProps) {
  const { id } = await params
  
  try {
    // 获取房间详情和所有楼栋信息
    const [room, buildings] = await Promise.all([
      roomQueries.findById(id),
      buildingQueries.findAll()
    ])
    
    if (!room) {
      notFound()
    }
    
    // 转换数据类型
    const roomData = {
      ...room,
      rent: Number(room.rent),
      area: room.area ? Number(room.area) : null,
      building: {
        ...room.building,
        totalRooms: Number(room.building.totalRooms)
      },
      contracts: room.contracts.map(contract => ({
        ...contract,
        monthlyRent: Number(contract.monthlyRent),
        totalRent: Number(contract.totalRent),
        deposit: Number(contract.deposit),
        keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
        cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
        bills: contract.bills?.map(bill => ({
          ...bill,
          amount: Number(bill.amount),
          receivedAmount: Number(bill.receivedAmount),
          pendingAmount: Number(bill.pendingAmount)
        })) || []
      }))
    }
    
    const buildingsData = buildings.map(building => ({
      ...building,
      totalRooms: Number(building.totalRooms),
      // 转换嵌套的房间数据中的Decimal字段
      rooms: building.rooms.map(room => ({
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
        }))
      }))
    }))
    
    return (
      <EditRoomPage 
        room={roomData} 
        buildings={buildingsData}
      />
    )
  } catch (error) {
    console.error('Failed to load room data:', error)
    notFound()
  }
}