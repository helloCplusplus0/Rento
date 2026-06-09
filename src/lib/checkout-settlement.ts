import {
  BILL_AMOUNT_EPSILON,
  OPEN_BILL_STATUSES,
  resolveBillStatus,
  type BillPresentationStatus,
  type SharedBillStatus,
  toBillAmount,
} from '@/lib/bill-semantics'

export type CheckoutSettlementType = 'REFUND' | 'CHARGE' | 'BALANCED'
export type CheckoutSettlementLineItemDirection = 'REFUND' | 'CHARGE'
export type CheckoutSettlementLineItemSource =
  | 'RENT_REFUND'
  | 'DEPOSIT_REFUND'
  | 'KEY_DEPOSIT_REFUND'
  | 'RENT_CHARGE'
  | 'DAMAGE_CHARGE'
  | 'OPEN_BILL'

export interface CheckoutSettlementBillInput {
  id?: string
  billNumber: string
  type: string
  amount: unknown
  receivedAmount?: unknown
  pendingAmount: unknown
  status: SharedBillStatus
}

export interface CheckoutSettlementContractInput {
  startDate: Date | string
  endDate: Date | string
  monthlyRent: unknown
  totalRent: unknown
  deposit: unknown
  keyDeposit?: unknown
  bills?: CheckoutSettlementBillInput[]
}

export interface CheckoutSettlementLineItem {
  id: string
  name: string
  amount: number
  originalAmount: number
  formula: string
  direction: CheckoutSettlementLineItemDirection
  sourceType: CheckoutSettlementLineItemSource
  editable: boolean
  minAdjustableAmount: number
  maxAdjustableAmount: number
  billNumber?: string
  billStatus?: SharedBillStatus
  billReceivedAmount?: number
  billPendingAmount?: number
  presentationStatus?: BillPresentationStatus
  lockedReason?: string
  billId?: string
}

export interface CheckoutSettlementSubmissionItem {
  id: string
  name: string
  direction: CheckoutSettlementLineItemDirection
  sourceType: CheckoutSettlementLineItemSource
  originalAmount: number
  adjustedAmount: unknown
  adjustmentReason?: string | null
  billId?: string
}

export interface NormalizedCheckoutSettlementSubmissionItem
  extends Omit<CheckoutSettlementSubmissionItem, 'adjustedAmount'> {
  adjustedAmount: number
  adjustmentReason: string
}

export interface AppliedCheckoutSettlementLineItem
  extends CheckoutSettlementLineItem {
  adjustedAmount: number
  adjustmentReason: string
  isAdjusted: boolean
}

export interface CheckoutSettlementResult {
  refundItems: {
    rentRefund: number
    depositRefund: number
    keyDepositRefund: number
    subtotal: number
  }
  chargeItems: {
    rentCharge: number
    damageCharge: number
    unpaidBillsCharge: number
    subtotal: number
  }
  summary: {
    totalRefund: number
    totalCharge: number
    netAmount: number
    settlementType: CheckoutSettlementType
  }
  calculationDetails: {
    actualDays: number
    totalDays: number
    dailyRent: number
    shouldPayRent: number
    paidRent: number
    rentDifference: number
    unpaidBills: Array<{
      id?: string
      billNumber: string
      type: string
      amount: number
      receivedAmount: number
      pendingAmount: number
      status: SharedBillStatus
    }>
  }
  lineItems: {
    refund: CheckoutSettlementLineItem[]
    charge: CheckoutSettlementLineItem[]
  }
  description: string
}

export interface AppliedCheckoutSettlementResult
  extends Omit<CheckoutSettlementResult, 'lineItems' | 'description'> {
  lineItems: {
    refund: AppliedCheckoutSettlementLineItem[]
    charge: AppliedCheckoutSettlementLineItem[]
  }
  description: string
  submissionItems: NormalizedCheckoutSettlementSubmissionItem[]
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function formatMoney(value: number): string {
  return roundCurrency(value).toFixed(2)
}

function buildSettlementType(netAmount: number): CheckoutSettlementType {
  if (netAmount > 0) {
    return 'CHARGE'
  }

  if (netAmount < 0) {
    return 'REFUND'
  }

  return 'BALANCED'
}

export function calculateCheckoutSettlement(
  contract: CheckoutSettlementContractInput,
  params: {
    checkoutDate: Date | string
    damageAssessment?: number
  }
): CheckoutSettlementResult {
  const checkoutDate = new Date(params.checkoutDate)
  const startDate = new Date(contract.startDate)
  const endDate = new Date(contract.endDate)
  const monthlyRent = toBillAmount(contract.monthlyRent)
  const paidRent = toBillAmount(contract.totalRent)
  const deposit = toBillAmount(contract.deposit)
  const keyDepositRefund = toBillAmount(contract.keyDeposit ?? 0)
  const damageCharge = toBillAmount(params.damageAssessment ?? 0)

  const actualDays =
    Math.ceil(
      (checkoutDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  const totalDays =
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) +
    1
  const dailyRent = roundCurrency(monthlyRent / 30)
  const shouldPayRent = roundCurrency(actualDays * dailyRent)
  const rentDifference = roundCurrency(paidRent - shouldPayRent)

  const unpaidBills = (contract.bills ?? [])
    .filter(
      (bill) =>
        OPEN_BILL_STATUSES.includes(bill.status) &&
        toBillAmount(bill.pendingAmount) > BILL_AMOUNT_EPSILON
    )
    .map((bill) => ({
      id: bill.id,
      billNumber: bill.billNumber,
      type: bill.type,
      amount: toBillAmount(bill.amount),
      receivedAmount: toBillAmount(bill.receivedAmount ?? 0),
      pendingAmount: toBillAmount(bill.pendingAmount),
      status: bill.status,
    }))

  const rentRefund = roundCurrency(Math.max(0, rentDifference))
  const depositRefund = roundCurrency(Math.max(0, deposit - damageCharge))
  const rentCharge = roundCurrency(Math.max(0, -rentDifference))
  const unpaidBillsCharge = roundCurrency(
    unpaidBills.reduce((sum, bill) => sum + bill.pendingAmount, 0)
  )

  const totalRefund = roundCurrency(
    rentRefund + depositRefund + keyDepositRefund
  )
  const totalCharge = roundCurrency(
    rentCharge + damageCharge + unpaidBillsCharge
  )
  const netAmount = roundCurrency(totalCharge - totalRefund)
  const settlementType = buildSettlementType(netAmount)

  const refundLineItems: CheckoutSettlementLineItem[] = [
    {
      id: 'rentRefund',
      name: '多付租金退还',
      amount: rentRefund,
      originalAmount: rentRefund,
      formula: `${actualDays}天 x ¥${formatMoney(dailyRent)}/天 = ¥${formatMoney(shouldPayRent)}，已付¥${formatMoney(paidRent)}，多付¥${formatMoney(rentRefund)}`,
      direction: 'REFUND' as const,
      sourceType: 'RENT_REFUND' as const,
      editable: true,
      minAdjustableAmount: 0,
      maxAdjustableAmount: rentRefund,
    },
    {
      id: 'depositRefund',
      name: '押金退还',
      amount: depositRefund,
      originalAmount: depositRefund,
      formula: `押金¥${formatMoney(deposit)} - 损坏赔偿¥${formatMoney(damageCharge)} = ¥${formatMoney(depositRefund)}`,
      direction: 'REFUND' as const,
      sourceType: 'DEPOSIT_REFUND' as const,
      editable: true,
      minAdjustableAmount: 0,
      maxAdjustableAmount: depositRefund,
    },
    {
      id: 'keyDepositRefund',
      name: '钥匙押金退还',
      amount: keyDepositRefund,
      originalAmount: keyDepositRefund,
      formula: '钥匙押金全额退还',
      direction: 'REFUND' as const,
      sourceType: 'KEY_DEPOSIT_REFUND' as const,
      editable: true,
      minAdjustableAmount: 0,
      maxAdjustableAmount: keyDepositRefund,
    },
  ].filter((item) => item.amount > 0)

  const chargeLineItems: CheckoutSettlementLineItem[] = [
    {
      id: 'rentCharge',
      name: '欠缴租金',
      amount: rentCharge,
      originalAmount: rentCharge,
      formula: `应付¥${formatMoney(shouldPayRent)} - 已付¥${formatMoney(paidRent)} = 欠缴¥${formatMoney(rentCharge)}`,
      direction: 'CHARGE' as const,
      sourceType: 'RENT_CHARGE' as const,
      editable: false,
      minAdjustableAmount: rentCharge,
      maxAdjustableAmount: rentCharge,
      lockedReason: '系统按合同租金与实际入住天数自动计算',
    },
    {
      id: 'damageCharge',
      name: '损坏赔偿',
      amount: damageCharge,
      originalAmount: damageCharge,
      formula: '根据房屋检查评估',
      direction: 'CHARGE' as const,
      sourceType: 'DAMAGE_CHARGE' as const,
      editable: false,
      minAdjustableAmount: damageCharge,
      maxAdjustableAmount: damageCharge,
      lockedReason: '请通过上方“损坏赔偿金额”输入调整',
    },
    ...unpaidBills.map((bill) => ({
      id: `unpaid_${bill.id ?? bill.billNumber}`,
      billId: bill.id,
      billNumber: bill.billNumber,
      billStatus: bill.status,
      billReceivedAmount: bill.receivedAmount,
      billPendingAmount: bill.pendingAmount,
      name: `旧未付账单 - ${bill.billNumber}`,
      amount: bill.pendingAmount,
      originalAmount: bill.pendingAmount,
      formula: `当前待收金额 ¥${formatMoney(bill.pendingAmount)}`,
      direction: 'CHARGE' as const,
      sourceType: 'OPEN_BILL' as const,
      editable: true,
      minAdjustableAmount: 0,
      maxAdjustableAmount: bill.pendingAmount,
      presentationStatus:
        (bill.status === 'OVERDUE' ? 'OVERDUE' : 'OPEN') as BillPresentationStatus,
    })),
  ].filter((item) => item.amount > 0)

  const descriptionParts = [
    ...refundLineItems.map((item) => `${item.name}: ¥${formatMoney(item.amount)}`),
    ...chargeLineItems.map((item) => `${item.name}: ¥${formatMoney(item.amount)}`),
  ]

  return {
    refundItems: {
      rentRefund,
      depositRefund,
      keyDepositRefund,
      subtotal: totalRefund,
    },
    chargeItems: {
      rentCharge,
      damageCharge,
      unpaidBillsCharge,
      subtotal: totalCharge,
    },
    summary: {
      totalRefund,
      totalCharge,
      netAmount,
      settlementType,
    },
    calculationDetails: {
      actualDays,
      totalDays,
      dailyRent,
      shouldPayRent,
      paidRent,
      rentDifference,
      unpaidBills,
    },
    lineItems: {
      refund: refundLineItems,
      charge: chargeLineItems,
    },
    description:
      descriptionParts.length > 0 ? descriptionParts.join(', ') : '无额外结算项目',
  }
}

function getAllSettlementLineItems(settlement: CheckoutSettlementResult) {
  return [...settlement.lineItems.refund, ...settlement.lineItems.charge]
}

export function createCheckoutSettlementSubmissionItems(
  settlement: CheckoutSettlementResult,
  adjustments?: Record<
    string,
    {
      adjustedAmount?: unknown
      adjustmentReason?: string | null
    }
  >
): CheckoutSettlementSubmissionItem[] {
  return getAllSettlementLineItems(settlement).map((item) => ({
    id: item.id,
    name: item.name,
    direction: item.direction,
    sourceType: item.sourceType,
    originalAmount: item.originalAmount,
    adjustedAmount: adjustments?.[item.id]?.adjustedAmount ?? item.originalAmount,
    adjustmentReason: adjustments?.[item.id]?.adjustmentReason ?? '',
    billId: item.billId,
  }))
}

export function normalizeCheckoutSettlementSubmissionItems(
  settlement: CheckoutSettlementResult,
  submittedItems: CheckoutSettlementSubmissionItem[],
  options?: {
    requireReasonForAdjusted?: boolean
  }
): NormalizedCheckoutSettlementSubmissionItem[] {
  const lineItemMap = new Map(
    getAllSettlementLineItems(settlement).map((item) => [item.id, item])
  )
  const normalizedItems: NormalizedCheckoutSettlementSubmissionItem[] = []

  if (submittedItems.length !== lineItemMap.size) {
    throw new Error('结算明细载荷与当前退租预览不一致，请刷新后重试')
  }

  for (const submittedItem of submittedItems) {
    const lineItem = lineItemMap.get(submittedItem.id)

    if (!lineItem) {
      throw new Error(`存在未知结算项：${submittedItem.id}`)
    }

    if (submittedItem.billId !== lineItem.billId) {
      throw new Error(`结算项 ${lineItem.name} 的账单来源已发生变化，请刷新后重试`)
    }

    if (
      submittedItem.direction !== lineItem.direction ||
      submittedItem.sourceType !== lineItem.sourceType
    ) {
      throw new Error(`结算项 ${lineItem.name} 的来源信息无效`)
    }

    const originalAmount = toBillAmount(submittedItem.originalAmount)
    if (Math.abs(originalAmount - lineItem.originalAmount) > BILL_AMOUNT_EPSILON) {
      throw new Error(`结算项 ${lineItem.name} 的原始金额已变化，请刷新后重试`)
    }

    const adjustedAmount = toBillAmount(submittedItem.adjustedAmount)
    const adjustmentReason = submittedItem.adjustmentReason?.trim() ?? ''
    const isAdjusted =
      Math.abs(adjustedAmount - lineItem.originalAmount) > BILL_AMOUNT_EPSILON

    if (adjustedAmount < lineItem.minAdjustableAmount - BILL_AMOUNT_EPSILON) {
      throw new Error(
        `${lineItem.name} 的结算金额不能低于 ${formatMoney(lineItem.minAdjustableAmount)}`
      )
    }

    if (adjustedAmount - lineItem.maxAdjustableAmount > BILL_AMOUNT_EPSILON) {
      throw new Error(
        `${lineItem.name} 的结算金额不能高于 ${formatMoney(lineItem.maxAdjustableAmount)}`
      )
    }

    if (!lineItem.editable && isAdjusted) {
      throw new Error(`${lineItem.name} 不允许在退租页面直接调整`)
    }

    if (lineItem.editable && isAdjusted && options?.requireReasonForAdjusted !== false) {
      if (!adjustmentReason) {
        throw new Error(`${lineItem.name} 已调整，请填写调整原因`)
      }
    }

    normalizedItems.push({
      id: lineItem.id,
      name: lineItem.name,
      direction: lineItem.direction,
      sourceType: lineItem.sourceType,
      originalAmount: lineItem.originalAmount,
      adjustedAmount,
      adjustmentReason,
      billId: lineItem.billId,
    })

    lineItemMap.delete(submittedItem.id)
  }

  if (lineItemMap.size > 0) {
    throw new Error('缺少部分正式结算明细，请刷新后重试')
  }

  return normalizedItems
}

function buildAppliedLineItems(
  settlement: CheckoutSettlementResult,
  submissionItems: NormalizedCheckoutSettlementSubmissionItem[]
) {
  const submissionItemMap = new Map(submissionItems.map((item) => [item.id, item]))

  const mapLineItem = (
    lineItem: CheckoutSettlementLineItem
  ): AppliedCheckoutSettlementLineItem => {
    const submittedItem = submissionItemMap.get(lineItem.id)
    const adjustedAmount = submittedItem?.adjustedAmount ?? lineItem.originalAmount

    return {
      ...lineItem,
      adjustedAmount,
      adjustmentReason: submittedItem?.adjustmentReason ?? '',
      isAdjusted:
        Math.abs(adjustedAmount - lineItem.originalAmount) > BILL_AMOUNT_EPSILON,
    }
  }

  return {
    refund: settlement.lineItems.refund.map(mapLineItem),
    charge: settlement.lineItems.charge.map(mapLineItem),
  }
}

export function applyCheckoutSettlementSubmission(
  settlement: CheckoutSettlementResult,
  submittedItems: CheckoutSettlementSubmissionItem[],
  options?: {
    requireReasonForAdjusted?: boolean
  }
): AppliedCheckoutSettlementResult {
  const normalizedItems = normalizeCheckoutSettlementSubmissionItems(
    settlement,
    submittedItems,
    options
  )
  const lineItems = buildAppliedLineItems(settlement, normalizedItems)

  const refundItems = {
    rentRefund: 0,
    depositRefund: 0,
    keyDepositRefund: 0,
    subtotal: 0,
  }
  const chargeItems = {
    rentCharge: 0,
    damageCharge: 0,
    unpaidBillsCharge: 0,
    subtotal: 0,
  }

  for (const item of lineItems.refund) {
    if (item.sourceType === 'RENT_REFUND') {
      refundItems.rentRefund = item.adjustedAmount
    } else if (item.sourceType === 'DEPOSIT_REFUND') {
      refundItems.depositRefund = item.adjustedAmount
    } else if (item.sourceType === 'KEY_DEPOSIT_REFUND') {
      refundItems.keyDepositRefund = item.adjustedAmount
    }
  }

  for (const item of lineItems.charge) {
    if (item.sourceType === 'RENT_CHARGE') {
      chargeItems.rentCharge = item.adjustedAmount
    } else if (item.sourceType === 'DAMAGE_CHARGE') {
      chargeItems.damageCharge = item.adjustedAmount
    } else if (item.sourceType === 'OPEN_BILL') {
      chargeItems.unpaidBillsCharge = roundCurrency(
        chargeItems.unpaidBillsCharge + item.adjustedAmount
      )
    }
  }

  refundItems.subtotal = roundCurrency(
    refundItems.rentRefund +
      refundItems.depositRefund +
      refundItems.keyDepositRefund
  )
  chargeItems.subtotal = roundCurrency(
    chargeItems.rentCharge +
      chargeItems.damageCharge +
      chargeItems.unpaidBillsCharge
  )

  const netAmount = roundCurrency(chargeItems.subtotal - refundItems.subtotal)

  const descriptionParts = [
    ...lineItems.refund
      .filter((item) => item.adjustedAmount > BILL_AMOUNT_EPSILON)
      .map((item) => `${item.name}: ¥${formatMoney(item.adjustedAmount)}`),
    ...lineItems.charge
      .filter((item) => item.adjustedAmount > BILL_AMOUNT_EPSILON)
      .map((item) => `${item.name}: ¥${formatMoney(item.adjustedAmount)}`),
  ]

  return {
    ...settlement,
    refundItems,
    chargeItems,
    summary: {
      totalRefund: refundItems.subtotal,
      totalCharge: chargeItems.subtotal,
      netAmount,
      settlementType: buildSettlementType(netAmount),
    },
    lineItems,
    description:
      descriptionParts.length > 0 ? descriptionParts.join(', ') : '无额外结算项目',
    submissionItems: normalizedItems,
  }
}

export function buildCheckoutBillStatusAfterSettlement(params: {
  currentStatus: SharedBillStatus
  originalPendingAmount: number
  settledAmount: number
}) {
  const originalPendingAmount = toBillAmount(params.originalPendingAmount)
  const settledAmount = toBillAmount(params.settledAmount)
  const remainingPendingAmount = toBillAmount(originalPendingAmount - settledAmount)

  if (remainingPendingAmount < -BILL_AMOUNT_EPSILON) {
    throw new Error('退租结算金额不能超过账单当前待收金额')
  }

  return {
    settledAmount,
    remainingPendingAmount,
    nextStatus: resolveBillStatus({
      requestedStatus: params.currentStatus === 'OVERDUE' ? 'OVERDUE' : 'PAID',
      pendingAmount: Math.max(0, remainingPendingAmount),
    }),
  }
}
