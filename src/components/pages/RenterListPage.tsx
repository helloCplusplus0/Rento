'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { RenterSearchBar } from '@/components/business/RenterSearchBar'
import { RenterStatsOverview } from '@/components/business/RenterStatsOverview'
import { RenterGrid } from '@/components/business/RenterGrid'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface RenterListPageProps {
  initialRenters: any[]
  initialStats: {
    totalCount: number
    activeCount: number
    inactiveCount: number
    newThisMonth: number
  }
}

export function RenterListPage({ initialRenters, initialStats }: RenterListPageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [contractStatusFilter, setContractStatusFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // 筛选租客数据
  const filteredRenters = useMemo(() => {
    return initialRenters.filter(renter => {
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!renter.name.toLowerCase().includes(query) &&
            !renter.phone.includes(query) &&
            !(renter.idCard?.toLowerCase().includes(query))) {
          return false
        }
      }
      
      // 合同状态筛选
      if (contractStatusFilter) {
        if (contractStatusFilter === 'active') {
          return renter.contracts.some((c: any) => c.status === 'ACTIVE')
        } else if (contractStatusFilter === 'inactive') {
          return !renter.contracts.some((c: any) => c.status === 'ACTIVE')
        }
      }
      
      return true
    })
  }, [initialRenters, searchQuery, contractStatusFilter])
  
  // 处理租客点击
  const handleRenterClick = (renter: any) => {
    router.push(`/renters/${renter.id}`)
  }
  
  // 处理编辑租客
  const handleRenterEdit = (renter: any) => {
    router.push(`/renters/${renter.id}/edit`)
  }
  
  // 处理删除租客
  const handleRenterDelete = async (renter: any) => {
    if (!confirm(`确定要删除租客 ${renter.name} 吗？`)) {
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/renters/${renter.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // 刷新页面数据
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || '删除失败')
      }
    } catch (error) {
      console.error('Delete renter error:', error)
      alert('删除失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  // 处理添加租客
  const handleAddRenter = () => {
    router.push('/renters/new')
  }
  
  return (
    <PageContainer 
      title="租客管理" 
      showBackButton
    >
      <div className="space-y-6 pb-6">
        {/* 搜索栏 */}
        <RenterSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          contractStatusFilter={contractStatusFilter}
          onContractStatusChange={setContractStatusFilter}
          loading={loading}
        />
        
        {/* 统计概览 */}
        <RenterStatsOverview stats={initialStats} />
        
        {/* 结果统计 */}
        {(searchQuery || contractStatusFilter) && (
          <div className="text-sm text-gray-600">
            找到 {filteredRenters.length} 个租客
            {searchQuery && ` (搜索: ${searchQuery})`}
            {contractStatusFilter && ` (状态: ${contractStatusFilter === 'active' ? '有活跃合同' : '无活跃合同'})`}
          </div>
        )}
        
        {/* 租客网格 */}
        <RenterGrid
          renters={filteredRenters}
          onRenterClick={handleRenterClick}
          loading={loading}
        />
      </div>
    </PageContainer>
  )
}