import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '性能测试 - Rento',
  description: '验证各项性能优化功能的实际效果',
}

export default function PerformanceTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}