const DAY_IN_MS = 24 * 60 * 60 * 1000

export const DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS = 30
export const DEFAULT_UPCOMING_MOVE_IN_ALERT_DAYS = 30
export const EXPIRED_CONTRACT_ALERT_TITLE = '已到期合同'

export function sanitizeContractExpiryAlertDays(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS
  }

  return Math.max(1, Math.floor(value))
}

export function sanitizeUpcomingMoveInAlertDays(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_UPCOMING_MOVE_IN_ALERT_DAYS
  }

  return Math.max(1, Math.floor(value))
}

export function createContractExpiryAlertDeadline(
  alertDays: number,
  now: Date = new Date()
): Date {
  const deadline = new Date(now)
  deadline.setDate(deadline.getDate() + sanitizeContractExpiryAlertDays(alertDays))
  return deadline
}

export function createUpcomingMoveInAlertDeadline(
  alertDays: number,
  now: Date = new Date()
): Date {
  const deadline = new Date(now)
  deadline.setDate(deadline.getDate() + sanitizeUpcomingMoveInAlertDays(alertDays))
  return deadline
}

export function calculateDaysUntilContractExpiry(
  endDate: Date,
  now: Date = new Date()
): number {
  return Math.ceil((new Date(endDate).getTime() - now.getTime()) / DAY_IN_MS)
}

export function calculateDaysUntilContractStart(
  startDate: Date,
  now: Date = new Date()
): number {
  return Math.ceil((new Date(startDate).getTime() - now.getTime()) / DAY_IN_MS)
}

export function isContractExpiringSoon(
  endDate: Date,
  alertDays: number,
  now: Date = new Date()
): boolean {
  const daysUntilExpiry = calculateDaysUntilContractExpiry(endDate, now)
  return daysUntilExpiry > 0 && daysUntilExpiry <= sanitizeContractExpiryAlertDays(alertDays)
}

export function formatContractExpiryAlertTitle(alertDays: number): string {
  return `${sanitizeContractExpiryAlertDays(alertDays)}天离店`
}

export function formatUpcomingMoveInAlertTitle(alertDays: number): string {
  return `${sanitizeUpcomingMoveInAlertDays(alertDays)}天待入住`
}
