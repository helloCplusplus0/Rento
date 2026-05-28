import { endOfDay, isAfter, startOfDay } from 'date-fns'

import { buildContractRentBillPlan } from '@/lib/contract-payment-cycle'
import type { ContractWithDetailsForClient } from '@/types/database'

type ContractBill = NonNullable<ContractWithDetailsForClient['bills']>[number]

export interface BillDueSummaryWindow {
  startDate: Date
  endDate: Date
  periodLabel: string
  paymentCycleLabel: string
  selectionDescription: string
}

export interface BillDueSummarySelection {
  candidateBills: ContractBill[]
  defaultSelectedBillIds: string[]
  window: BillDueSummaryWindow
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function compareBillsByDueDate(left: ContractBill, right: ContractBill): number {
  const dueTimeDiff = toDate(left.dueDate).getTime() - toDate(right.dueDate).getTime()
  if (dueTimeDiff !== 0) {
    return dueTimeDiff
  }

  return toDate(left.createdAt).getTime() - toDate(right.createdAt).getTime()
}

function resolveCurrentWindow(contract: ContractWithDetailsForClient): BillDueSummaryWindow {
  const plan = buildContractRentBillPlan(
    toDate(contract.startDate),
    toDate(contract.endDate),
    contract.monthlyRent,
    contract.paymentMethod
  )
  const today = new Date()
  const todayStart = startOfDay(today)

  const activePeriod =
    plan.periods.find((period) => {
      const periodStart = startOfDay(period.periodStart)
      const periodEnd = endOfDay(period.periodEnd)

      return !isAfter(todayStart, periodEnd) && !isAfter(periodStart, todayStart)
    }) ??
    (isAfter(startOfDay(plan.periods[0].periodStart), todayStart)
      ? plan.periods[0]
      : plan.periods[plan.periods.length - 1])

  return {
    startDate: startOfDay(activePeriod.periodStart),
    endDate: endOfDay(activePeriod.periodEnd),
    periodLabel: activePeriod.periodLabel,
    paymentCycleLabel: plan.paymentCycleLabel,
    selectionDescription:
      '默认选中到期日不晚于当前支付周期结束日、且仍有待收余额的原始账单；未来期账单保留候选，但默认不并入本次催缴汇总。',
  }
}

export function buildBillDueSummarySelection(
  contract: ContractWithDetailsForClient
): BillDueSummarySelection {
  const window = resolveCurrentWindow(contract)
  const candidateBills = [...(contract.bills ?? [])]
    .filter((bill) => bill.pendingAmount > 0)
    .sort(compareBillsByDueDate)

  const defaultSelectedBillIds = candidateBills
    .filter((bill) => !isAfter(startOfDay(toDate(bill.dueDate)), window.endDate))
    .map((bill) => bill.id)

  return {
    candidateBills,
    defaultSelectedBillIds,
    window,
  }
}
