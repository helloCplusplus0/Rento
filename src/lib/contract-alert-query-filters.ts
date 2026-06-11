import type { Prisma } from '@prisma/client'

import { createContractExpiryAlertDeadline } from './contract-alert-semantics'

export interface ContractReminderWindow {
  today: Date
  expiringSoonDeadline: Date
}

function createStartOfToday(now: Date): Date {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return today
}

export function createContractReminderWindow(
  alertDays: number,
  now: Date = new Date()
): ContractReminderWindow {
  const today = createStartOfToday(now)

  return {
    today,
    expiringSoonDeadline: createContractExpiryAlertDeadline(alertDays, today),
  }
}

export function buildExpiringSoonContractWhere(
  window: ContractReminderWindow
): Prisma.ContractWhereInput {
  return {
    status: 'ACTIVE',
    endDate: {
      gte: window.today,
      lte: window.expiringSoonDeadline,
    },
  }
}

export function buildExpiredAttentionContractWhere(
  window: Pick<ContractReminderWindow, 'today'>
): Prisma.ContractWhereInput {
  return {
    OR: [
      {
        status: 'ACTIVE',
        endDate: {
          lt: window.today,
        },
      },
      {
        status: 'EXPIRED',
        isExtended: false,
        endDate: {
          lt: window.today,
        },
      },
    ],
  }
}

export function buildContractExpiryAlertWhere(
  window: ContractReminderWindow
): Prisma.ContractWhereInput {
  return {
    OR: [
      buildExpiringSoonContractWhere(window),
      buildExpiredAttentionContractWhere(window),
    ],
  }
}
