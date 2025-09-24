import type { Metadata } from 'next'
import { RenterCreatePage } from '@/components/pages/RenterCreatePage'

export const metadata: Metadata = {
  title: '添加租客',
  description: '添加新的租客信息'
}

export default function RenterNewPage() {
  return <RenterCreatePage />
}