'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// 导入业务组件
import { RoomCard, CompactRoomCard, RoomCardSkeleton } from '@/components/business/room-card'
import { BillCard, CompactBillCard, BillCardSkeleton } from '@/components/business/bill-card'
import { ContractCard, CompactContractCard, ContractCardSkeleton, ContractList } from '@/components/business/contract-card'
import { DashboardStats, SimpleDashboardStats, StatCard, DashboardStatsSkeleton } from '@/components/business/dashboard-stats'
import { RoomGrid, RoomStatusFilter, RoomGridSkeleton } from '@/components/business/room-grid'
import { FunctionGrid, defaultFunctionItems, FunctionGridSkeleton } from '@/components/business/function-grid'
import { AdvancedForm, sampleFormSections } from '@/components/business/advanced-form'
import { DataList } from '@/components/business/data-list'
import { FacilitySelector, defaultFacilityCategories } from '@/components/business/facility-selector'
import { AmountSummary, SimpleAmountSummary, AmountStatCard } from '@/components/business/amount-summary'
import { ContractDetail, ContractDetailSkeleton } from '@/components/business/contract-detail'
import { DashboardHome, DashboardHomeSkeleton, defaultQuickActions, defaultAlerts } from '@/components/business/dashboard-home'

// 导入UI组件
import { StatusBadge, RoomStatusBadge, BillStatusBadge, ContractStatusBadge } from '@/components/ui/status-badge'
import { TouchButton, TouchCard, TouchIconButton } from '@/components/ui/touch-button'
import { MobileForm, MobileInput, MobileTextarea, MobileSelect, MobileFormActions } from '@/components/ui/mobile-form'

// 创建简化的模拟数据，避免Prisma客户端在浏览器端的问题
const createMockRoom = (overrides = {}) => ({
  id: '1',
  roomNumber: '101',
  floorNumber: 1,
  buildingId: '1',
  roomType: 'SINGLE' as const,
  area: 25,
  rent: 2500, // 使用普通数字而不是Decimal
  status: 'OCCUPIED' as const,
  currentRenter: '张三',
  overdueDays: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  building: {
    id: '1',
    name: '阳光小区A栋',
    address: '北京市朝阳区',
    totalRooms: 36,
    description: '现代化公寓楼',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  ...overrides
})

const createMockBill = (overrides = {}) => ({
  id: '1',
  billNumber: 'B202401001',
  type: 'RENT' as const,
  amount: 2500, // 使用普通数字
  receivedAmount: 0,
  pendingAmount: 2500,
  dueDate: new Date('2024-02-01'),
  paidDate: null,
  period: '2024年1月',
  status: 'PENDING' as const,
  contractId: '1',
  paymentMethod: null,
  operator: null,
  remarks: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  contract: {
    id: '1',
    contractNumber: 'C202401001',
    roomId: '1',
    renterId: '1',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    isExtended: false,
    monthlyRent: 2500, // 使用普通数字
    totalRent: 30000,
    deposit: 2500,
    keyDeposit: 100,
    cleaningFee: 200,
    status: 'ACTIVE' as const,
    businessStatus: null,
    paymentMethod: '月付',
    paymentTiming: '每月1号',
    signedBy: null,
    signedDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    room: createMockRoom(),
    renter: {
      id: '1',
      name: '张三',
      gender: '男',
      phone: '13800138001',
      idCard: '110101199001011001',
      emergencyContact: '李四',
      emergencyPhone: '13800138002',
      occupation: '软件工程师',
      company: '科技公司',
      moveInDate: new Date('2024-01-01'),
      tenantCount: 1,
      remarks: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    bills: []
  },
  ...overrides
})

const mockRoom = createMockRoom()
const mockBill = createMockBill()
// 创建多个不同的合同数据，确保每个都有唯一的ID
const createMockContracts = () => [
  {
    ...mockBill.contract,
    id: 'contract-1',
    contractNumber: 'C202401001',
    bills: [mockBill]
  },
  {
    ...mockBill.contract,
    id: 'contract-2',
    contractNumber: 'C202401002',
    status: 'EXPIRED' as const,
    endDate: new Date('2023-12-31'),
    renter: {
      ...mockBill.contract.renter,
      id: 'renter-2',
      name: '李四'
    },
    bills: []
  },
  {
    ...mockBill.contract,
    id: 'contract-3',
    contractNumber: 'C202401003',
    status: 'PENDING' as const,
    renter: {
      ...mockBill.contract.renter,
      id: 'renter-3',
      name: '王五'
    },
    bills: []
  }
]

const mockContract = {
  ...mockBill.contract,
  bills: [mockBill]
}

const mockContracts = createMockContracts()

const mockStats = {
  pendingReceivables: 15000,
  pendingPayables: 8000,
  todayStats: {
    receivables: 3,
    payables: 1
  },
  monthlyStats: {
    receivables: 25,
    payables: 8
  }
}

const mockRooms = Array.from({ length: 12 }, (_, i) => 
  createMockRoom({
    id: `room-${i + 1}`,
    roomNumber: `${Math.floor(i / 6) + 1}0${(i % 6) + 1}`,
    floorNumber: Math.floor(i / 6) + 1,
    status: ['VACANT', 'OCCUPIED', 'OVERDUE', 'MAINTENANCE'][i % 4],
    currentRenter: i % 2 === 0 ? `租客${i + 1}` : null,
    // 使用固定的逾期天数而不是随机数，确保服务端和客户端一致
    overdueDays: i % 4 === 2 ? (i * 3 + 5) : 0, // 固定算法：5, 8, 11, 14, 17, 20天等
    rent: 2000 + (i * 100)
  })
)

export default function ComponentsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])

  const statusCounts = mockRooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const filteredRooms = selectedStatus 
    ? mockRooms.filter(room => room.status === selectedStatus)
    : mockRooms

  const toggleLoading = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  // 模拟数据列表
  const sampleDataColumns = [
    { key: 'roomNumber', title: '房间号', sortable: true },
    { key: 'status', title: '状态', filterable: true },
    { key: 'rent', title: '租金', sortable: true, render: (value: number) => `¥${value}` },
    { key: 'currentRenter', title: '租客', render: (value: string) => value || '-' }
  ]

  // 模拟金额汇总数据
  const amountSections = [
    {
      id: 'receivables',
      title: '应收款项',
      showTotal: true,
      items: [
        { id: 'rent', label: '租金收入', amount: 280346, count: 12, status: 'positive' as const },
        { id: 'deposit', label: '押金收入', amount: 15000, count: 3, status: 'positive' as const },
        { id: 'utilities', label: '水电费', amount: 2500, count: 8, status: 'positive' as const }
      ]
    },
    {
      id: 'payables',
      title: '应付款项',
      showTotal: true,
      items: [
        { id: 'maintenance', label: '维修费用', amount: -3200, count: 2, status: 'negative' as const },
        { id: 'management', label: '管理费用', amount: -1500, count: 1, status: 'negative' as const }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航区域 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Rento 组件库展示</h1>
            <p className="text-gray-600 text-sm mb-4">基础组件库的各种组件展示和测试</p>
            <Button onClick={toggleLoading} size="sm" className="bg-blue-600 hover:bg-blue-700">
              {loading ? '加载中...' : '测试加载状态'}
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

      {/* 状态标识组件 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">状态标识组件</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">StatusBadge 组件</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">房间状态</h4>
              <div className="flex flex-wrap gap-2">
                <RoomStatusBadge status="VACANT" />
                <RoomStatusBadge status="OCCUPIED" />
                <RoomStatusBadge status="OVERDUE" />
                <RoomStatusBadge status="MAINTENANCE" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">账单状态</h4>
              <div className="flex flex-wrap gap-2">
                <BillStatusBadge status="PENDING" />
                <BillStatusBadge status="PAID" />
                <BillStatusBadge status="OVERDUE" />
                <BillStatusBadge status="COMPLETED" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">合同状态</h4>
              <div className="flex flex-wrap gap-2">
                <ContractStatusBadge status="ACTIVE" />
                <ContractStatusBadge status="EXPIRED" />
                <ContractStatusBadge status="PENDING" />
                <ContractStatusBadge status="TERMINATED" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 卡片组件 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">卡片组件</h2>
        
        <div className="space-y-6">
          {/* 房间卡片 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">房间卡片</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading ? (
                <>
                  <RoomCardSkeleton />
                  <RoomCardSkeleton compact />
                  <RoomCardSkeleton />
                </>
              ) : (
                <>
                  <RoomCard room={mockRoom as any} onClick={() => alert('房间卡片点击')} />
                  <CompactRoomCard room={mockRoom as any} onClick={() => alert('紧凑房间卡片点击')} />
                  <RoomCard room={createMockRoom({ 
                    status: 'OVERDUE', 
                    overdueDays: 15,
                    rent: 2800
                  }) as any} />
                </>
              )}
            </div>
          </div>

          {/* 账单卡片 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">账单卡片</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading ? (
                <>
                  <BillCardSkeleton />
                  <BillCardSkeleton compact />
                  <BillCardSkeleton />
                </>
              ) : (
                <>
                  <BillCard bill={mockBill as any} onClick={() => alert('账单卡片点击')} />
                  <CompactBillCard bill={mockBill as any} onClick={() => alert('紧凑账单卡片点击')} />
                  <BillCard bill={createMockBill({ 
                    status: 'OVERDUE',
                    amount: 3000,
                    pendingAmount: 3000
                  }) as any} />
                </>
              )}
            </div>
          </div>

          {/* 合同卡片 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">合同卡片</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading ? (
                <>
                  <ContractCardSkeleton />
                  <ContractCardSkeleton compact />
                  <ContractCardSkeleton summary />
                </>
              ) : (
                <>
                  <ContractCard contract={mockContract as any} onClick={() => alert('合同卡片点击')} />
                  <CompactContractCard contract={mockContract as any} onClick={() => alert('紧凑合同卡片点击')} />
                  <ContractCard contract={{
                    ...mockContract, 
                    status: 'EXPIRED',
                    endDate: new Date('2023-12-31')
                  } as any} />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 统计面板 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">统计面板</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">完整统计面板</h3>
            {loading ? (
              <DashboardStatsSkeleton />
            ) : (
              <DashboardStats stats={mockStats} />
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">简化统计面板</h3>
            {loading ? (
              <DashboardStatsSkeleton simple />
            ) : (
              <SimpleDashboardStats stats={mockStats} />
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">单个统计卡片</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="待收金额" value={15000} color="red" />
              <StatCard title="待付金额" value={8000} color="orange" />
              <StatCard title="今日收款" value="3笔" color="green" />
              <StatCard title="今日付款" value="1笔" color="blue" />
            </div>
          </div>
        </div>
      </section>

      {/* 房间网格 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">房间网格布局</h2>
        <div className="space-y-4">
          <RoomStatusFilter
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            statusCounts={statusCounts}
          />
          {loading ? (
            <RoomGridSkeleton />
          ) : (
            <RoomGrid
              rooms={filteredRooms as any}
              onRoomClick={(room) => alert(`点击房间: ${room.roomNumber}`)}
            />
          )}
        </div>
      </section>

      {/* 功能导航网格 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">功能导航网格</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">FunctionGrid 组件</h3>
          {loading ? (
            <FunctionGridSkeleton />
          ) : (
            <div className="max-w-sm mx-auto">
              <FunctionGrid
                items={defaultFunctionItems}
                columns={3}
              />
            </div>
          )}
        </div>
      </section>

      {/* 数据列表 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">数据列表组件</h2>
        <DataList
          data={mockRooms as any}
          columns={sampleDataColumns as any}
          title="房间列表"
          searchPlaceholder="搜索房间..."
          filters={[
            { key: 'status', label: '状态', value: '' },
            { key: 'floorNumber', label: '楼层', value: '' }
          ]}
          onRowClick={(room) => alert(`点击房间: ${room.roomNumber}`)}
        />
      </section>

      {/* 设施选择器 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">设施选择器</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">FacilitySelector 组件</h3>
          <FacilitySelector
            categories={defaultFacilityCategories}
            selectedFacilities={selectedFacilities}
            onChange={setSelectedFacilities}
            maxSelections={10}
          />
        </div>
      </section>

      {/* 金额汇总 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">金额汇总组件</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">完整金额汇总</h3>
            <AmountSummary
              sections={amountSections}
              title="收支明细"
              showGrandTotal={true}
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">简化金额汇总</h3>
            <SimpleAmountSummary
              items={amountSections[0].items}
              title="本月收入"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">金额统计卡片</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AmountStatCard
                title="总收入"
                amount={297846}
                count={23}
                trend={12.5}
                status="positive"
              />
              <AmountStatCard
                title="总支出"
                amount={4700}
                count={3}
                trend={-8.2}
                status="negative"
              />
              <AmountStatCard
                title="净收益"
                amount={293146}
                status="positive"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 触摸按钮 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">触摸按钮</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">TouchButton 组件</h3>
          <div className="flex flex-wrap gap-3">
            <TouchButton onClick={() => alert('默认按钮')}>
              默认按钮
            </TouchButton>
            <TouchButton variant="outline" onClick={() => alert('轮廓按钮')}>
              轮廓按钮
            </TouchButton>
            <TouchButton variant="secondary" onClick={() => alert('次要按钮')}>
              次要按钮
            </TouchButton>
            <TouchIconButton onClick={() => alert('图标按钮')}>
              ⚙️
            </TouchIconButton>
          </div>
        </div>
      </section>

      {/* 生产级页面组件 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">生产级页面组件</h2>
        
        <div className="space-y-6">
          {/* 合同详情页面 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">合同详情页面</h3>
            {loading ? (
              <ContractDetailSkeleton />
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <ContractDetail
                  contract={mockContract as any}
                  onEdit={() => alert('编辑合同')}
                  onRenew={() => alert('续租合同')}
                  onTerminate={() => alert('终止合同')}
                  onViewPDF={() => alert('查看PDF')}
                />
              </div>
            )}
          </div>

          {/* 合同列表 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">合同列表</h3>
            <ContractList
              contracts={mockContracts as any}
              onContractClick={(contract) => alert(`查看合同: ${contract.contractNumber}`)}
              onInviteBinding={(contract) => alert(`邀请绑定: ${contract.renter.name}`)}
            />
          </div>

          {/* 主页仪表板 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">主页仪表板</h3>
            {loading ? (
              <DashboardHomeSkeleton />
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <DashboardHome
                  stats={{
                    pendingReceivables: 0.01,
                    pendingPayables: 0,
                    todayReceivables: 0,
                    todayPayables: 0,
                    monthlyReceivables: 0,
                    monthlyPayables: 0
                  }}
                  alerts={defaultAlerts}
                  quickActions={defaultQuickActions}
                />
              </div>
            )}
          </div>

          {/* 房间管理 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">房间管理</h3>
            {loading ? (
              <RoomGridSkeleton />
            ) : (
              <RoomGrid
                rooms={mockRooms as any}
                onRoomClick={(room) => alert(`查看房间: ${room.roomNumber}`)}
              />
            )}
          </div>
        </div>
      </section>

      {/* 移动端表单 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">移动端表单</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">MobileForm 组件</h3>
          <MobileForm>
            <MobileInput
              label="房间号"
              placeholder="请输入房间号"
              required
            />
            <MobileInput
              label="租金"
              type="number"
              placeholder="请输入租金"
              description="单位：元/月"
            />
            <MobileSelect
              label="房间状态"
              options={[
                { value: 'VACANT', label: '空房' },
                { value: 'OCCUPIED', label: '在租' },
                { value: 'OVERDUE', label: '逾期' },
                { value: 'MAINTENANCE', label: '维护' }
              ]}
              required
            />
            <MobileTextarea
              label="备注"
              placeholder="请输入备注信息"
              rows={3}
            />
            <MobileFormActions>
              <Button variant="outline">取消</Button>
              <Button>保存</Button>
            </MobileFormActions>
          </MobileForm>
        </div>
      </section>
    </div>
  </div>
  )
}