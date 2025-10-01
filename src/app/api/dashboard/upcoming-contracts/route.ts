import { NextRequest } from 'next/server'
import { withApiErrorHandler, createSuccessResponse } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { prisma } from '@/lib/prisma'

/**
 * 获取30天内即将生效的合同信息（30天搬入）
 */
async function handleGetUpcomingContracts(_request: NextRequest) {
  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const contracts = await prisma.contract.findMany({
    where: {
      status: 'PENDING', // 待生效状态
      startDate: {
        gte: today,
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
      startDate: 'asc'
    }
  })

  // 转换数据类型并计算距离生效天数
  const contractsData = contracts.map(contract => {
    const daysUntilStart = Math.ceil((new Date(contract.startDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
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
        area: contract.room.area ? Number(contract.room.area) : null
      }
    }
  })

  return createSuccessResponse({
    contracts: contractsData,
    total: contracts.length
  })
}

export const GET = withApiErrorHandler(handleGetUpcomingContracts, {
  module: 'upcoming-contracts-api',
  errorType: ErrorType.DATABASE_ERROR
})