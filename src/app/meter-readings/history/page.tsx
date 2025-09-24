import type { Metadata } from 'next'
import { MeterReadingHistoryPage } from '@/components/pages/MeterReadingHistoryPage'

export const metadata: Metadata = {
  title: '抄表历史',
  description: '查看和管理历史抄表记录，支持编辑和修正'
}

/**
 * 抄表历史页面路由
 * 提供抄表历史查询、编辑和管理功能
 */
export default function MeterReadingHistoryRoute() {
  return <MeterReadingHistoryPage />
}