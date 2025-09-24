'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout'
import { RenterForm } from '@/components/business/RenterForm'

export function RenterCreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (data: any) => {
    try {
      setLoading(true)
      const response = await fetch('/api/renters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        const newRenter = await response.json()
        router.push(`/renters/${newRenter.id}`)
      } else {
        const error = await response.json()
        alert(error.error || '创建失败')
      }
    } catch (error) {
      console.error('Create renter error:', error)
      alert('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCancel = () => {
    router.back()
  }
  
  return (
    <PageContainer 
      title="添加租客"
      subtitle="创建新的租客信息"
      showBackButton
    >
      <div className="pb-6">
        <RenterForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="create"
        />
      </div>
    </PageContainer>
  )
}