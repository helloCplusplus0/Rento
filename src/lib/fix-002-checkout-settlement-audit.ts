import { prisma } from './prisma'

const MONEY_EPSILON = 0.01
const CHECKOUT_SETTLEMENT_MANUAL_UPDATE_THRESHOLD_MS = 5_000
const CHECKOUT_SETTLEMENT_PERIOD_PREFIX = '退租结算-'
const CHECKOUT_SETTLEMENT_TEXT_MARKER = '退租结算'
const CHECKOUT_SETTLEMENT_METADATA_SOURCE = 'checkout-settlement'

type DecimalLike = number | string | { toNumber(): number }

export type HistoricalCheckoutSettlementDetectionSignal =
  | 'TYPE_OTHER'
  | 'PERIOD_PREFIX_MATCH'
  | 'REMARKS_KEYWORD_MATCH'
  | 'PAYMENT_METHOD_MATCH'
  | 'METADATA_SOURCE_MATCH'

export type HistoricalCheckoutSettlementMismatchReason =
  | 'MISSING_STRUCTURED_METADATA'
  | 'INVALID_STRUCTURED_METADATA'
  | 'METADATA_CONTRACT_MISMATCH'
  | 'METADATA_SUMMARY_ITEM_TOTAL_MISMATCH'
  | 'METADATA_BILL_AMOUNT_MISMATCH'
  | 'METADATA_BILL_RECEIVED_AMOUNT_MISMATCH'
  | 'METADATA_BILL_PENDING_AMOUNT_MISMATCH'
  | 'SETTLEMENT_BILL_STATUS_SHOULD_BE_COMPLETED'

export type CheckoutSettlementAutoFixEvaluationBlockedReason =
  | 'STATUS_NOT_PENDING'
  | 'HAS_RECEIVED_AMOUNT'
  | 'HAS_PENDING_AMOUNT_DRIFT'
  | 'HAS_PAID_DATE'
  | 'HAS_METER_READING_LINK'
  | 'HAS_BILL_DETAIL_HISTORY'
  | 'HAS_LATE_UPDATE_TRACE'
  | 'HAS_MANUAL_SETTLEMENT_ADJUSTMENT'
  | 'MISSING_STRUCTURED_METADATA'
  | 'INVALID_STRUCTURED_METADATA'
  | 'UNTRUSTED_METADATA_CONTRACT'
  | 'UNTRUSTED_METADATA_SUMMARY'

interface CandidateCheckoutSettlementBill {
  id: string
  billNumber: string
  type: string
  amount: DecimalLike
  receivedAmount: DecimalLike
  pendingAmount: DecimalLike
  dueDate: Date
  paidDate: Date | null
  period: string | null
  status: string
  paymentMethod: string | null
  operator: string | null
  remarks: string | null
  metadata: string | null
  meterReadingId: string | null
  createdAt: Date
  updatedAt: Date
  billDetails: Array<{ id: string }>
  contract: {
    id: string
    contractNumber: string
    status: string
    businessStatus: string | null
  }
}

export interface HistoricalCheckoutSettlementAuditResult {
  billId: string
  billNumber: string
  contractId: string
  contractNumber: string
  contractStatus: string
  contractBusinessStatus: string | null
  detectionSignals: HistoricalCheckoutSettlementDetectionSignal[]
  checkoutDateHint: string
  status: string
  amount: number
  receivedAmount: number
  pendingAmount: number
  paymentMethod: string | null
  operator: string | null
  remarks: string | null
  hasStructuredMetadata: boolean
  metadataTrusted: boolean
  metadataSource: string | null
  metadataCheckoutDate: string | null
  metadataCheckoutReason: string | null
  metadataOperator: string | null
  metadataSettlementType: string | null
  metadataNetAmount: number | null
  metadataTotalRefund: number | null
  metadataTotalCharge: number | null
  metadataItemCount: number
  adjustedMetadataItemIds: string[]
  mismatchReasons: HistoricalCheckoutSettlementMismatchReason[]
  autoFixEvaluationBlockedReasons: CheckoutSettlementAutoFixEvaluationBlockedReason[]
  eligibleForAutoFixEvaluation: boolean
  manualHandlingStrategy: string
}

export interface HistoricalCheckoutSettlementAuditSummary {
  totalAuditedCandidates: number
  totalFlaggedBills: number
  autoFixEvaluationEligibleBills: number
  auditOnlyBills: number
  results: HistoricalCheckoutSettlementAuditResult[]
}

interface AuditFilters {
  contractNumbers?: string[]
  billNumbers?: string[]
}

interface ParsedCheckoutMetadataItem {
  id: string
  direction: string
  originalAmount: number
  adjustedAmount: number
  adjustmentReason: string
}

interface ParsedCheckoutMetadataSummary {
  totalRefund: number
  totalCharge: number
  netAmount: number
  settlementType: string
}

interface ParsedCheckoutSettlementMetadata {
  exists: boolean
  contractId: string | null
  source: string | null
  checkoutDate: string | null
  checkoutReason: string | null
  operator: string | null
  summary: ParsedCheckoutMetadataSummary | null
  items: ParsedCheckoutMetadataItem[]
  parseError: string | null
  isStructured: boolean
}

function toMoneyNumber(value: DecimalLike): number {
  const numericValue =
    typeof value === 'object' && value !== null && 'toNumber' in value
      ? value.toNumber()
      : Number(value)

  if (!Number.isFinite(numericValue)) {
    throw new Error(`无效金额值: ${String(value)}`)
  }

  return Math.round(numericValue * 100) / 100
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function isSameMoney(left: DecimalLike, right: DecimalLike): boolean {
  return Math.abs(toMoneyNumber(left) - toMoneyNumber(right)) < MONEY_EPSILON
}

function hasLateUpdateTrace(bill: CandidateCheckoutSettlementBill): boolean {
  return (
    bill.updatedAt.getTime() - bill.createdAt.getTime() >
    CHECKOUT_SETTLEMENT_MANUAL_UPDATE_THRESHOLD_MS
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseMetadataSummary(
  summary: unknown
): ParsedCheckoutMetadataSummary | null {
  if (!isRecord(summary)) {
    return null
  }

  const totalRefund = Number(summary.totalRefund)
  const totalCharge = Number(summary.totalCharge)
  const netAmount = Number(summary.netAmount)
  const settlementType =
    typeof summary.settlementType === 'string' ? summary.settlementType : null

  if (
    !Number.isFinite(totalRefund) ||
    !Number.isFinite(totalCharge) ||
    !Number.isFinite(netAmount) ||
    !settlementType
  ) {
    return null
  }

  return {
    totalRefund: toMoneyNumber(totalRefund),
    totalCharge: toMoneyNumber(totalCharge),
    netAmount: toMoneyNumber(netAmount),
    settlementType,
  }
}

function parseMetadataItems(items: unknown): ParsedCheckoutMetadataItem[] | null {
  if (!Array.isArray(items)) {
    return null
  }

  const parsedItems: ParsedCheckoutMetadataItem[] = []

  for (const item of items) {
    if (!isRecord(item) || typeof item.id !== 'string') {
      return null
    }

    const originalAmount = Number(item.originalAmount)
    const adjustedAmount = Number(item.adjustedAmount)

    if (!Number.isFinite(originalAmount) || !Number.isFinite(adjustedAmount)) {
      return null
    }

    parsedItems.push({
      id: item.id,
      direction: typeof item.direction === 'string' ? item.direction : '',
      originalAmount: toMoneyNumber(originalAmount),
      adjustedAmount: toMoneyNumber(adjustedAmount),
      adjustmentReason:
        typeof item.adjustmentReason === 'string' ? item.adjustmentReason.trim() : '',
    })
  }

  return parsedItems
}

function parseCheckoutSettlementMetadata(
  metadata: string | null
): ParsedCheckoutSettlementMetadata {
  if (!metadata) {
    return {
      exists: false,
      contractId: null,
      source: null,
      checkoutDate: null,
      checkoutReason: null,
      operator: null,
      summary: null,
      items: [],
      parseError: null,
      isStructured: false,
    }
  }

  try {
    const parsed = JSON.parse(metadata) as unknown
    if (!isRecord(parsed)) {
      return {
        exists: true,
        contractId: null,
        source: null,
        checkoutDate: null,
        checkoutReason: null,
        operator: null,
        summary: null,
        items: [],
        parseError: 'JSON_NOT_OBJECT',
        isStructured: false,
      }
    }

    const summary = parseMetadataSummary(parsed.summary)
    const items = parseMetadataItems(parsed.items)
    const contractId =
      typeof parsed.contractId === 'string' ? parsed.contractId : null
    const source = typeof parsed.source === 'string' ? parsed.source : null
    const checkoutDate =
      typeof parsed.checkoutDate === 'string' ? parsed.checkoutDate : null
    const checkoutReason =
      typeof parsed.checkoutReason === 'string' ? parsed.checkoutReason : null
    const operator = typeof parsed.operator === 'string' ? parsed.operator : null
    const isStructured =
      source === CHECKOUT_SETTLEMENT_METADATA_SOURCE &&
      summary !== null &&
      items !== null

    return {
      exists: true,
      contractId,
      source,
      checkoutDate,
      checkoutReason,
      operator,
      summary,
      items: items ?? [],
      parseError: isStructured ? null : 'STRUCTURE_INVALID',
      isStructured,
    }
  } catch {
    return {
      exists: true,
      contractId: null,
      source: null,
      checkoutDate: null,
      checkoutReason: null,
      operator: null,
      summary: null,
      items: [],
      parseError: 'JSON_PARSE_FAILED',
      isStructured: false,
    }
  }
}

function detectCheckoutSettlementSignals(
  bill: CandidateCheckoutSettlementBill,
  metadata: ParsedCheckoutSettlementMetadata
): HistoricalCheckoutSettlementDetectionSignal[] {
  const signals: HistoricalCheckoutSettlementDetectionSignal[] = []

  if (bill.type === 'OTHER') {
    signals.push('TYPE_OTHER')
  }

  if (bill.period?.startsWith(CHECKOUT_SETTLEMENT_PERIOD_PREFIX)) {
    signals.push('PERIOD_PREFIX_MATCH')
  }

  if (bill.remarks?.includes(CHECKOUT_SETTLEMENT_TEXT_MARKER)) {
    signals.push('REMARKS_KEYWORD_MATCH')
  }

  if (bill.paymentMethod === CHECKOUT_SETTLEMENT_TEXT_MARKER) {
    signals.push('PAYMENT_METHOD_MATCH')
  }

  if (metadata.source === CHECKOUT_SETTLEMENT_METADATA_SOURCE) {
    signals.push('METADATA_SOURCE_MATCH')
  }

  return signals
}

function buildExpectedBillAmountFromSummary(
  summary: ParsedCheckoutMetadataSummary
): number {
  const netAmount = toMoneyNumber(summary.netAmount)

  if (summary.settlementType === 'REFUND') {
    return -Math.abs(netAmount)
  }

  if (summary.settlementType === 'CHARGE') {
    return Math.abs(netAmount)
  }

  return 0
}

function buildExpectedBillReceivedAmountFromSummary(
  summary: ParsedCheckoutMetadataSummary
): number {
  if (summary.settlementType === 'CHARGE') {
    return Math.abs(toMoneyNumber(summary.netAmount))
  }

  return 0
}

function buildMetadataItemTotals(items: ParsedCheckoutMetadataItem[]) {
  const refundTotal = toMoneyNumber(
    items
      .filter((item) => item.direction === 'REFUND')
      .reduce((sum, item) => sum + item.adjustedAmount, 0)
  )
  const chargeTotal = toMoneyNumber(
    items
      .filter((item) => item.direction === 'CHARGE')
      .reduce((sum, item) => sum + item.adjustedAmount, 0)
  )

  return {
    refundTotal,
    chargeTotal,
    netAmount: toMoneyNumber(chargeTotal - refundTotal),
  }
}

function buildManualHandlingStrategy(
  mismatchReasons: HistoricalCheckoutSettlementMismatchReason[],
  blockedReasons: CheckoutSettlementAutoFixEvaluationBlockedReason[]
): string {
  if (blockedReasons.length === 0) {
    return '仅允许进入后续自动修复评估；当前工具不会直接改写历史退租结算账单。'
  }

  if (
    blockedReasons.includes('STATUS_NOT_PENDING') ||
    blockedReasons.includes('HAS_RECEIVED_AMOUNT') ||
    blockedReasons.includes('HAS_PAID_DATE')
  ) {
    return '仅输出审计清单；该账单已进入收款或结清流程，禁止自动修复评估。'
  }

  if (
    blockedReasons.includes('HAS_MANUAL_SETTLEMENT_ADJUSTMENT') ||
    blockedReasons.includes('HAS_LATE_UPDATE_TRACE')
  ) {
    return '仅输出审计清单；检测到人工调整或后续修改痕迹，需要人工复核结算意图。'
  }

  if (
    blockedReasons.includes('MISSING_STRUCTURED_METADATA') ||
    blockedReasons.includes('INVALID_STRUCTURED_METADATA') ||
    blockedReasons.includes('UNTRUSTED_METADATA_CONTRACT') ||
    blockedReasons.includes('UNTRUSTED_METADATA_SUMMARY')
  ) {
    return '仅输出审计清单；缺少可信的结构化退租结算证据，无法安全进入自动修复评估。'
  }

  if (
    mismatchReasons.includes('METADATA_BILL_AMOUNT_MISMATCH') ||
    mismatchReasons.includes('METADATA_BILL_RECEIVED_AMOUNT_MISMATCH') ||
    mismatchReasons.includes('METADATA_BILL_PENDING_AMOUNT_MISMATCH')
  ) {
    return '识别到结算金额与结构化审计元数据不一致，但当前记录未满足全部安全边界，需人工确认后再决定是否修复。'
  }

  return '仅输出审计清单；当前记录超出 fix_002 历史退租结算安全边界。'
}

async function loadCandidateBills(
  filters: AuditFilters = {}
): Promise<CandidateCheckoutSettlementBill[]> {
  return prisma.bill.findMany({
    where: {
      type: 'OTHER',
      OR: [
        {
          period: {
            startsWith: CHECKOUT_SETTLEMENT_PERIOD_PREFIX,
          },
        },
        {
          remarks: {
            contains: CHECKOUT_SETTLEMENT_TEXT_MARKER,
          },
        },
        {
          paymentMethod: CHECKOUT_SETTLEMENT_TEXT_MARKER,
        },
        {
          metadata: {
            contains: `"source":"${CHECKOUT_SETTLEMENT_METADATA_SOURCE}"`,
          },
        },
      ],
      ...(filters.contractNumbers?.length
        ? {
            contract: {
              contractNumber: {
                in: filters.contractNumbers,
              },
            },
          }
        : {}),
      ...(filters.billNumbers?.length
        ? {
            billNumber: {
              in: filters.billNumbers,
            },
          }
        : {}),
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      billNumber: true,
      type: true,
      amount: true,
      receivedAmount: true,
      pendingAmount: true,
      dueDate: true,
      paidDate: true,
      period: true,
      status: true,
      paymentMethod: true,
      operator: true,
      remarks: true,
      metadata: true,
      meterReadingId: true,
      createdAt: true,
      updatedAt: true,
      billDetails: {
        select: {
          id: true,
        },
      },
      contract: {
        select: {
          id: true,
          contractNumber: true,
          status: true,
          businessStatus: true,
        },
      },
    },
  })
}

function evaluateHistoricalCheckoutSettlementBill(
  bill: CandidateCheckoutSettlementBill
): HistoricalCheckoutSettlementAuditResult | null {
  const metadata = parseCheckoutSettlementMetadata(bill.metadata)
  const detectionSignals = detectCheckoutSettlementSignals(bill, metadata)
  if (detectionSignals.length === 0) {
    return null
  }

  const amount = toMoneyNumber(bill.amount)
  const receivedAmount = toMoneyNumber(bill.receivedAmount)
  const pendingAmount = toMoneyNumber(bill.pendingAmount)
  const mismatchReasons: HistoricalCheckoutSettlementMismatchReason[] = []
  let metadataTrusted = false

  if (!metadata.exists) {
    mismatchReasons.push('MISSING_STRUCTURED_METADATA')
  } else if (!metadata.isStructured || !metadata.summary) {
    mismatchReasons.push('INVALID_STRUCTURED_METADATA')
  } else {
    const expectedAmount = buildExpectedBillAmountFromSummary(metadata.summary)
    const expectedReceivedAmount = buildExpectedBillReceivedAmountFromSummary(
      metadata.summary
    )
    const itemTotals = buildMetadataItemTotals(metadata.items)

    if (metadata.contractId && metadata.contractId !== bill.contract.id) {
      mismatchReasons.push('METADATA_CONTRACT_MISMATCH')
    }

    if (
      !isSameMoney(itemTotals.refundTotal, metadata.summary.totalRefund) ||
      !isSameMoney(itemTotals.chargeTotal, metadata.summary.totalCharge) ||
      !isSameMoney(itemTotals.netAmount, metadata.summary.netAmount)
    ) {
      mismatchReasons.push('METADATA_SUMMARY_ITEM_TOTAL_MISMATCH')
    }

    if (!isSameMoney(expectedAmount, amount)) {
      mismatchReasons.push('METADATA_BILL_AMOUNT_MISMATCH')
    }

    if (!isSameMoney(expectedReceivedAmount, receivedAmount)) {
      mismatchReasons.push('METADATA_BILL_RECEIVED_AMOUNT_MISMATCH')
    }

    if (!isSameMoney(pendingAmount, 0)) {
      mismatchReasons.push('METADATA_BILL_PENDING_AMOUNT_MISMATCH')
    }

    if (bill.status !== 'COMPLETED') {
      mismatchReasons.push('SETTLEMENT_BILL_STATUS_SHOULD_BE_COMPLETED')
    }

    metadataTrusted =
      !mismatchReasons.includes('METADATA_CONTRACT_MISMATCH') &&
      !mismatchReasons.includes('METADATA_SUMMARY_ITEM_TOTAL_MISMATCH')
  }

  if (mismatchReasons.length === 0) {
    return null
  }

  const adjustedMetadataItemIds = metadata.items
    .filter(
      (item) =>
        !isSameMoney(item.adjustedAmount, item.originalAmount) || item.adjustmentReason !== ''
    )
    .map((item) => item.id)

  const blockedReasons: CheckoutSettlementAutoFixEvaluationBlockedReason[] = []

  if (bill.status !== 'PENDING') {
    blockedReasons.push('STATUS_NOT_PENDING')
  }

  if (!isSameMoney(receivedAmount, 0)) {
    blockedReasons.push('HAS_RECEIVED_AMOUNT')
  }

  if (!isSameMoney(pendingAmount, amount)) {
    blockedReasons.push('HAS_PENDING_AMOUNT_DRIFT')
  }

  if (bill.paidDate !== null) {
    blockedReasons.push('HAS_PAID_DATE')
  }

  if (bill.meterReadingId !== null) {
    blockedReasons.push('HAS_METER_READING_LINK')
  }

  if (bill.billDetails.length > 0) {
    blockedReasons.push('HAS_BILL_DETAIL_HISTORY')
  }

  if (hasLateUpdateTrace(bill)) {
    blockedReasons.push('HAS_LATE_UPDATE_TRACE')
  }

  if (adjustedMetadataItemIds.length > 0) {
    blockedReasons.push('HAS_MANUAL_SETTLEMENT_ADJUSTMENT')
  }

  if (!metadata.exists) {
    blockedReasons.push('MISSING_STRUCTURED_METADATA')
  } else if (!metadata.isStructured || !metadata.summary) {
    blockedReasons.push('INVALID_STRUCTURED_METADATA')
  } else {
    if (mismatchReasons.includes('METADATA_CONTRACT_MISMATCH')) {
      blockedReasons.push('UNTRUSTED_METADATA_CONTRACT')
    }

    if (mismatchReasons.includes('METADATA_SUMMARY_ITEM_TOTAL_MISMATCH')) {
      blockedReasons.push('UNTRUSTED_METADATA_SUMMARY')
    }
  }

  const uniqueBlockedReasons = Array.from(new Set(blockedReasons))

  return {
    billId: bill.id,
    billNumber: bill.billNumber,
    contractId: bill.contract.id,
    contractNumber: bill.contract.contractNumber,
    contractStatus: bill.contract.status,
    contractBusinessStatus: bill.contract.businessStatus,
    detectionSignals,
    checkoutDateHint: metadata.checkoutDate?.slice(0, 10) ?? formatDateKey(bill.dueDate),
    status: bill.status,
    amount,
    receivedAmount,
    pendingAmount,
    paymentMethod: bill.paymentMethod,
    operator: bill.operator,
    remarks: bill.remarks,
    hasStructuredMetadata: metadata.isStructured,
    metadataTrusted,
    metadataSource: metadata.source,
    metadataCheckoutDate: metadata.checkoutDate,
    metadataCheckoutReason: metadata.checkoutReason,
    metadataOperator: metadata.operator,
    metadataSettlementType: metadata.summary?.settlementType ?? null,
    metadataNetAmount: metadata.summary?.netAmount ?? null,
    metadataTotalRefund: metadata.summary?.totalRefund ?? null,
    metadataTotalCharge: metadata.summary?.totalCharge ?? null,
    metadataItemCount: metadata.items.length,
    adjustedMetadataItemIds,
    mismatchReasons,
    autoFixEvaluationBlockedReasons: uniqueBlockedReasons,
    eligibleForAutoFixEvaluation: uniqueBlockedReasons.length === 0,
    manualHandlingStrategy: buildManualHandlingStrategy(
      mismatchReasons,
      uniqueBlockedReasons
    ),
  }
}

export async function auditHistoricalCheckoutSettlementBills(
  filters: AuditFilters = {}
): Promise<HistoricalCheckoutSettlementAuditSummary> {
  const candidateBills = await loadCandidateBills(filters)
  const results = candidateBills
    .map((bill) => evaluateHistoricalCheckoutSettlementBill(bill))
    .filter(
      (result): result is HistoricalCheckoutSettlementAuditResult => result !== null
    )

  return {
    totalAuditedCandidates: candidateBills.length,
    totalFlaggedBills: results.length,
    autoFixEvaluationEligibleBills: results.filter(
      (result) => result.eligibleForAutoFixEvaluation
    ).length,
    auditOnlyBills: results.filter((result) => !result.eligibleForAutoFixEvaluation)
      .length,
    results,
  }
}
