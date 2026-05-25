import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import {
  calculateDaysUntilContractExpiry,
  EXPIRED_CONTRACT_ALERT_TITLE,
} from '@/lib/contract-alert-semantics'
import { ErrorType } from '@/lib/error-logger'
import { prisma } from '@/lib/prisma'

/**
 * 获取合同到期提醒数据
 */
async function handleGetContractAlerts(_request: NextRequest) {
  const today = new Date()

  // 查询已到期但未处理的合同
  const expiredContracts = await prisma.contract.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lt: today,
      },
    },
    include: {
      renter: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      room: {
        include: {
          building: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      endDate: 'desc',
    },
  })

  // 转换数据类型并计算逾期天数
  const alertsData = expiredContracts.map((contract) => {
    const daysUntilExpiry = calculateDaysUntilContractExpiry(
      contract.endDate,
      today
    )

    return {
      id: contract.id,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      renterName: contract.renter.name,
      roomInfo: `${contract.room.building.name} - ${contract.room.roomNumber}`,
      endDate: contract.endDate,
      daysUntilExpiry,
      monthlyRent: Number(contract.monthlyRent),
      alertLevel: 'danger' as const,
    }
  })

  return createSuccessResponse({
    alerts: alertsData,
    total: alertsData.length,
    title: EXPIRED_CONTRACT_ALERT_TITLE,
    summary: {
      total: alertsData.length,
      warning: 0,
      danger: alertsData.length,
      expired: alertsData.length,
    },
  })
}

export const GET = withApiErrorHandler(handleGetContractAlerts, {
  requireAuth: true,
  module: 'contract-alerts-api',
  errorType: ErrorType.DATABASE_ERROR,
})
