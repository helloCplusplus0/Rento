import type { Metadata } from 'next'
import { BatchMeterReadingPage } from '@/components/pages/BatchMeterReadingPage'

export const metadata: Metadata = {
  title: '批量抄表',
  description: '批量录入多个房间的仪表读数，支持水电表统一管理'
}

/**
 * 批量抄表页面路由
 * 提供批量录入多个房间仪表读数的功能
 */
export default function BatchMeterReadingRoute() {
  return <BatchMeterReadingPage />
}