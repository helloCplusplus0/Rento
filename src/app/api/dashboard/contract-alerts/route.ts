import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
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
    const daysOverdue = Math.ceil(
      (today.getTime() - new Date(contract.endDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    return {
      id: contract.id,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      renterName: contract.renter.name,
      roomInfo: `${contract.room.building.name} - ${contract.room.roomNumber}`,
      endDate: contract.endDate,
      daysUntilExpiry: -daysOverdue, // 负数表示已逾期
      monthlyRent: Number(contract.monthlyRent),
      alertLevel: 'danger' as const,
    }
  })

  return createSuccessResponse({
    alerts: alertsData,
    total: alertsData.length,
    summary: {
      total: alertsData.length,
      warning: 0,
      danger: alertsData.length,
      expired: alertsData.length,
    },
  })
}

export const GET = withApiErrorHandler(handleGetContractAlerts, {
  module: 'contract-alerts-api',
  errorType: ErrorType.DATABASE_ERROR,
})
