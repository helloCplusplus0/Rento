import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageContainer } from '@/components/layout'
import { RoomListPage } from '@/components/pages/RoomListPage'
import { roomQueries } from '@/lib/queries'

export const metadata: Metadata = {
  title: '房源管理',
  description: '管理公寓房源信息，查看房间状态和租客信息'
}

/**
 * 房间列表页面加载骨架屏
 */
function RoomListPageSkeleton() {
  return (
    <PageContainer title="房源管理" showBackButton>
      <div className="space-y-6 pb-6">
        {/* 搜索栏骨架 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* 筛选栏骨架 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* 房间网格骨架 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="space-y-6">
            {[1, 2].map(floor => (
              <div key={floor} className="space-y-3">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[1, 2, 3, 4, 5, 6].map(room => (
                    <div key={room} className="h-24 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

/**
 * 房源管理页面
 * 展示房间列表、状态管理和租客信息
 */
export default async function RoomsPage() {
  // 获取房间数据（包含合同信息）
  const rawRooms = await roomQueries.findAll()
  
  // 转换 Decimal 类型为 number，确保可以传递给客户端组件
  const rooms = rawRooms.map(room => ({
    ...room,
    rent: Number(room.rent),
    area: room.area ? Number(room.area) : null,
    building: {
      ...room.building,
      totalRooms: Number(room.building.totalRooms)
    },
    // 转换合同中的 Decimal 字段
    contracts: room.contracts?.map(contract => ({
      ...contract,
      monthlyRent: Number(contract.monthlyRent),
      totalRent: Number(contract.totalRent),
      deposit: Number(contract.deposit),
      keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
      cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
    })) || []
  }))
  
  return (
    <Suspense fallback={<RoomListPageSkeleton />}>
      <RoomListPage initialRooms={rooms} />
    </Suspense>
  )
}