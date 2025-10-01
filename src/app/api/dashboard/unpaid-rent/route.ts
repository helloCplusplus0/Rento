import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { prisma } from '@/lib/prisma'

/**
 * 获取退租未结信息
 */
async function handleGetUnpaidRent(_request: NextRequest) {
  // 查找已到期但仍有未结算账单的合同
  const contracts = await prisma.contract.findMany({
    where: {
      status: { in: ['EXPIRED', 'TERMINATED'] },
      bills: {
        some: {
          status: { in: ['PENDING', 'OVERDUE'] },
          pendingAmount: {
            gt: 0,
          },
        },
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
      bills: {
        where: {
          status: { in: ['PENDING', 'OVERDUE'] },
          pendingAmount: {
            gt: 0,
          },
        },
        select: {
          id: true,
          billNumber: true,
          amount: true,
          receivedAmount: true,
          pendingAmount: true,
          dueDate: true,
          status: true,
          type: true,
        },
      },
    },
    orderBy: {
      endDate: 'desc',
    },
  })

  // 转换数据类型并计算待结算金额
  const contractsData = contracts.map((contract) => {
    const pendingAmount = contract.bills.reduce(
      (sum, bill) => sum + Number(bill.pendingAmount),
      0
    )

    return {
      ...contract,
      monthlyRent: Number(contract.monthlyRent),
      totalRent: Number(contract.totalRent),
      deposit: Number(contract.deposit),
      keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
      cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
      pendingAmount,
      room: {
        ...contract.room,
        rent: Number(contract.room.rent),
        area: contract.room.area ? Number(contract.room.area) : null,
      },
      bills: contract.bills.map((bill) => ({
        ...bill,
        amount: Number(bill.amount),
        receivedAmount: Number(bill.receivedAmount),
        pendingAmount: Number(bill.pendingAmount),
      })),
    }
  })

  return createSuccessResponse({
    contracts: contractsData,
    total: contracts.length,
  })
}

export const GET = withApiErrorHandler(handleGetUnpaidRent, {
  module: 'unpaid-rent-api',
  errorType: ErrorType.DATABASE_ERROR,
})
