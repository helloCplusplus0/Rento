import { addDays, addMonths, subDays } from 'date-fns'

export type ContractPaymentCycle =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMI_YEARLY'
  | 'YEARLY'

type NumericLike = number | string | { toNumber(): number }

export interface ContractRentPeriod {
  index: number
  paymentCycle: ContractPaymentCycle
  cycleMonths: number
  periodStart: Date
  periodEnd: Date
  dueDate: Date
  periodLabel: string
}

export interface ContractRentBillPlan {
  paymentCycle: ContractPaymentCycle
  paymentCycleLabel: string
  cycleMonths: number
  rentAmountPerPeriod: number
  periods: ContractRentPeriod[]
}

const CONTRACT_PAYMENT_CYCLE_MONTHS: Record<ContractPaymentCycle, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  SEMI_YEARLY: 6,
  YEARLY: 12,
}

const CONTRACT_PAYMENT_CYCLE_LABELS: Record<ContractPaymentCycle, string> = {
  MONTHLY: '月付',
  QUARTERLY: '季付',
  SEMI_YEARLY: '半年付',
  YEARLY: '年付',
}

function toMoneyNumber(value: NumericLike): number {
  const numericValue =
    typeof value === 'object' && value !== null && 'toNumber' in value
      ? value.toNumber()
      : Number(value)

  if (!Number.isFinite(numericValue)) {
    throw new Error(`无效的金额值: ${String(value)}`)
  }

  return numericValue
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function cloneDate(value: Date): Date {
  return new Date(value.getTime())
}

function formatPeriodLabel(periodStart: Date, periodEnd: Date): string {
  return `${periodStart.toISOString().slice(0, 10)} 至 ${periodEnd.toISOString().slice(0, 10)}`
}

function normalizeCycleToken(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

export function normalizeContractPaymentCycle(
  paymentMethod?: string | null
): ContractPaymentCycle {
  const rawValue = paymentMethod?.trim()
  if (!rawValue) {
    return 'MONTHLY'
  }

  if (
    rawValue.includes('半年') ||
    rawValue.includes('六个月') ||
    rawValue.includes('6个月')
  ) {
    return 'SEMI_YEARLY'
  }

  if (
    rawValue.includes('季') ||
    rawValue.includes('三个月') ||
    rawValue.includes('3个月')
  ) {
    return 'QUARTERLY'
  }

  if (
    rawValue.includes('年') ||
    rawValue.includes('十二个月') ||
    rawValue.includes('12个月')
  ) {
    return 'YEARLY'
  }

  if (rawValue.includes('月') || rawValue.includes('一个月') || rawValue.includes('1个月')) {
    return 'MONTHLY'
  }

  const normalizedToken = normalizeCycleToken(rawValue)

  if (
    normalizedToken === 'semi_annually' ||
    normalizedToken === 'semiannual' ||
    normalizedToken === 'semi_yearly' ||
    normalizedToken === 'semi_year' ||
    normalizedToken === 'half_yearly' ||
    normalizedToken === 'half_year' ||
    normalizedToken === 'halfyearly'
  ) {
    return 'SEMI_YEARLY'
  }

  if (
    normalizedToken === 'quarterly' ||
    normalizedToken === 'quarter' ||
    normalizedToken === 'every_3_months'
  ) {
    return 'QUARTERLY'
  }

  if (
    normalizedToken === 'annually' ||
    normalizedToken === 'annual' ||
    normalizedToken === 'yearly' ||
    normalizedToken === 'year' ||
    normalizedToken === 'every_12_months'
  ) {
    return 'YEARLY'
  }

  if (
    normalizedToken === 'monthly' ||
    normalizedToken === 'month' ||
    normalizedToken === 'every_month' ||
    normalizedToken === 'every_1_month'
  ) {
    return 'MONTHLY'
  }

  if (normalizedToken.includes('semi') || normalizedToken.includes('half')) {
    return 'SEMI_YEARLY'
  }

  if (normalizedToken.includes('quarter')) {
    return 'QUARTERLY'
  }

  if (normalizedToken.includes('annual') || normalizedToken.includes('year')) {
    return 'YEARLY'
  }

  return 'MONTHLY'
}

export function getContractPaymentCycleMonths(
  paymentCycle: ContractPaymentCycle
): number {
  return CONTRACT_PAYMENT_CYCLE_MONTHS[paymentCycle]
}

export function formatContractPaymentCycle(
  paymentCycleOrMethod?: ContractPaymentCycle | string | null
): string {
  const paymentCycle = normalizeContractPaymentCycle(paymentCycleOrMethod)
  return CONTRACT_PAYMENT_CYCLE_LABELS[paymentCycle]
}

export function calculateRentAmountForPaymentCycle(
  monthlyRent: NumericLike,
  paymentCycleOrMethod?: ContractPaymentCycle | string | null
): number {
  const paymentCycle = normalizeContractPaymentCycle(paymentCycleOrMethod)
  const cycleMonths = getContractPaymentCycleMonths(paymentCycle)

  return roundCurrency(toMoneyNumber(monthlyRent) * cycleMonths)
}

export function calculateContractRentPeriods(
  startDate: Date,
  endDate: Date,
  paymentCycleOrMethod?: ContractPaymentCycle | string | null
): ContractRentPeriod[] {
  if (endDate < startDate) {
    throw new Error('合同结束日期不能早于开始日期')
  }

  const paymentCycle = normalizeContractPaymentCycle(paymentCycleOrMethod)
  const cycleMonths = getContractPaymentCycleMonths(paymentCycle)
  const periods: ContractRentPeriod[] = []

  let currentStart = cloneDate(startDate)
  const contractEnd = cloneDate(endDate)

  while (currentStart <= contractEnd) {
    const nextPeriodStart = addMonths(currentStart, cycleMonths)
    let periodEnd = subDays(nextPeriodStart, 1)

    if (periodEnd > contractEnd) {
      periodEnd = cloneDate(contractEnd)
    }

    periods.push({
      index: periods.length + 1,
      paymentCycle,
      cycleMonths,
      periodStart: cloneDate(currentStart),
      periodEnd: cloneDate(periodEnd),
      dueDate: cloneDate(currentStart),
      periodLabel: formatPeriodLabel(currentStart, periodEnd),
    })

    if (periodEnd >= contractEnd) {
      break
    }

    currentStart = addDays(periodEnd, 1)
  }

  return periods
}

export function buildContractRentBillPlan(
  startDate: Date,
  endDate: Date,
  monthlyRent: NumericLike,
  paymentCycleOrMethod?: ContractPaymentCycle | string | null
): ContractRentBillPlan {
  const paymentCycle = normalizeContractPaymentCycle(paymentCycleOrMethod)

  return {
    paymentCycle,
    paymentCycleLabel: formatContractPaymentCycle(paymentCycle),
    cycleMonths: getContractPaymentCycleMonths(paymentCycle),
    rentAmountPerPeriod: calculateRentAmountForPaymentCycle(
      monthlyRent,
      paymentCycle
    ),
    periods: calculateContractRentPeriods(startDate, endDate, paymentCycle),
  }
}
