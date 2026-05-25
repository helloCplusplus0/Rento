import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import {
  createContractExpiryAlertDeadline,
  formatContractExpiryAlertTitle,
} from '@/lib/contract-alert-semantics'
import { ErrorType } from '@/lib/error-logger'
import { globalSettings } from '@/lib/global-settings'
import { prisma } from '@/lib/prisma'

/**
 * 获取统一提醒窗口内离店的租客信息
 */
async function handleGetLeavingTenants(_request: NextRequest) {
  const contractAlertSettingsLoadResult =
    await globalSettings.getContractAlertSettings()
  const contractExpiryAlertDays =
    contractAlertSettingsLoadResult.settings.contractExpiryAlertDays
  const expiryAlertDeadline = createContractExpiryAlertDeadline(
    contractExpiryAlertDays
  )

  const contracts = await prisma.contract.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        gte: new Date(),
        lte: expiryAlertDeadline,
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
      endDate: 'asc',
    },
  })

  // 转换数据类型
  const contractsData = contracts.map((contract) => ({
    ...contract,
    monthlyRent: Number(contract.monthlyRent),
    totalRent: Number(contract.totalRent),
    deposit: Number(contract.deposit),
    keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
    cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
    room: {
      ...contract.room,
      rent: Number(contract.room.rent),
      area: contract.room.area ? Number(contract.room.area) : null,
    },
  }))

  return createSuccessResponse({
    contracts: contractsData,
    total: contracts.length,
    alertDays: contractExpiryAlertDays,
    title: formatContractExpiryAlertTitle(contractExpiryAlertDays),
  })
}

export const GET = withApiErrorHandler(handleGetLeavingTenants, {
  requireAuth: true,
  module: 'leaving-tenants-api',
  errorType: ErrorType.DATABASE_ERROR,
})
