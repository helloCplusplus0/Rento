import {
  defineDomainModuleBoundary,
  PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
} from '../shared'
import type { BillStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'

import {
  buildContractRentBillPlan,
  formatContractPaymentCycle,
  normalizeContractPaymentCycle,
} from '@/lib/contract-payment-cycle'
import { prisma } from '@/lib/prisma'

/**
 * 账务语义需要围绕合同锚点保持稳定。
 * phase09-03 起正式承接账单金额/状态、基础支付周期出账与账单删除门禁。
 */
export const billingDomainBoundary = defineDomainModuleBoundary({
  name: 'billing',
  description: '承接账单金额、状态、支付周期与自动出账语义。',
  compatBoundary: {
    strategy: 'compat-wrapper',
    reason:
      '账务旧入口仍承担存量业务请求与对照基线职责，phase09-01 不在旧宿主继续新增账务真相。',
    exitCondition:
      '当账单生成、状态回写与支付周期接口已迁入 server/routes/*，并由 src/lib/domain/billing 承接写事务后，旧入口退化为薄包装或只读参考。',
  },
  transactionBoundary: {
    ...PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
    note:
      '账单生成、收款状态回写与明细聚合的事务边界统一收口到 src/lib/domain/billing。',
  },
})

const PRISMA_TRANSACTION_MAX_RETRIES = 3
const PRISMA_TRANSACTION_MAX_WAIT_MS = 5_000
const PRISMA_TRANSACTION_TIMEOUT_MS = 10_000
const PRISMA_TRANSACTION_RETRY_BASE_DELAY_MS = 100

/**
 * 账单金额比较允许的最小误差，避免 Decimal -> number 转换后的浮点抖动。
 */
export const BILL_AMOUNT_EPSILON = 0.01

export const OPEN_BILL_STATUSES: BillStatus[] = ['PENDING', 'OVERDUE']
export const SETTLED_BILL_STATUSES: BillStatus[] = ['PAID', 'COMPLETED']

export interface BillSemanticsAmounts {
  amount: number
  receivedAmount: number
  pendingAmount: number
}

export type BillPresentationStatus = 'OPEN' | 'OVERDUE' | 'SETTLED'

export interface BillPresentationLike {
  status: BillStatus
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
  statusCounts: Record<BillStatus, number>
}

export interface BillingDomainValidationErrorDetails {
  field?: string
  reason?: string
  [key: string]: unknown
}

export class BillingDomainValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: BillingDomainValidationErrorDetails
  ) {
    super(message)
    this.name = 'BillingDomainValidationError'
  }
}

export function isBillingDomainValidationError(
  error: unknown
): error is BillingDomainValidationError {
  return error instanceof BillingDomainValidationError
}

export interface SerializedBillContract {
  id: string
  contractNumber: string
  roomId: string
  renterId: string
  startDate: Date
  endDate: Date
  monthlyRent: number
  totalRent: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  paymentMethod: string | null
  paymentTiming: string | null
  status: string
  room: {
    id: string
    roomNumber: string
    buildingId: string
    status: string
    currentRenter: string | null
    building: {
      id: string
      name: string
    }
  }
  renter: {
    id: string
    name: string
    phone: string | null
  }
}

export interface SerializedBill {
  id: string
  billNumber: string
  type: string
  itemLabel: string | null
  amount: number
  receivedAmount: number
  pendingAmount: number
  dueDate: Date
  paidDate: Date | null
  period: string | null
  status: BillStatus
  contractId: string
  paymentMethod: string | null
  operator: string | null
  remarks: string | null
  aggregationType: string | null
  metadata: string | null
  meterReadingId: string | null
  createdAt: Date
  updatedAt: Date
  contract: SerializedBillContract
}

export interface BillDeleteSafetyCheck {
  canDelete: boolean
  billStatus: BillStatus
  amount: number
  receivedAmount: number
  pendingAmount: number
  billDetailCount: number
  meterReadingId: string | null
  paidDate: Date | null
  hasSettlementTrace: boolean
  hasUsageHistory: boolean
  errorCode: string | null
  blockingReasons: string[]
  suggestion: string | null
}

export class BillDeleteGuardBlockedError extends Error {
  constructor(
    message: string,
    public readonly details: BillDeleteSafetyCheck
  ) {
    super(message)
    this.name = 'BillDeleteGuardBlockedError'
  }
}

export function isBillDeleteGuardBlockedError(
  error: unknown
): error is BillDeleteGuardBlockedError {
  return error instanceof BillDeleteGuardBlockedError
}

export interface UpdateBillDraftInput {
  amount?: number
  pendingAmount?: number
  dueDate?: string | Date
  period?: string | null
  itemLabel?: string | null
  remarks?: string | null
}

export interface UpdateBillStatusInput {
  status: BillStatus
  receivedAmount?: number
  pendingAmount?: number
  paidDate?: string | Date | null
  paymentMethod?: string | null
  operator?: string | null
  remarks?: string | null
}

export interface BillingSemanticsSnapshot {
  billId: string
  billNumber: string
  type: string
  status: BillStatus
  requestedPaymentCycleLabel: string | null
  amounts: BillSemanticsAmounts
  presentationStatus: BillPresentationStatus
  isOpen: boolean
  isSettled: boolean
  deleteGuard: BillDeleteSafetyCheck
}

export interface GeneratedBaseBillSummary {
  id: string
  billNumber: string
  type: string
  itemLabel: string | null
  amount: number
  receivedAmount: number
  pendingAmount: number
  dueDate: Date
  status: BillStatus
  period: string | null
  remarks: string | null
}

type BillWithContract = Prisma.BillGetPayload<{
  include: {
    contract: {
      include: {
        room: {
          include: {
            building: true
          }
        }
        renter: true
      }
    }
  }
}>

type ContractForBaseBills = Prisma.ContractGetPayload<{
  include: {
    room: {
      include: {
        building: true
      }
    }
    renter: true
    bills: {
      select: {
        id: true
        type: true
        period: true
      }
    }
  }
}>

function isPrismaWriteConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE.retryCode
  )
}

async function waitForRetry(attempt: number) {
  const delayMs = PRISMA_TRANSACTION_RETRY_BASE_DELAY_MS * attempt
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })
}

async function runWithSerializableTransaction<T>(
  operation: Parameters<typeof prisma.$transaction>[0]
) {
  for (let attempt = 1; attempt <= PRISMA_TRANSACTION_MAX_RETRIES; attempt += 1) {
    try {
      return (await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: PRISMA_TRANSACTION_MAX_WAIT_MS,
        timeout: PRISMA_TRANSACTION_TIMEOUT_MS,
      })) as T
    } catch (error) {
      if (
        !isPrismaWriteConflict(error) ||
        attempt >= PRISMA_TRANSACTION_MAX_RETRIES
      ) {
        throw error
      }

      await waitForRetry(attempt)
    }
  }

  throw new Error('账单事务执行失败')
}

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
}): BillSemanticsAmounts {
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
    amount < BILL_AMOUNT_EPSILON ||
    receivedAmount! < -BILL_AMOUNT_EPSILON ||
    pendingAmount! < -BILL_AMOUNT_EPSILON
  ) {
    throw new BillingDomainValidationError('账单金额不能为负数或零', 'BILL_AMOUNT_INVALID', {
      field: 'amount',
      amount,
      receivedAmount,
      pendingAmount,
    })
  }

  if (receivedAmount! - amount > BILL_AMOUNT_EPSILON) {
    throw new BillingDomainValidationError(
      '已收金额不能大于应收金额',
      'BILL_RECEIVED_AMOUNT_EXCEEDS_AMOUNT',
      {
        field: 'receivedAmount',
        amount,
        receivedAmount,
      }
    )
  }

  if (Math.abs(amount - receivedAmount! - pendingAmount!) > BILL_AMOUNT_EPSILON) {
    throw new BillingDomainValidationError(
      '待收金额必须等于应收金额减已收金额',
      'BILL_PENDING_AMOUNT_MISMATCH',
      {
        field: 'pendingAmount',
        amount,
        receivedAmount,
        pendingAmount,
      }
    )
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

function toBillTimestamp(value: Date | string | number): number {
  return new Date(value).getTime()
}

function getBillDisplayGroupRank(bill: BillDisplaySortableLike): number {
  return getBillPresentationStatus(bill) === 'SETTLED' ? 1 : 0
}

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

function serializeBillWithContract(bill: BillWithContract): SerializedBill {
  return {
    id: bill.id,
    billNumber: bill.billNumber,
    type: bill.type,
    itemLabel: bill.itemLabel,
    amount: Number(bill.amount),
    receivedAmount: Number(bill.receivedAmount),
    pendingAmount: Number(bill.pendingAmount),
    dueDate: bill.dueDate,
    paidDate: bill.paidDate,
    period: bill.period,
    status: bill.status,
    contractId: bill.contractId,
    paymentMethod: bill.paymentMethod,
    operator: bill.operator,
    remarks: bill.remarks,
    aggregationType: bill.aggregationType,
    metadata: bill.metadata,
    meterReadingId: bill.meterReadingId,
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
    contract: {
      id: bill.contract.id,
      contractNumber: bill.contract.contractNumber,
      roomId: bill.contract.roomId,
      renterId: bill.contract.renterId,
      startDate: bill.contract.startDate,
      endDate: bill.contract.endDate,
      monthlyRent: Number(bill.contract.monthlyRent),
      totalRent: Number(bill.contract.totalRent),
      deposit: Number(bill.contract.deposit),
      keyDeposit:
        bill.contract.keyDeposit !== null ? Number(bill.contract.keyDeposit) : null,
      cleaningFee:
        bill.contract.cleaningFee !== null ? Number(bill.contract.cleaningFee) : null,
      paymentMethod: bill.contract.paymentMethod,
      paymentTiming: bill.contract.paymentTiming,
      status: bill.contract.status,
      room: {
        id: bill.contract.room.id,
        roomNumber: bill.contract.room.roomNumber,
        buildingId: bill.contract.room.buildingId,
        status: bill.contract.room.status,
        currentRenter: bill.contract.room.currentRenter,
        building: {
          id: bill.contract.room.building.id,
          name: bill.contract.room.building.name,
        },
      },
      renter: {
        id: bill.contract.renter.id,
        name: bill.contract.renter.name,
        phone: bill.contract.renter.phone,
      },
    },
  }
}

function serializeGeneratedBillSummary(
  bill: Pick<
    BillWithContract,
    'id' | 'billNumber' | 'type' | 'itemLabel' | 'amount' | 'receivedAmount' | 'pendingAmount' | 'dueDate' | 'status' | 'period' | 'remarks'
  >
): GeneratedBaseBillSummary {
  return {
    id: bill.id,
    billNumber: bill.billNumber,
    type: bill.type,
    itemLabel: bill.itemLabel,
    amount: Number(bill.amount),
    receivedAmount: Number(bill.receivedAmount),
    pendingAmount: Number(bill.pendingAmount),
    dueDate: bill.dueDate,
    status: bill.status,
    period: bill.period,
    remarks: bill.remarks,
  }
}

function getBillInclude() {
  return {
    contract: {
      include: {
        room: {
          include: {
            building: true,
          },
        },
        renter: true,
      },
    },
  } as const
}

function getBillDeleteGuardInclude() {
  return {
    ...getBillInclude(),
    billDetails: {
      select: {
        id: true,
      },
    },
  } as const
}

async function getBillDeleteGuardSnapshot(
  db: typeof prisma | Prisma.TransactionClient,
  billId: string
) {
  return db.bill.findUnique({
    where: { id: billId },
    include: getBillDeleteGuardInclude(),
  })
}

function buildBillDeleteSafetyCheck(
  bill: NonNullable<Awaited<ReturnType<typeof getBillDeleteGuardSnapshot>>>
): BillDeleteSafetyCheck {
  const amount = toBillAmount(bill.amount)
  const receivedAmount = toBillAmount(bill.receivedAmount)
  const pendingAmount = toBillAmount(bill.pendingAmount)
  const billDetailCount = bill.billDetails.length
  const hasSettlementTrace =
    receivedAmount > 0 ||
    pendingAmount < amount ||
    bill.paidDate !== null ||
    bill.status === 'PAID' ||
    bill.status === 'COMPLETED'
  const hasUsageHistory = Boolean(bill.meterReadingId) || billDetailCount > 0
  const blockingReasons: string[] = []

  if (bill.status !== 'PENDING') {
    blockingReasons.push('BILL_STATUS_NOT_DELETABLE')
  }

  if (hasSettlementTrace) {
    blockingReasons.push('BILL_HAS_SETTLEMENT_HISTORY')
  }

  if (hasUsageHistory) {
    blockingReasons.push('BILL_HAS_USAGE_HISTORY')
  }

  const errorCode = blockingReasons[0] || null
  const suggestion =
    errorCode === 'BILL_STATUS_NOT_DELETABLE'
      ? '账单已进入正式账务流程，请改用收款、作废、终止合同或专用归档流程处理'
      : errorCode === 'BILL_HAS_SETTLEMENT_HISTORY'
        ? '账单已产生收款或结清痕迹，必须保留财务事实'
        : errorCode === 'BILL_HAS_USAGE_HISTORY'
          ? '该账单已关联抄表或账单明细，请保留历史并通过专用业务流程处理'
          : null

  return {
    canDelete: blockingReasons.length === 0,
    billStatus: bill.status,
    amount,
    receivedAmount,
    pendingAmount,
    billDetailCount,
    meterReadingId: bill.meterReadingId,
    paidDate: bill.paidDate,
    hasSettlementTrace,
    hasUsageHistory,
    errorCode,
    blockingReasons,
    suggestion,
  }
}

function parseDueDate(input: string | Date | undefined) {
  if (input === undefined) {
    return undefined
  }

  const parsedDate = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(parsedDate.getTime())) {
    throw new BillingDomainValidationError('到期日期格式不合法', 'BILL_INVALID_DUE_DATE', {
      field: 'dueDate',
    })
  }

  return parsedDate
}

function normalizeOtherBillItemLabel(
  billType: string,
  itemLabel: string | null | undefined,
  currentItemLabel: string | null
) {
  if (itemLabel === undefined) {
    return currentItemLabel
  }

  const normalizedItemLabel =
    typeof itemLabel === 'string' ? itemLabel.trim() : ''

  if (billType === 'OTHER' && !normalizedItemLabel) {
    throw new BillingDomainValidationError('其他账单必须填写条目名', 'BILL_ITEM_LABEL_REQUIRED', {
      field: 'itemLabel',
    })
  }

  return billType === 'OTHER' ? normalizedItemLabel : null
}

function generateBillNumber(type: string, contractNumber: string): string {
  const timestamp = Date.now().toString().slice(-6)
  const typePrefix =
    {
      RENT: 'R',
      DEPOSIT: 'D',
      UTILITIES: 'U',
      OTHER: 'O',
    }[type] || 'B'

  return `BILL${contractNumber.slice(-3)}${typePrefix}${timestamp}`
}

function buildContractBaseBillDrafts(contract: ContractForBaseBills) {
  const drafts: Array<{
    type: 'RENT' | 'DEPOSIT' | 'OTHER'
    itemLabel?: string
    amount: number
    dueDate: Date
    period: string
    paymentMethod: string
    remarks: string
  }> = []

  const fullContractPeriod = `${contract.startDate.toISOString().slice(0, 10)} 至 ${contract.endDate.toISOString().slice(0, 10)}`
  const paymentMethodLabel = contract.paymentMethod || '待确定'

  if (Number(contract.deposit) > 0) {
    drafts.push({
      type: 'DEPOSIT',
      amount: Number(contract.deposit),
      dueDate: contract.startDate,
      period: fullContractPeriod,
      paymentMethod: paymentMethodLabel,
      remarks: `押金账单 - 合同${contract.contractNumber}`,
    })
  }

  if (contract.keyDeposit && Number(contract.keyDeposit) > 0) {
    drafts.push({
      type: 'OTHER',
      itemLabel: '钥匙押金',
      amount: Number(contract.keyDeposit),
      dueDate: contract.startDate,
      period: fullContractPeriod,
      paymentMethod: paymentMethodLabel,
      remarks: `钥匙押金 - 合同${contract.contractNumber}`,
    })
  }

  if (contract.cleaningFee && Number(contract.cleaningFee) > 0) {
    drafts.push({
      type: 'OTHER',
      itemLabel: '卫生费',
      amount: Number(contract.cleaningFee),
      dueDate: contract.startDate,
      period: fullContractPeriod,
      paymentMethod: paymentMethodLabel,
      remarks: `卫生费 - 合同${contract.contractNumber}`,
    })
  }

  const rentBillPlan = buildContractRentBillPlan(
    contract.startDate,
    contract.endDate,
    contract.monthlyRent,
    contract.paymentMethod
  )

  for (const period of rentBillPlan.periods) {
    drafts.push({
      type: 'RENT',
      amount: rentBillPlan.rentAmountPerPeriod,
      dueDate: period.dueDate,
      period: period.periodLabel,
      paymentMethod: paymentMethodLabel,
      remarks: `${rentBillPlan.paymentCycleLabel}租金 - 合同${contract.contractNumber} - 第${period.index}期`,
    })
  }

  return {
    paymentCycle: rentBillPlan.paymentCycle,
    paymentCycleLabel: rentBillPlan.paymentCycleLabel,
    drafts,
  }
}

async function getContractForBaseBills(
  db: typeof prisma | Prisma.TransactionClient,
  contractId: string,
  includeBills = false
) {
  return db.contract.findUnique({
    where: { id: contractId },
    include: {
      room: {
        include: {
          building: true,
        },
      },
      renter: true,
      bills: includeBills
        ? {
            select: {
              id: true,
              type: true,
              period: true,
            },
          }
        : false,
    },
  })
}

export async function performBillDeleteSafetyCheck(
  billId: string
): Promise<BillDeleteSafetyCheck> {
  const bill = await getBillDeleteGuardSnapshot(prisma, billId)

  if (!bill) {
    throw new Error('Bill not found')
  }

  return buildBillDeleteSafetyCheck(bill)
}

export async function deletePendingBillWithoutHistory(
  billId: string
): Promise<{
  success: true
  action: 'hard_delete'
  message: string
  billId: string
  contractId: string
}> {
  return runWithSerializableTransaction(async (tx) => {
    const bill = await getBillDeleteGuardSnapshot(tx, billId)

    if (!bill) {
      throw new Error('Bill not found')
    }

    const safetyCheck = buildBillDeleteSafetyCheck(bill)
    if (!safetyCheck.canDelete) {
      throw new BillDeleteGuardBlockedError('无法删除账单', safetyCheck)
    }

    await tx.bill.delete({
      where: { id: billId },
    })

    return {
      success: true,
      action: 'hard_delete' as const,
      message: '账单删除成功，仅删除了未进入正式账务链的待付款账单',
      billId,
      contractId: bill.contractId,
    }
  })
}

export async function getBillingSemanticsSnapshot(
  billId: string
): Promise<BillingSemanticsSnapshot> {
  const bill = await getBillDeleteGuardSnapshot(prisma, billId)

  if (!bill) {
    throw new Error('Bill not found')
  }

  const amounts = resolveBillAmounts({
    amount: Number(bill.amount),
    receivedAmount: Number(bill.receivedAmount),
    pendingAmount: Number(bill.pendingAmount),
  })
  const status = resolveBillStatus({
    requestedStatus: bill.status,
    pendingAmount: amounts.pendingAmount,
  })
  const paymentCycleLabel =
    bill.type === 'RENT'
      ? formatContractPaymentCycle(
          normalizeContractPaymentCycle(bill.contract.paymentMethod)
        )
      : null

  return {
    billId: bill.id,
    billNumber: bill.billNumber,
    type: bill.type,
    status,
    requestedPaymentCycleLabel: paymentCycleLabel,
    amounts,
    presentationStatus: getBillPresentationStatus({
      status,
      pendingAmount: amounts.pendingAmount,
    }),
    isOpen: isOpenBillStatus(status),
    isSettled: isBillSettled(amounts.pendingAmount),
    deleteGuard: buildBillDeleteSafetyCheck(bill),
  }
}

export async function updatePendingBillDraft(
  billId: string,
  input: UpdateBillDraftInput
): Promise<SerializedBill> {
  return runWithSerializableTransaction(async (tx) => {
    const existingBill = await tx.bill.findUnique({
      where: { id: billId },
      include: getBillInclude(),
    })

    if (!existingBill) {
      throw new Error('Bill not found')
    }

    if (existingBill.status !== 'PENDING') {
      throw new BillingDomainValidationError(
        '只有待付款状态的账单才能编辑关键信息',
        'BILL_EDIT_RESTRICTED_TO_PENDING',
        {
          currentStatus: existingBill.status,
        }
      )
    }

    const amount = input.amount ?? Number(existingBill.amount)
    const normalizedAmounts = resolveBillAmounts({
      amount,
      receivedAmount: Number(existingBill.receivedAmount),
      pendingAmount:
        input.pendingAmount !== undefined
          ? input.pendingAmount
          : Number(existingBill.pendingAmount),
    })

    const nextStatus = resolveBillStatus({
      requestedStatus: 'PENDING',
      pendingAmount: normalizedAmounts.pendingAmount,
    })

    const updatedBill = await tx.bill.update({
      where: { id: billId },
      data: {
        amount: normalizedAmounts.amount,
        receivedAmount: normalizedAmounts.receivedAmount,
        pendingAmount: normalizedAmounts.pendingAmount,
        status: nextStatus,
        dueDate: parseDueDate(input.dueDate),
        period: input.period !== undefined ? input.period : undefined,
        itemLabel: normalizeOtherBillItemLabel(
          existingBill.type,
          input.itemLabel,
          existingBill.itemLabel
        ),
        remarks: input.remarks !== undefined ? input.remarks : undefined,
      },
      include: getBillInclude(),
    })

    return serializeBillWithContract(updatedBill)
  })
}

export async function updateBillCollectionStatus(
  billId: string,
  input: UpdateBillStatusInput
): Promise<SerializedBill> {
  return runWithSerializableTransaction(async (tx) => {
    const existingBill = await tx.bill.findUnique({
      where: { id: billId },
      include: getBillInclude(),
    })

    if (!existingBill) {
      throw new Error('Bill not found')
    }

    const normalizedAmounts = resolveBillAmounts({
      amount: Number(existingBill.amount),
      receivedAmount:
        input.receivedAmount !== undefined
          ? input.receivedAmount
          : Number(existingBill.receivedAmount),
      pendingAmount:
        input.pendingAmount !== undefined
          ? input.pendingAmount
          : Number(existingBill.pendingAmount),
    })

    if (
      input.status === 'COMPLETED' &&
      normalizedAmounts.pendingAmount > BILL_AMOUNT_EPSILON
    ) {
      throw new BillingDomainValidationError(
        '已完成账单必须满足待收金额为 0',
        'BILL_COMPLETED_REQUIRES_ZERO_PENDING_AMOUNT',
        {
          pendingAmount: normalizedAmounts.pendingAmount,
        }
      )
    }

    const openStatusBase =
      input.status === 'OVERDUE'
        ? 'OVERDUE'
        : existingBill.status === 'OVERDUE'
          ? 'OVERDUE'
          : 'PENDING'

    const normalizedStatus = resolveBillStatus({
      requestedStatus:
        input.status === 'COMPLETED' ? 'COMPLETED' : openStatusBase,
      pendingAmount: normalizedAmounts.pendingAmount,
    })

    const hasPaymentChange =
      Math.abs(
        normalizedAmounts.receivedAmount - Number(existingBill.receivedAmount)
      ) > BILL_AMOUNT_EPSILON

    const paidDate =
      input.paidDate === undefined
        ? hasPaymentChange || normalizedStatus === 'PAID' || normalizedStatus === 'COMPLETED'
          ? existingBill.paidDate || (normalizedAmounts.receivedAmount > 0 ? new Date() : null)
          : normalizedAmounts.receivedAmount === 0
            ? null
            : existingBill.paidDate
        : input.paidDate === null
          ? null
          : parseDueDate(input.paidDate)

    const updatedBill = await tx.bill.update({
      where: { id: billId },
      data: {
        status: normalizedStatus,
        receivedAmount: normalizedAmounts.receivedAmount,
        pendingAmount: normalizedAmounts.pendingAmount,
        paidDate,
        paymentMethod:
          input.paymentMethod !== undefined ? input.paymentMethod : undefined,
        operator: input.operator !== undefined ? input.operator : undefined,
        remarks: input.remarks !== undefined ? input.remarks : undefined,
      },
      include: getBillInclude(),
    })

    return serializeBillWithContract(updatedBill)
  })
}

export async function generateBaseBillsForContract(
  contractId: string
): Promise<GeneratedBaseBillSummary[]> {
  return runWithSerializableTransaction(async (tx) => {
    const contract = await getContractForBaseBills(tx, contractId)

    if (!contract) {
      throw new Error('Contract not found')
    }

    const { drafts } = buildContractBaseBillDrafts({
      ...contract,
      bills: [],
    } as ContractForBaseBills)

    const createdBills: GeneratedBaseBillSummary[] = []

    for (const draft of drafts) {
      const createdBill = await tx.bill.create({
        data: {
          billNumber: generateBillNumber(draft.type, contract.contractNumber),
          type: draft.type,
          itemLabel: draft.itemLabel,
          amount: draft.amount,
          receivedAmount: 0,
          pendingAmount: draft.amount,
          dueDate: draft.dueDate,
          period: draft.period,
          status: 'PENDING',
          contractId: contract.id,
          paymentMethod: draft.paymentMethod,
          operator: 'SYSTEM',
          remarks: draft.remarks,
        },
        include: getBillInclude(),
      })

      createdBills.push(serializeGeneratedBillSummary(createdBill))
    }

    return createdBills
  })
}

export async function repairMissingRentBillsForContract(
  contractId: string
): Promise<GeneratedBaseBillSummary[]> {
  return runWithSerializableTransaction(async (tx) => {
    const contract = await getContractForBaseBills(tx, contractId, true)

    if (!contract) {
      throw new Error('Contract not found')
    }

    const rentBillPlan = buildContractRentBillPlan(
      contract.startDate,
      contract.endDate,
      contract.monthlyRent,
      contract.paymentMethod
    )

    const existingPeriods = new Set(
      (contract.bills || [])
        .filter((bill) => bill.type === 'RENT')
        .map((bill) => bill.period)
    )

    const createdBills: GeneratedBaseBillSummary[] = []
    for (const period of rentBillPlan.periods) {
      if (existingPeriods.has(period.periodLabel)) {
        continue
      }

      const createdBill = await tx.bill.create({
        data: {
          billNumber: generateBillNumber('RENT', contract.contractNumber),
          type: 'RENT',
          amount: rentBillPlan.rentAmountPerPeriod,
          receivedAmount: 0,
          pendingAmount: rentBillPlan.rentAmountPerPeriod,
          dueDate: period.dueDate,
          period: period.periodLabel,
          status: 'PENDING',
          contractId: contract.id,
          paymentMethod: contract.paymentMethod || '待确定',
          operator: 'SYSTEM',
          remarks: `${rentBillPlan.paymentCycleLabel}租金账单 - 第${period.index}期 - 补充生成`,
        },
        include: getBillInclude(),
      })

      createdBills.push(serializeGeneratedBillSummary(createdBill))
    }

    return createdBills
  })
}

export const billingDomainService = {
  getBillingSemanticsSnapshot,
  updatePendingBillDraft,
  updateBillCollectionStatus,
  performBillDeleteSafetyCheck,
  deletePendingBillWithoutHistory,
  generateBaseBillsForContract,
  repairMissingRentBillsForContract,
}
