import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import {
  billingDomainService,
  isBillDeleteGuardBlockedError,
  isBillingDomainValidationError,
} from '@/lib/domain/billing'
import { ErrorType } from '@/lib/error-logger'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { billQueries } from '@/lib/queries'

/**
 * 获取账单详情API
 * GET /api/bills/[id]
 */
async function handleGetBill(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const bill = await billQueries.findById(id)

  if (!bill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
  }

  // 转换 Decimal 类型为 number
  const billData = {
    ...bill,
    amount: Number(bill.amount),
    receivedAmount: Number(bill.receivedAmount),
    pendingAmount: Number(bill.pendingAmount),
    contract: {
      ...bill.contract,
      monthlyRent: Number(bill.contract.monthlyRent),
      totalRent: Number(bill.contract.totalRent),
      deposit: Number(bill.contract.deposit),
      keyDeposit: bill.contract.keyDeposit
        ? Number(bill.contract.keyDeposit)
        : null,
      cleaningFee: bill.contract.cleaningFee
        ? Number(bill.contract.cleaningFee)
        : null,
    },
  }

  return NextResponse.json(billData)
}

export const GET = withApiErrorHandler(handleGetBill, {
  requireAuth: true,
  module: 'bill-detail-api',
  errorType: ErrorType.DATABASE_ERROR,
})

/**
 * 更新账单API
 * PATCH /api/bills/[id]
 *
 * compat wrapper:
 * phase09-03 起正式账务写路径迁入 src/lib/domain/billing 与 server/routes/bills.ts，
 * 旧 Next 入口只做请求适配与缓存失效，不再独占账务真相。
 */
async function handlePatchBill(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // 检查账单是否存在
  const existingBill = await billQueries.findById(id)
  if (!existingBill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
  }

  const { amount, pendingAmount, dueDate, period, itemLabel, remarks } = body

  let billData
  try {
    billData = await billingDomainService.updatePendingBillDraft(id, {
      amount,
      pendingAmount,
      dueDate,
      period,
      itemLabel,
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
    success: true,
    message: 'Bill updated successfully via compat wrapper',
    data: billData,
    compatMode: true,
    migrationHost: 'src/lib/domain/billing',
  })
}

export const PATCH = withApiErrorHandler(handlePatchBill, {
  requireAuth: true,
  module: 'bill-detail-api',
  errorType: ErrorType.VALIDATION_ERROR,
})

/**
 * 删除账单API
 * DELETE /api/bills/[id]
 *
 * compat wrapper:
 * phase09-03 起账单删除门禁与受控删除由 src/lib/domain/billing 承接。
 */
async function handleDeleteBill(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const safetyCheck = await billingDomainService.performBillDeleteSafetyCheck(id)

  if (!safetyCheck.canDelete) {
    return NextResponse.json(
      {
        error: 'Cannot delete bill with protected business history',
        code: safetyCheck.errorCode,
        details: safetyCheck,
        compatMode: true,
        migrationHost: 'src/lib/domain/billing',
      },
      { status: 400 }
    )
  }

  let result
  try {
    result = await billingDomainService.deletePendingBillWithoutHistory(id)
  } catch (error) {
    if (isBillDeleteGuardBlockedError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.details.errorCode,
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
    detailPaths: result.contractId
      ? [`/bills/${id}`, `/contracts/${result.contractId}`]
      : [`/bills/${id}`],
  })

  return NextResponse.json({
    ...result,
    compatMode: true,
    migrationHost: 'src/lib/domain/billing',
  })
}

export const DELETE = withApiErrorHandler(handleDeleteBill, {
  requireAuth: true,
  module: 'bill-detail-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
