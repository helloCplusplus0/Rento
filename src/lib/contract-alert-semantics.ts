const DAY_IN_MS = 24 * 60 * 60 * 1000

export const DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS = 30
export const DEFAULT_UPCOMING_MOVE_IN_ALERT_DAYS = 30
export const EXPIRED_CONTRACT_ALERT_TITLE = '已到期合同'

export interface ContractStatusTrackingHint {
  kind: 'expiring-soon' | 'expired'
  text: string
  tone: 'warning' | 'danger'
}

function createStartOfToday(now: Date): Date {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return today
}

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

export function isContractExpiringSoonAttention(
  status: string,
  endDate: Date,
  alertDays: number,
  now: Date = new Date()
): boolean {
  if (status !== 'ACTIVE') {
    return false
  }

  const today = createStartOfToday(now)
  const normalizedEndDate = new Date(endDate)

  return (
    normalizedEndDate >= today &&
    normalizedEndDate <= createContractExpiryAlertDeadline(alertDays, today)
  )
}

export function isContractExpiredAttention(
  status: string,
  endDate: Date,
  isExtended: boolean,
  now: Date = new Date()
): boolean {
  const today = createStartOfToday(now)
  const normalizedEndDate = new Date(endDate)

  return (
    (status === 'ACTIVE' && normalizedEndDate < today) ||
    (status === 'EXPIRED' && !isExtended && normalizedEndDate < today)
  )
}

export function isContractInExpiryAlertWindow(
  status: string,
  endDate: Date,
  isExtended: boolean,
  alertDays: number,
  now: Date = new Date()
): boolean {
  return (
    isContractExpiringSoonAttention(status, endDate, alertDays, now) ||
    isContractExpiredAttention(status, endDate, isExtended, now)
  )
}

export function formatContractExpiryAlertTitle(alertDays: number): string {
  return `${sanitizeContractExpiryAlertDays(alertDays)}天离店`
}

export function formatUpcomingMoveInAlertTitle(alertDays: number): string {
  return `${sanitizeUpcomingMoveInAlertDays(alertDays)}天待入住`
}

export function getContractStatusTrackingHint(
  status: string,
  endDate: Date,
  alertDays: number,
  now: Date = new Date()
): ContractStatusTrackingHint | null {
  const daysUntilExpiry = calculateDaysUntilContractExpiry(endDate, now)

  if (status === 'EXPIRED' && daysUntilExpiry < 0) {
    return {
      kind: 'expired',
      text: `已过期 ${Math.abs(daysUntilExpiry)} 天`,
      tone: 'danger',
    }
  }

  if (status !== 'ACTIVE') {
    return null
  }

  const normalizedAlertDays = sanitizeContractExpiryAlertDays(alertDays)

  if (daysUntilExpiry === 0) {
    return {
      kind: 'expiring-soon',
      text: '今日到期',
      tone: 'warning',
    }
  }

  if (daysUntilExpiry > 0 && daysUntilExpiry <= normalizedAlertDays) {
    return {
      kind: 'expiring-soon',
      text: `${daysUntilExpiry} 天后到期`,
      tone: 'warning',
    }
  }

  return null
}
