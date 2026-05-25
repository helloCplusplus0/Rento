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

export type BillPresentationStatus = 'OPEN' | 'OVERDUE' | 'SETTLED'

export interface BillPresentationLike {
  status: BillStatus
  amount?: unknown
  receivedAmount?: unknown
  pendingAmount?: unknown
}

export interface BillPresentationStats {
  totalCount: number
  openCount: number
  overdueCount: number
  settledCount: number
  totalAmount: number
  receivedAmount: number
  pendingAmount: number
  openAmount: number
  overdueAmount: number
  statusCounts: Record<BillStatus, number>
}

export type BillDisplayDateValue = Date | string | number

export interface BillDisplaySortableLike extends BillPresentationLike {
  dueDate: BillDisplayDateValue
  createdAt: BillDisplayDateValue
}

export function getBillPresentationStatus(
  bill: Pick<BillPresentationLike, 'status' | 'pendingAmount'>
): BillPresentationStatus {
  if (
    isSettledBillStatus(bill.status) ||
    (bill.pendingAmount !== undefined && isBillSettled(toBillAmount(bill.pendingAmount)))
  ) {
    return 'SETTLED'
  }

  if (bill.status === 'OVERDUE') {
    return 'OVERDUE'
  }

  return 'OPEN'
}

function toBillTimestamp(value: BillDisplayDateValue): number {
  return new Date(value).getTime()
}

function getBillDisplayGroupRank(bill: BillDisplaySortableLike): number {
  return getBillPresentationStatus(bill) === 'SETTLED' ? 1 : 0
}

/**
 * 统一账单展示排序：
 * - 未完结账单（OPEN / OVERDUE）优先于已结清账单
 * - 组内按 dueDate 升序，越早到期越靠前
 * - 同 dueDate 时按 createdAt 倒序稳定兜底
 */
export function compareBillsForDisplay(
  a: BillDisplaySortableLike,
  b: BillDisplaySortableLike
): number {
  const groupDiff = getBillDisplayGroupRank(a) - getBillDisplayGroupRank(b)
  if (groupDiff !== 0) {
    return groupDiff
  }

  const dueDateDiff = toBillTimestamp(a.dueDate) - toBillTimestamp(b.dueDate)
  if (dueDateDiff !== 0) {
    return dueDateDiff
  }

  return toBillTimestamp(b.createdAt) - toBillTimestamp(a.createdAt)
}

export function sortBillsForDisplay<T extends BillDisplaySortableLike>(bills: T[]): T[] {
  return [...bills].sort(compareBillsForDisplay)
}

export function getBillPresentationStatusLabel(
  status: BillPresentationStatus
): string {
  switch (status) {
    case 'OPEN':
      return '待处理'
    case 'OVERDUE':
      return '已逾期'
    case 'SETTLED':
      return '已结清'
    default:
      return status
  }
}

export function createBillPresentationStats(): BillPresentationStats {
  return {
    totalCount: 0,
    openCount: 0,
    overdueCount: 0,
    settledCount: 0,
    totalAmount: 0,
    receivedAmount: 0,
    pendingAmount: 0,
    openAmount: 0,
    overdueAmount: 0,
    statusCounts: createBillStatusCountMap(),
  }
}

/**
 * 统一账单展示统计口径：
 * - OPEN: `PENDING`
 * - OVERDUE: `OVERDUE`
 * - SETTLED: `PAID` + `COMPLETED`
 *
 * 展示层不再基于 dueDate 二次推断逾期，统一以账单状态真相源为准。
 */
export function buildBillPresentationStats(
  bills: BillPresentationLike[]
): BillPresentationStats {
  return bills.reduce<BillPresentationStats>((stats, bill) => {
    const presentationStatus = getBillPresentationStatus(bill)
    const amount = toBillAmount(bill.amount)
    const receivedAmount = toBillAmount(bill.receivedAmount)
    const pendingAmount = toBillAmount(bill.pendingAmount)

    stats.totalCount += 1
    stats.totalAmount = toBillAmount(stats.totalAmount + amount)
    stats.receivedAmount = toBillAmount(stats.receivedAmount + receivedAmount)
    stats.pendingAmount = toBillAmount(stats.pendingAmount + pendingAmount)
    stats.statusCounts[bill.status] += 1

    switch (presentationStatus) {
      case 'OPEN':
        stats.openCount += 1
        stats.openAmount = toBillAmount(stats.openAmount + pendingAmount)
        break
      case 'OVERDUE':
        stats.overdueCount += 1
        stats.overdueAmount = toBillAmount(stats.overdueAmount + pendingAmount)
        break
      case 'SETTLED':
        stats.settledCount += 1
        break
    }

    return stats
  }, createBillPresentationStats())
}
