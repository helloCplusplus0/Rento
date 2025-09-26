import { NextRequest } from 'next/server'
import { withApiErrorHandler, createSuccessResponse } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'

/**
 * 获取合同提醒数据
 */
async function handleGetContractAlerts(_request: NextRequest) {
  // 模拟合同提醒数据
  const alerts = [
    {
      id: '1',
      type: 'expiring',
      title: '合同即将到期',
      message: '房间A101的租赁合同将在7天后到期',
      level: 'warning',
      contractId: 'contract-1',
      roomNumber: 'A101',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2', 
      type: 'expired',
      title: '合同已过期',
      message: '房间B202的租赁合同已过期3天',
      level: 'danger',
      contractId: 'contract-2',
      roomNumber: 'B202',
      expiryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ]

  return createSuccessResponse(alerts)
}

export const GET = withApiErrorHandler(handleGetContractAlerts, {
  module: 'contract-alerts-api',
  errorType: ErrorType.DATABASE_ERROR
})