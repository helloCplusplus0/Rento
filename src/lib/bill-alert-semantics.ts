import { DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS } from '@/lib/contract-alert-semantics'

import {
  calculateDaysUntilBillDue,
  getBillPresentationStatus,
  type BillPresentationLike,
} from './bill-semantics.shared'

export const DEFAULT_BILL_TRACKING_ALERT_DAYS =
  DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS

export interface BillStatusTrackingHint {
  kind: 'due-soon' | 'overdue'
  text: string
  tone: 'info' | 'warning' | 'danger'
}

interface BillTrackingLike extends Pick<BillPresentationLike, 'status' | 'pendingAmount'> {
  dueDate: Date | string | number
}

export function sanitizeBillTrackingAlertDays(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_BILL_TRACKING_ALERT_DAYS
  }

  return Math.max(1, Math.floor(value))
}

export function getBillStatusTrackingHint(
  bill: BillTrackingLike,
  alertDays: number,
  now: Date = new Date()
): BillStatusTrackingHint | null {
  if (getBillPresentationStatus(bill) === 'SETTLED') {
    return null
  }

  const daysUntilDue = calculateDaysUntilBillDue(bill.dueDate, now)
  if (daysUntilDue < 0) {
    return {
      kind: 'overdue',
      text: `已逾期 ${Math.abs(daysUntilDue)} 天`,
      tone: 'danger',
    }
  }

  if (daysUntilDue === 0) {
    return {
      kind: 'due-soon',
      text: '今日到期',
      tone: 'warning',
    }
  }

  if (daysUntilDue <= sanitizeBillTrackingAlertDays(alertDays)) {
    return {
      kind: 'due-soon',
      text: `${daysUntilDue} 天后到期`,
      tone: 'info',
    }
  }

  return null
}
