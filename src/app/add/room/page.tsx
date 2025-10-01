import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AddRoomPage } from '@/components/pages/AddRoomPage'
import { buildingQueries } from '@/lib/queries'

// 禁用静态生成，强制使用服务端渲染
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '添加房间',
  description: '新增房间信息，支持楼栋管理和批量添加'
}

/**
 * 添加房间页面路由
 * 获取楼栋数据并传递给AddRoomPage组件
 */
export default async function AddRoom() {
  const buildings = await buildingQueries.findAll()
  
  // 转换Decimal类型为number，包括嵌套的房间数据
  const buildingsData = buildings.map(building => ({
    ...building,
    totalRooms: Number(building.totalRooms),
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
    <Suspense fallback={<div>加载中...</div>}>
      <AddRoomPage initialBuildings={buildingsData} />
    </Suspense>
  )
}