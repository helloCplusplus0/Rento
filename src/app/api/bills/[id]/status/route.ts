import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { billQueries } from '@/lib/queries'

/**
 * 更新账单状态API
 * PATCH /api/bills/[id]/status
 *
 * 请求体:
 * {
 *   status: 'PENDING' | 'PAID' | 'OVERDUE' | 'COMPLETED',
 *   receivedAmount?: number,
 *   pendingAmount?: number,
 *   paidDate?: string,
 *   paymentMethod?: string,
 *   operator?: string,
 *   remarks?: string
 * }
 */
async function handlePatchBillStatus(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const {
    status,
    receivedAmount,
    pendingAmount,
    paidDate,
    paymentMethod,
    operator,
    remarks,
  } = body

  if (!status) {
    return NextResponse.json({ error: 'Status is required' }, { status: 400 })
  }

  const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'COMPLETED']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  const existingBill = await billQueries.findById(id)
  if (!existingBill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
  }

  const updateData: any = { status }

  if (status === 'PAID') {
    if (receivedAmount !== undefined) {
      if (receivedAmount < 0) {
        return NextResponse.json(
          { error: 'Received amount cannot be negative' },
          { status: 400 }
        )
      }
      updateData.receivedAmount = receivedAmount
    }

    if (pendingAmount !== undefined) {
      updateData.pendingAmount = pendingAmount
    }

    if (paidDate) {
      updateData.paidDate = new Date(paidDate)
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }

    if (operator) {
      updateData.operator = operator
    }
  }

  if (remarks) {
    updateData.remarks = remarks
  }

  const updatedBill = await billQueries.update(id, updateData)

  const billData = {
    ...updatedBill,
    amount: Number(updatedBill.amount),
    receivedAmount: Number(updatedBill.receivedAmount),
    pendingAmount: Number(updatedBill.pendingAmount),
    contract: {
      ...updatedBill.contract,
      monthlyRent: Number(updatedBill.contract.monthlyRent),
      totalRent: Number(updatedBill.contract.totalRent),
      deposit: Number(updatedBill.contract.deposit),
      keyDeposit: updatedBill.contract.keyDeposit
        ? Number(updatedBill.contract.keyDeposit)
        : null,
      cleaningFee: updatedBill.contract.cleaningFee
        ? Number(updatedBill.contract.cleaningFee)
        : null,
    },
  }

  return NextResponse.json(billData)
}

export const PATCH = withApiErrorHandler(handlePatchBillStatus, {
  requireAuth: true,
  module: 'bill-status-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
