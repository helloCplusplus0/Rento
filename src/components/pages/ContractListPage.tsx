'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import type { ContractWithDetails } from '@/types/database'
import { Button } from '@/components/ui/button'
import { ContractExpiryAlert } from '@/components/business/ContractExpiryAlert'
import { ContractGrid } from '@/components/business/ContractGrid'
import { ContractSearchBar } from '@/components/business/ContractSearchBar'
import { ContractStatsOverview } from '@/components/business/ContractStatsOverview'
import { PageContainer } from '@/components/layout'

// 为客户端组件定义的合同类型（Decimal 转换为 number）
interface ContractWithDetailsForClient {
  id: string
  contractNumber: string
  roomId: string
  renterId: string
  startDate: Date
  endDate: Date
  isExtended: boolean
  monthlyRent: number
  totalRent: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  paymentMethod?: string | null
  paymentTiming?: string | null
  status: string
  businessStatus?: string | null
  signedBy?: string | null
  signedDate?: Date | null
  remarks?: string | null
  createdAt: Date
  updatedAt: Date
  room: {
    id: string
    roomNumber: string
    floorNumber: number
    buildingId: string
    roomType: string
    area: number | null
    rent: number
    status: string
    currentRenter?: string | null
    overdueDays?: number | null
    createdAt: Date
    updatedAt: Date
    building: {
      id: string
      name: string
      address: string | null
      totalRooms: number
      description: string | null
      createdAt: Date
      updatedAt: Date
    }
  }
  renter: {
    id: string
    name: string
    gender?: string | null
    phone: string
    idCard?: string | null
    emergencyContact?: string | null
    emergencyPhone?: string | null
    occupation?: string | null
    company?: string | null
    moveInDate?: Date | null
    tenantCount?: number | null
    remarks?: string | null
    createdAt: Date
    updatedAt: Date
  }
  bills: Array<{
    id: string
    billNumber: string
    type: string
    amount: number
    receivedAmount: number
    pendingAmount: number
    dueDate: Date
    paidDate?: Date | null
    period?: string | null
    status: string
    paymentMethod?: string | null
    operator?: string | null
    remarks?: string | null
    contractId: string
    createdAt: Date
    updatedAt: Date
  }>
}

interface ContractStats {
  totalCount: number
  activeCount: number
  expiredCount: number
  terminatedCount: number
  expiringSoonCount: number
  newThisMonth: number
  statusDistribution: {
    pending: number
    active: number
    expired: number
    terminated: number
  }
}

interface ContractExpiryAlert {
  id: string
  contractId: string
  contractNumber: string
  renterName: string
  roomInfo: string
  endDate: Date
  daysUntilExpiry: number
  alertType: 'warning' | 'danger' | 'expired'
}

interface ContractListPageProps {
  initialContracts: ContractWithDetailsForClient[]
  initialStats: ContractStats
  initialExpiryAlerts: ContractExpiryAlert[]
}

export function ContractListPage({
  initialContracts,
  initialStats,
  initialExpiryAlerts,
}: ContractListPageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 筛选合同数据
  const filteredContracts = useMemo(() => {
    return initialContracts.filter((contract) => {
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !contract.contractNumber.toLowerCase().includes(query) &&
          !contract.renter.name.toLowerCase().includes(query) &&
          !contract.room.roomNumber.toLowerCase().includes(query) &&
          !contract.room.building.name.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // 状态筛选
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'expiring_soon') {
          const daysUntilExpiry = Math.ceil(
            (contract.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          return (
            contract.status === 'ACTIVE' &&
            daysUntilExpiry <= 30 &&
            daysUntilExpiry > 0
          )
        } else {
          return contract.status === statusFilter
        }
      }

      return true
    })
  }, [initialContracts, searchQuery, statusFilter])

  // 处理合同点击
  const handleContractClick = (contract: ContractWithDetailsForClient) => {
    router.push(`/contracts/${contract.id}`)
  }

  // 处理添加合同
  const handleAddContract = () => {
    router.push('/contracts/new')
  }

  // 处理续约
  const handleRenewContract = (contractId: string) => {
    router.push(`/contracts/${contractId}/renew`)
  }

  return (
    <PageContainer
      title="合同管理"
      showBackButton
      actions={
        <Button onClick={handleAddContract} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          添加合同
        </Button>
      }
    >
      <div className="space-y-6 pb-6">
        {/* 搜索栏 */}
        <ContractSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          loading={loading}
        />

        {/* 统计概览 */}
        <ContractStatsOverview stats={initialStats} />

        {/* 结果统计 */}
        {(searchQuery || statusFilter) && (
          <div className="text-sm text-gray-600">
            找到 {filteredContracts.length} 个合同
            {searchQuery && ` (搜索: ${searchQuery})`}
            {statusFilter &&
              statusFilter !== 'all' &&
              ` (状态: ${getStatusLabel(statusFilter)})`}
          </div>
        )}

        {/* 合同网格 */}
        <ContractGrid
          contracts={filteredContracts}
          onContractClick={handleContractClick}
          loading={loading}
        />
      </div>
    </PageContainer>
  )
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '待生效',
    ACTIVE: '生效中',
    EXPIRED: '已到期',
    TERMINATED: '已终止',
    expiring_soon: '即将到期',
  }
  return labels[status] || status
}
