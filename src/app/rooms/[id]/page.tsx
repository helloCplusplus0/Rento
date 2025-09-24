import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RoomDetailPage } from '@/components/pages/RoomDetailPage'
import { roomQueries } from '@/lib/queries'

interface RoomDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: RoomDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const room = await roomQueries.findById(id)
  
  if (!room) {
    return {
      title: '房间未找到',
      description: '请求的房间不存在'
    }
  }
  
  return {
    title: `房间 ${room.roomNumber} - ${room.building.name}`,
    description: `查看房间 ${room.roomNumber} 的详细信息，包括租客信息、合同状态等`
  }
}

/**
 * 房间详情页面
 * 显示房间的完整信息，包括基本信息、租客信息、合同信息等
 */
export default async function RoomDetail({ params }: RoomDetailPageProps) {
  const { id } = await params
  const room = await roomQueries.findById(id)
  
  if (!room) {
    notFound()
  }
  
  // 转换 Decimal 类型为 number，确保可以传递给客户端组件
  const roomData = {
    ...room,
    rent: Number(room.rent),
    area: room.area ? Number(room.area) : null,
    building: {
      ...room.building,
      totalRooms: Number(room.building.totalRooms)
    },
    contracts: room.contracts?.map(contract => ({
      ...contract,
      monthlyRent: Number(contract.monthlyRent),
      totalRent: Number(contract.totalRent),
      deposit: Number(contract.deposit),
      keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
      cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
      // 转换账单数据中的 Decimal 字段
      bills: contract.bills?.map(bill => ({
        ...bill,
        amount: Number(bill.amount),
        receivedAmount: Number(bill.receivedAmount),
        pendingAmount: Number(bill.pendingAmount),
      })) || []
    })) || []
  }
  
  return <RoomDetailPage room={roomData} />
}