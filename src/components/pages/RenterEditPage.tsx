'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { RenterForm } from '@/components/business/RenterForm'
import { PageContainer } from '@/components/layout'

interface RenterEditPageProps {
  renter: any
}

export function RenterEditPage({ renter }: RenterEditPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/renters/${renter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.push(`/renters/${renter.id}`)
      } else {
        const error = await response.json()
        alert(error.error || '更新失败')
      }
    } catch (error) {
      console.error('Update renter error:', error)
      alert('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <PageContainer
      title={`编辑 ${renter.name}`}
      subtitle="修改租客信息"
      showBackButton
    >
      <div className="pb-6">
        <RenterForm
          initialData={renter}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="edit"
        />
      </div>
    </PageContainer>
  )
}
