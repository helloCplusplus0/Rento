import { NextRequest } from 'next/server'
import { withApiErrorHandler, createSuccessResponse } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { prisma } from '@/lib/prisma'

/**
 * 获取30天内离店的租客信息
 */
async function handleGetLeavingTenants(_request: NextRequest) {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const contracts = await prisma.contract.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        gte: new Date(),
        lte: thirtyDaysFromNow
      }
    },
    include: {
      renter: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      },
      room: {
        include: {
          building: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      endDate: 'asc'
    }
  })

  // 转换数据类型
  const contractsData = contracts.map(contract => ({
    ...contract,
    monthlyRent: Number(contract.monthlyRent),
    totalRent: Number(contract.totalRent),
    deposit: Number(contract.deposit),
    keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
    cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
    room: {
      ...contract.room,
      rent: Number(contract.room.rent),
      area: contract.room.area ? Number(contract.room.area) : null
    }
  }))

  return createSuccessResponse({
    contracts: contractsData,
    total: contracts.length
  })
}

export const GET = withApiErrorHandler(handleGetLeavingTenants, {
  module: 'leaving-tenants-api',
  errorType: ErrorType.DATABASE_ERROR
})