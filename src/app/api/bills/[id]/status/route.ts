import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import {
  billingDomainService,
  isBillingDomainValidationError,
} from '@/lib/domain/billing'
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
 *
 * compat wrapper:
 * phase09-03 起正式状态语义与金额校验迁入 src/lib/domain/billing。
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

  let billData
  try {
    billData = await billingDomainService.updateBillCollectionStatus(id, {
      status,
      receivedAmount,
      pendingAmount,
      paidDate,
      paymentMethod,
      operator,
      remarks,
    })
  } catch (error) {
    if (isBillingDomainValidationError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          compatMode: true,
          migrationHost: 'src/lib/domain/billing',
        },
        { status: 400 }
      )
    }

    throw error
  }

  await revalidateMutationPaths({
    scopes: ['dashboard', 'bills', 'contracts', 'renters', 'rooms'],
    detailPaths: [`/bills/${id}`, `/contracts/${billData.contractId}`],
  })

  return NextResponse.json({
    ...billData,
    compatMode: true,
    migrationHost: 'src/lib/domain/billing',
  })
}

export const PATCH = withApiErrorHandler(handlePatchBillStatus, {
  requireAuth: true,
  module: 'bill-status-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
