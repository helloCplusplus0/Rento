'use client'

import { useState } from 'react'

import {
  backWithHostNavigation,
  pushWithHostNavigation,
  type HostNavigationAdapter,
} from '@/lib/host-navigation'

import { RenterForm } from '@/components/business/RenterForm'
import { PageContainer } from '@/components/layout/PageContainer'

interface RenterCreatePageProps {
  navigation?: HostNavigationAdapter
}

export function RenterCreatePage({ navigation }: RenterCreatePageProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true)
      const response = await fetch('/api/renters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        // API返回格式: { success: true, data: renter, message: '租客创建成功' }
        const newRenter = result.data
        if (newRenter && newRenter.id) {
          pushWithHostNavigation(`/renters/${newRenter.id}`, navigation)
        } else {
          console.error('API返回的租客数据格式错误:', result)
          alert('创建成功，但跳转失败，请手动刷新页面')
        }
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
    backWithHostNavigation('/renters', navigation)
  }

  return (
    <PageContainer title="添加租客" showBackButton>
      <div>
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
