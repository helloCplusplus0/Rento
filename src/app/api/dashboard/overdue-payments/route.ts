import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { prisma } from '@/lib/prisma'

/**
 * 获取30天内逾期付款信息
 */
async function handleGetOverduePayments(_request: NextRequest) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const bills = await prisma.bill.findMany({
    where: {
      status: { in: ['PENDING', 'OVERDUE'] },
      dueDate: {
        lt: new Date(),
        gte: thirtyDaysAgo,
      },
      pendingAmount: {
        gt: 0,
      },
    },
    include: {
      contract: {
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
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
  })

  // 转换数据类型
  const billsData = bills.map((bill) => ({
    ...bill,
    amount: Number(bill.amount),
    receivedAmount: Number(bill.receivedAmount),
    pendingAmount: Number(bill.pendingAmount),
    contract: {
      ...bill.contract,
      monthlyRent: Number(bill.contract.monthlyRent),
      totalRent: Number(bill.contract.totalRent),
      deposit: Number(bill.contract.deposit),
      room: {
        ...bill.contract.room,
        rent: Number(bill.contract.room.rent),
        area: bill.contract.room.area ? Number(bill.contract.room.area) : null,
      },
    },
  }))

  return createSuccessResponse({
    bills: billsData,
    total: bills.length,
  })
}

export const GET = withApiErrorHandler(handleGetOverduePayments, {
  module: 'overdue-payments-api',
  errorType: ErrorType.DATABASE_ERROR,
})
