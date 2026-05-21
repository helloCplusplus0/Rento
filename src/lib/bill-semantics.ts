import type { BillStatus } from '@prisma/client'

/**
 * 账单金额比较允许的最小误差，避免 Decimal -> number 转换后的浮点抖动。
 */
export const BILL_AMOUNT_EPSILON = 0.01

export const OPEN_BILL_STATUSES: BillStatus[] = ['PENDING', 'OVERDUE']
export const SETTLED_BILL_STATUSES: BillStatus[] = ['PAID', 'COMPLETED']

export function toBillAmount(value: unknown): number {
  return Math.round(Number(value ?? 0) * 100) / 100
}

export function isBillSettled(pendingAmount: number): boolean {
  return toBillAmount(pendingAmount) <= BILL_AMOUNT_EPSILON
}

export function isOpenBillStatus(status: BillStatus): boolean {
  return OPEN_BILL_STATUSES.includes(status)
}

export function isSettledBillStatus(status: BillStatus): boolean {
  return SETTLED_BILL_STATUSES.includes(status)
}

/**
 * 统一金额语义：
 * - amount: 应收总额
 * - receivedAmount: 已确认收款金额
 * - pendingAmount: 仍待收的剩余金额
 */
export function resolveBillAmounts(params: {
  amount: number
  receivedAmount?: number
  pendingAmount?: number
}) {
  const amount = toBillAmount(params.amount)
  const hasReceivedAmount = params.receivedAmount !== undefined
  const hasPendingAmount = params.pendingAmount !== undefined

  let receivedAmount = hasReceivedAmount
    ? toBillAmount(params.receivedAmount)
    : undefined
  let pendingAmount = hasPendingAmount
    ? toBillAmount(params.pendingAmount)
    : undefined

  if (receivedAmount === undefined && pendingAmount === undefined) {
    receivedAmount = 0
    pendingAmount = amount
  } else if (receivedAmount === undefined) {
    receivedAmount = toBillAmount(amount - (pendingAmount as number))
  } else if (pendingAmount === undefined) {
    pendingAmount = toBillAmount(amount - receivedAmount)
  }

  if (
    receivedAmount! < -BILL_AMOUNT_EPSILON ||
    pendingAmount! < -BILL_AMOUNT_EPSILON
  ) {
    throw new Error('账单金额不能为负数')
  }

  if (receivedAmount! - amount > BILL_AMOUNT_EPSILON) {
    throw new Error('已收金额不能大于应收金额')
  }

  if (Math.abs(amount - receivedAmount! - pendingAmount!) > BILL_AMOUNT_EPSILON) {
    throw new Error('待收金额必须等于应收金额减已收金额')
  }

  return {
    amount,
    receivedAmount: toBillAmount(receivedAmount),
    pendingAmount: toBillAmount(pendingAmount),
  }
}

/**
 * 统一状态语义：
 * - PENDING / OVERDUE: 仍有待收金额的开放状态
 * - PAID: 款项已收齐，但业务流程尚未显式关闭
 * - COMPLETED: 款项已收齐，且流程已明确闭环
 *
 * 部分收款不单独占用状态，仍保留在开放状态中，由 receivedAmount / pendingAmount 体现。
 */
export function resolveBillStatus(params: {
  requestedStatus: BillStatus
  pendingAmount: number
}): BillStatus {
  if (isBillSettled(params.pendingAmount)) {
    return params.requestedStatus === 'COMPLETED' ? 'COMPLETED' : 'PAID'
  }

  if (params.requestedStatus === 'OVERDUE') {
    return 'OVERDUE'
  }

  return 'PENDING'
}

export function createBillStatusCountMap() {
  return {
    PENDING: 0,
    PAID: 0,
    OVERDUE: 0,
    COMPLETED: 0,
  } satisfies Record<BillStatus, number>
}
