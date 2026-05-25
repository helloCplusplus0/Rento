import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import {
  calculateDaysUntilContractStart,
  createUpcomingMoveInAlertDeadline,
  formatUpcomingMoveInAlertTitle,
} from '@/lib/contract-alert-semantics'
import { ErrorType } from '@/lib/error-logger'
import { globalSettings } from '@/lib/global-settings'
import { prisma } from '@/lib/prisma'

/**
 * 获取统一提醒窗口内的待入住合同信息
 */
async function handleGetUpcomingContracts(_request: NextRequest) {
  const today = new Date()
  const contractAlertSettingsLoadResult =
    await globalSettings.getContractAlertSettings()
  const upcomingMoveInAlertDays =
    contractAlertSettingsLoadResult.settings.upcomingMoveInAlertDays
  const upcomingMoveInAlertDeadline = createUpcomingMoveInAlertDeadline(
    upcomingMoveInAlertDays,
    today
  )

  const contracts = await prisma.contract.findMany({
    where: {
      status: 'PENDING',
      startDate: {
        gte: today,
        lte: upcomingMoveInAlertDeadline,
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
      startDate: 'asc',
    },
  })

  // 转换数据类型并计算距离生效天数
  const contractsData = contracts.map((contract) => {
    const daysUntilStart = calculateDaysUntilContractStart(
      contract.startDate,
      today
    )

    return {
      ...contract,
      monthlyRent: Number(contract.monthlyRent),
      totalRent: Number(contract.totalRent),
      deposit: Number(contract.deposit),
      keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
      cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
      daysUntilStart,
      room: {
        ...contract.room,
        rent: Number(contract.room.rent),
        area: contract.room.area ? Number(contract.room.area) : null,
      },
    }
  })

  return createSuccessResponse({
    contracts: contractsData,
    total: contracts.length,
    alertDays: upcomingMoveInAlertDays,
    title: formatUpcomingMoveInAlertTitle(upcomingMoveInAlertDays),
  })
}

export const GET = withApiErrorHandler(handleGetUpcomingContracts, {
  requireAuth: true,
  module: 'upcoming-contracts-api',
  errorType: ErrorType.DATABASE_ERROR,
})
