import type { Metadata } from 'next'

import { AddHubPage } from '@/components/pages/AddHubPage'

export const metadata: Metadata = {
  title: '添加功能',
  description: '快速添加房源、租客、合同和账单信息',
}

export default function AddPage() {
  return <AddHubPage />
}
