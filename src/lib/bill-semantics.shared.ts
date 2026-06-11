/**
 * 纯 shared 账单语义：
 * 仅承接前后端都可安全复用的常量、类型与纯函数，
 * 禁止在这里引入 Prisma 单例、事务或任何 server-only 依赖。
 */
export const BILL_AMOUNT_EPSILON = 0.01
const DAY_IN_MS = 24 * 60 * 60 * 1000

export type SharedBillStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'COMPLETED'

export const OPEN_BILL_STATUSES: SharedBillStatus[] = ['PENDING', 'OVERDUE']
export const SETTLED_BILL_STATUSES: SharedBillStatus[] = ['PAID', 'COMPLETED']

export interface BillSemanticsAmounts {
  amount: number
  receivedAmount: number
  pendingAmount: number
}

export type BillPresentationStatus = 'OPEN' | 'OVERDUE' | 'SETTLED'

export interface BillPresentationLike {
  status: SharedBillStatus
  amount?: unknown
  receivedAmount?: unknown
  pendingAmount?: unknown
}

export interface BillDisplaySortableLike extends BillPresentationLike {
  dueDate: Date | string | number
  createdAt: Date | string | number
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
  statusCounts: Record<SharedBillStatus, number>
}

export function toBillAmount(value: unknown): number {
  return Math.round(Number(value ?? 0) * 100) / 100
}

export function isBillSettled(pendingAmount: number): boolean {
  return toBillAmount(pendingAmount) <= BILL_AMOUNT_EPSILON
}

export function isOpenBillStatus(status: SharedBillStatus): boolean {
  return OPEN_BILL_STATUSES.includes(status)
}

export function isSettledBillStatus(status: SharedBillStatus): boolean {
  return SETTLED_BILL_STATUSES.includes(status)
}

/**
 * 统一状态语义：
 * - PENDING / OVERDUE: 仍有待收金额的开放状态
 * - PAID: 款项已收齐，但业务流程尚未显式关闭
 * - COMPLETED: 款项已收齐，且流程已明确闭环
 */
export function resolveBillStatus(params: {
  requestedStatus: SharedBillStatus
  pendingAmount: number
}): SharedBillStatus {
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
  } satisfies Record<SharedBillStatus, number>
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

function createStartOfUtcDay(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
}

function normalizeToUtcDayTimestamp(value: Date | string | number): number {
  const normalizedDate = new Date(value)
  return Date.UTC(
    normalizedDate.getUTCFullYear(),
    normalizedDate.getUTCMonth(),
    normalizedDate.getUTCDate()
  )
}

export function calculateDaysUntilBillDue(
  dueDate: Date | string | number,
  now: Date = new Date()
): number {
  return Math.round(
    (normalizeToUtcDayTimestamp(dueDate) - createStartOfUtcDay(now).getTime()) /
      DAY_IN_MS
  )
}

function toBillTimestamp(value: Date | string | number): number {
  return new Date(value).getTime()
}

function getBillDisplayGroupRank(bill: BillDisplaySortableLike): number {
  return getBillPresentationStatus(bill) === 'SETTLED' ? 1 : 0
}

export function getBillDistanceFromToday(
  bill: Pick<BillDisplaySortableLike, 'dueDate'>,
  now: Date = new Date()
): number {
  return Math.abs(calculateDaysUntilBillDue(bill.dueDate, now))
}

function getBillDueDirectionRank(
  bill: Pick<BillDisplaySortableLike, 'dueDate'>,
  now: Date = new Date()
): number {
  return calculateDaysUntilBillDue(bill.dueDate, now) < 0 ? 0 : 1
}

export function compareBillsForDisplay(
  a: BillDisplaySortableLike,
  b: BillDisplaySortableLike
): number {
  const today = createStartOfUtcDay(new Date())
  const groupDiff = getBillDisplayGroupRank(a) - getBillDisplayGroupRank(b)
  if (groupDiff !== 0) {
    return groupDiff
  }

  const distanceDiff = getBillDistanceFromToday(a, today) - getBillDistanceFromToday(b, today)
  if (distanceDiff !== 0) {
    return distanceDiff
  }

  // 同距离时，逾期账单优先于未来到期账单，例如“已逾期 1 天”优先于“1 天后到期”。
  const dueDirectionDiff =
    getBillDueDirectionRank(a, today) - getBillDueDirectionRank(b, today)
  if (dueDirectionDiff !== 0) {
    return dueDirectionDiff
  }

  const dueDateDiff =
    normalizeToUtcDayTimestamp(a.dueDate) - normalizeToUtcDayTimestamp(b.dueDate)
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
