import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import {
  resolveBillAmounts,
  resolveBillStatus,
  toBillAmount,
} from '@/lib/bill-semantics'
import { ErrorType } from '@/lib/error-logger'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { billQueries } from '@/lib/queries'

/**
 * 更新账单状态API
 * PATCH /api/bills/[id]/status
 *
 * 请求体:
 * {
 *   status: 'PENDING' | 'PAID' | 'OVERDUE' | 'COMPLETED',
 *   receivedAmount?: number, // 已确认收款金额
 *   pendingAmount?: number,  // 剩余待收金额
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

  const amount = toBillAmount(existingBill.amount)
  const currentReceivedAmount = toBillAmount(existingBill.receivedAmount)
  const currentPendingAmount = toBillAmount(existingBill.pendingAmount)

  let normalizedAmounts

  try {
    normalizedAmounts = resolveBillAmounts({
      amount,
      receivedAmount:
        receivedAmount !== undefined ? receivedAmount : currentReceivedAmount,
      pendingAmount:
        pendingAmount !== undefined ? pendingAmount : currentPendingAmount,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Invalid bill amounts',
      },
      { status: 400 }
    )
  }

  if (
    status === 'COMPLETED' &&
    normalizedAmounts.pendingAmount > 0.01
  ) {
    return NextResponse.json(
      { error: 'Completed bill must have zero pending amount' },
      { status: 400 }
    )
  }

  const openStatusBase =
    status === 'OVERDUE'
      ? 'OVERDUE'
      : existingBill.status === 'OVERDUE'
        ? 'OVERDUE'
        : 'PENDING'

  const normalizedStatus = resolveBillStatus({
    requestedStatus: status === 'COMPLETED' ? 'COMPLETED' : openStatusBase,
    pendingAmount: normalizedAmounts.pendingAmount,
  })

  const hasPaymentChange =
    Math.abs(normalizedAmounts.receivedAmount - currentReceivedAmount) > 0.01

  const updateData: any = {
    status: normalizedStatus,
    receivedAmount: normalizedAmounts.receivedAmount,
    pendingAmount: normalizedAmounts.pendingAmount,
  }

  if (hasPaymentChange || normalizedStatus === 'PAID' || normalizedStatus === 'COMPLETED') {
    if (paidDate) {
      updateData.paidDate = new Date(paidDate)
    } else if (!existingBill.paidDate && normalizedAmounts.receivedAmount > 0) {
      updateData.paidDate = new Date()
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }

    if (operator) {
      updateData.operator = operator
    }
  } else if (normalizedAmounts.receivedAmount === 0) {
    updateData.paidDate = null
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

  await revalidateMutationPaths({
    scopes: ['dashboard', 'bills', 'contracts', 'renters', 'rooms'],
    detailPaths: [`/bills/${id}`, `/contracts/${updatedBill.contractId}`],
  })

  return NextResponse.json(billData)
}

export const PATCH = withApiErrorHandler(handlePatchBillStatus, {
  requireAuth: true,
  module: 'bill-status-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
