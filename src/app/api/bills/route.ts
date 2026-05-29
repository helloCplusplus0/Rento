import { NextRequest, NextResponse } from 'next/server'
import type { BillStatus, BillType } from '@prisma/client'
import { readFileSync } from 'fs'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { optimizedBillQueries } from '@/lib/optimized-queries'
import { billQueries, contractQueries } from '@/lib/queries'

/**
 * 获取账单列表API（优化版）
 * GET /api/bills
 */
async function handleGetBills(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // 解析分页参数
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  // 解析筛选参数
  const status = searchParams.get('status') as BillStatus | null
  const type = searchParams.get('type') as BillType | null
  const contractId = searchParams.get('contractId')
  const search = searchParams.get('search')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const buildingId = searchParams.get('buildingId')
  const renterId = searchParams.get('renterId')

  const result = await optimizedBillQueries.findWithPagination(
    { page, limit },
    {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(contractId ? { contractId } : {}),
      ...(search ? { search } : {}),
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(buildingId ? { buildingId } : {}),
      ...(renterId ? { renterId } : {}),
    }
  )

  // 转换 Decimal 类型为 number
  const billsData = result.data.map((bill) => ({
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
  }))

  return NextResponse.json({
    data: billsData,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasNext: result.hasNext,
    hasPrev: result.hasPrev,
  })
}

export const GET = withApiErrorHandler(handleGetBills, {
  requireAuth: true,
  module: 'bills-api',
  errorType: ErrorType.DATABASE_ERROR,
})

/**
 * 创建账单API
 * POST /api/bills
 */
async function handlePostBills(request: NextRequest) {
  const billData = await request.json()
  const normalizedItemLabel =
    typeof billData.itemLabel === 'string' ? billData.itemLabel.trim() : ''
  // #region debug-point C:api-bills-received
  ;(() => {
    let debugUrl = 'http://127.0.0.1:7777/event'
    let sessionId = 'other-bill-create-error'
    try {
      const envText = readFileSync('.dbg/other-bill-create-error.env', 'utf8')
      debugUrl =
        envText.match(/DEBUG_SERVER_URL=(.+)/)?.[1]?.trim() || debugUrl
      sessionId =
        envText.match(/DEBUG_SESSION_ID=(.+)/)?.[1]?.trim() || sessionId
    } catch {}
    fetch(debugUrl, {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        runId: 'pre-fix',
        hypothesisId: 'C',
        location: 'src/app/api/bills/route.ts:88',
        msg: '[DEBUG] api received create bill payload',
        data: {
          type: billData.type,
          itemLabel: billData.itemLabel,
          normalizedItemLabel,
          billNumber: billData.billNumber,
          amount: billData.amount,
          dueDate: billData.dueDate,
        },
        ts: Date.now(),
      }),
    }).catch(() => {})
  })()
  // #endregion

  // 基础字段验证
  if (
    !billData.billNumber ||
    !billData.contractId ||
    !billData.amount ||
    !billData.dueDate
  ) {
    return NextResponse.json(
      { error: '缺少必填字段: billNumber, contractId, amount, dueDate' },
      { status: 400 }
    )
  }

  // 增强的数据验证
  const validationResult = await validateBillCreation(billData)
  if (!validationResult.valid) {
    return NextResponse.json({ error: validationResult.error }, { status: 400 })
  }

  // 创建账单
  // #region debug-point D:api-bills-before-create
  ;(() => {
    let debugUrl = 'http://127.0.0.1:7777/event'
    let sessionId = 'other-bill-create-error'
    try {
      const envText = readFileSync('.dbg/other-bill-create-error.env', 'utf8')
      debugUrl =
        envText.match(/DEBUG_SERVER_URL=(.+)/)?.[1]?.trim() || debugUrl
      sessionId =
        envText.match(/DEBUG_SESSION_ID=(.+)/)?.[1]?.trim() || sessionId
    } catch {}
    fetch(debugUrl, {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        runId: 'pre-fix',
        hypothesisId: 'D',
        location: 'src/app/api/bills/route.ts:142',
        msg: '[DEBUG] api create bill normalized data',
        data: {
          type: billData.type || 'OTHER',
          itemLabel:
            (billData.type || 'OTHER') === 'OTHER'
              ? normalizedItemLabel
              : undefined,
          remarks: billData.remarks,
        },
        ts: Date.now(),
      }),
    }).catch(() => {})
  })()
  // #endregion
  const newBill = await billQueries.create({
    billNumber: billData.billNumber,
    type: billData.type || 'OTHER',
    itemLabel:
      (billData.type || 'OTHER') === 'OTHER' ? normalizedItemLabel : undefined,
    amount: billData.amount,
    pendingAmount: billData.pendingAmount || billData.amount,
    dueDate: new Date(billData.dueDate),
    period: billData.period,
    contractId: billData.contractId,
    paymentMethod: billData.paymentMethod || '待确定',
    operator: billData.operator || '手动创建',
    remarks: billData.remarks || `${billData.type || 'OTHER'}账单 - 手动创建`,
  })

  // 转换 Decimal 类型
  const transformedBill = {
    ...newBill,
    amount: Number(newBill.amount),
    receivedAmount: Number(newBill.receivedAmount),
    pendingAmount: Number(newBill.pendingAmount),
    contract: {
      ...newBill.contract,
      monthlyRent: Number(newBill.contract.monthlyRent),
      totalRent: Number(newBill.contract.totalRent),
      deposit: Number(newBill.contract.deposit),
      keyDeposit: newBill.contract.keyDeposit
        ? Number(newBill.contract.keyDeposit)
        : null,
      cleaningFee: newBill.contract.cleaningFee
        ? Number(newBill.contract.cleaningFee)
        : null,
    },
  }

  await revalidateMutationPaths({
    scopes: ['dashboard', 'bills', 'contracts', 'renters', 'rooms'],
    detailPaths: [`/bills/${newBill.id}`, `/contracts/${billData.contractId}`],
  })

  return NextResponse.json(transformedBill)
}

export const POST = withApiErrorHandler(handlePostBills, {
  requireAuth: true,
  module: 'bills-api',
  errorType: ErrorType.VALIDATION_ERROR,
})

// 验证函数
async function validateBillCreation(data: any) {
  const isBeforeToday = (date: Date) => {
    const candidate = new Date(date)
    candidate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return candidate < today
  }

  // 合同验证
  try {
    const contract = await contractQueries.findById(data.contractId)
    if (!contract || contract.status !== 'ACTIVE') {
      return { valid: false, error: '合同不存在或已失效' }
    }
  } catch (_error) {
    return { valid: false, error: '合同验证失败' }
  }

  // 金额验证
  if (
    typeof data.amount !== 'number' ||
    data.amount <= 0 ||
    data.amount > 999999.99
  ) {
    return { valid: false, error: '金额必须在0.01-999999.99之间' }
  }

  // 日期验证
  const dueDate = new Date(data.dueDate)
  if (Number.isNaN(dueDate.getTime()) || isBeforeToday(dueDate)) {
    return { valid: false, error: '到期日期格式错误或早于今天' }
  }

  // 账单编号格式验证
  if (!/^BILL[A-Z0-9]{6,12}$/.test(data.billNumber)) {
    return { valid: false, error: '账单编号格式不正确' }
  }

  if (data.type === 'OTHER') {
    const itemLabel =
      typeof data.itemLabel === 'string' ? data.itemLabel.trim() : ''

    if (!itemLabel) {
      return { valid: false, error: '其他账单必须填写条目名' }
    }
  }

  return { valid: true }
}
