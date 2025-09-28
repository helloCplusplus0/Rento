'use client'

import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { RenterBasicInfo } from '@/components/business/RenterBasicInfo'
import { RenterContractHistory } from '@/components/business/RenterContractHistory'
import { RenterActions } from '@/components/business/RenterActions'
import { useState } from 'react'

interface RenterDetailPageProps {
  renter: any
}

export function RenterDetailPage({ renter }: RenterDetailPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const handleEdit = () => {
    router.push(`/renters/${renter.id}/edit`)
  }
  
  const handleDelete = async () => {
    if (!confirm(`确定要删除租客 ${renter.name} 吗？此操作不可恢复。`)) {
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/renters/${renter.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/renters')
      } else {
        const error = await response.json()
        alert(error.message || '删除失败')
      }
    } catch (error) {
      console.error('删除租客失败:', error)
      alert('删除失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  const handleContractClick = (contract: any) => {
    router.push(`/contracts/${contract.id}`)
  }
  
  const hasActiveContract = renter.contracts?.some((c: any) => c.status === 'ACTIVE')

  return (
    <PageContainer 
      title={renter.name} 
      subtitle="租客详情"
      showBackButton
    >
      <div className="space-y-6 pb-6">
        {/* 操作按钮 */}
        <RenterActions
          renter={renter}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={loading}
        />
        
        {/* 基本信息 */}
        <RenterBasicInfo renter={renter} />
        
        {/* 合同历史 */}
        <RenterContractHistory 
          contracts={renter.contracts || []}
          onContractClick={handleContractClick}
        />
        
        {/* 删除提示 */}
        {hasActiveContract && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  无法删除租客
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>该租客有活跃的合同，请先终止合同后再删除租客信息。</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}