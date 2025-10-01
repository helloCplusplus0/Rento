import {
  createSuccessResponse,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { getEnhancedDashboardStats } from '@/lib/dashboard-queries'
import { ErrorType } from '@/lib/error-logger'

/**
 * 获取仪表板统计数据的API路由
 */
async function handleGetDashboardStats() {
  const stats = await getEnhancedDashboardStats()
  return createSuccessResponse(stats)
}

export const GET = withApiErrorHandler(handleGetDashboardStats, {
  module: 'dashboard-api',
  errorType: ErrorType.DATABASE_ERROR,
})
