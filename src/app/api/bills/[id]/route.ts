import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
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

  // 权限检查：只有 PENDING 状态的账单才能编辑关键信息
  if (existingBill.status !== 'PENDING') {
    return NextResponse.json(
      {
        error: 'Only pending bills can be edited',
        message: '只有待付款状态的账单才能编辑关键信息',
      },
      { status: 400 }
    )
  }

  // 提取可编辑的字段
  const { amount, pendingAmount, dueDate, period, remarks } = body

  // 构建更新数据
  const updateData: any = {}

  if (amount !== undefined) {
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }
    updateData.amount = amount
  }

  if (pendingAmount !== undefined) {
    updateData.pendingAmount = pendingAmount
  }

  if (dueDate !== undefined) {
    const parsedDate = new Date(dueDate)
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid due date format' },
        { status: 400 }
      )
    }
    updateData.dueDate = parsedDate
  }

  if (period !== undefined) {
    updateData.period = period
  }

  if (remarks !== undefined) {
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

  return NextResponse.json({
    success: true,
    message: 'Bill updated successfully',
    data: billData,
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
 */
async function handleDeleteBill(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existingBill = await billQueries.findById(id)
  if (!existingBill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
  }

  if (
    existingBill.status === 'PAID' &&
    Number(existingBill.receivedAmount) > 0
  ) {
    return NextResponse.json(
      { error: 'Cannot delete paid bill with received amount' },
      { status: 400 }
    )
  }

  if (existingBill.status === 'COMPLETED') {
    return NextResponse.json(
      { error: 'Cannot delete completed bill' },
      { status: 400 }
    )
  }

  await billQueries.delete(id)

  return NextResponse.json({
    success: true,
    message: 'Bill deleted successfully',
  })
}

export const DELETE = withApiErrorHandler(handleDeleteBill, {
  requireAuth: true,
  module: 'bill-detail-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
