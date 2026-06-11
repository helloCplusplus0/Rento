import {
  calculateDaysUntilContractExpiry,
  calculateDaysUntilContractStart,
  createUpcomingMoveInAlertDeadline,
  EXPIRED_CONTRACT_ALERT_TITLE,
  formatContractExpiryAlertTitle,
  formatUpcomingMoveInAlertTitle,
} from '@/lib/contract-alert-semantics'
import {
  buildExpiredAttentionContractWhere,
  buildExpiringSoonContractWhere,
  createContractReminderWindow,
} from '@/lib/contract-alert-query-filters'
import { getEnhancedDashboardStats } from '@/lib/dashboard-queries'
import { globalSettings } from '@/lib/global-settings'
import { prisma } from '@/lib/prisma'

function serializeRoomSummary(room: {
  rent: unknown
  area: unknown
  [key: string]: unknown
}) {
  return {
    ...room,
    rent: Number(room.rent),
    area: room.area ? Number(room.area) : null,
  }
}

function serializeContractSummary(contract: {
  monthlyRent: unknown
  totalRent: unknown
  deposit: unknown
  keyDeposit: unknown
  cleaningFee: unknown
  room: {
    rent: unknown
    area: unknown
    [key: string]: unknown
  }
  [key: string]: unknown
}) {
  return {
    ...contract,
    monthlyRent: Number(contract.monthlyRent),
    totalRent: Number(contract.totalRent),
    deposit: Number(contract.deposit),
    keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
    cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
    room: serializeRoomSummary(contract.room),
  }
}

export async function getDashboardStatsData() {
  return getEnhancedDashboardStats()
}

export async function getDashboardVacantRoomsData() {
  const rooms = await prisma.room.findMany({
    where: {
      status: 'VACANT',
    },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
    orderBy: [{ building: { name: 'asc' } }, { roomNumber: 'asc' }],
  })

  return {
    rooms: rooms.map((room) => serializeRoomSummary(room)),
    total: rooms.length,
  }
}

export async function getDashboardLeavingTenantsData() {
  const contractAlertSettingsLoadResult =
    await globalSettings.getContractAlertSettings()
  const contractExpiryAlertDays =
    contractAlertSettingsLoadResult.settings.contractExpiryAlertDays
  const reminderWindow = createContractReminderWindow(
    contractExpiryAlertDays
  )

  const contracts = await prisma.contract.findMany({
    where: buildExpiringSoonContractWhere(reminderWindow),
    include: {
      renter: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      room: {
        include: {
          building: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      endDate: 'asc',
    },
  })

  return {
    contracts: contracts.map((contract) => serializeContractSummary(contract)),
    total: contracts.length,
    alertDays: contractExpiryAlertDays,
    title: formatContractExpiryAlertTitle(contractExpiryAlertDays),
  }
}

export async function getDashboardUpcomingContractsData() {
  const today = new Date()
  const contractAlertSettingsLoadResult =
    await globalSettings.getContractAlertSettings()
  const upcomingMoveInAlertDays =
    contractAlertSettingsLoadResult.settings.upcomingMoveInAlertDays
  const upcomingMoveInAlertDeadline = createUpcomingMoveInAlertDeadline(
    upcomingMoveInAlertDays,
    today
  )

  const contracts = await prisma.contract.findMany({
    where: {
      status: 'PENDING',
      startDate: {
        gte: today,
        lte: upcomingMoveInAlertDeadline,
      },
    },
    include: {
      renter: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      room: {
        include: {
          building: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  })

  return {
    contracts: contracts.map((contract) => ({
      ...serializeContractSummary(contract),
      daysUntilStart: calculateDaysUntilContractStart(contract.startDate, today),
    })),
    total: contracts.length,
    alertDays: upcomingMoveInAlertDays,
    title: formatUpcomingMoveInAlertTitle(upcomingMoveInAlertDays),
  }
}

export async function getDashboardContractAlertsData() {
  const contractAlertSettingsLoadResult =
    await globalSettings.getContractAlertSettings()
  const reminderWindow = createContractReminderWindow(
    contractAlertSettingsLoadResult.settings.contractExpiryAlertDays
  )

  const expiredContracts = await prisma.contract.findMany({
    where: buildExpiredAttentionContractWhere(reminderWindow),
    include: {
      renter: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      room: {
        include: {
          building: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      endDate: 'desc',
    },
  })

  const alerts = expiredContracts.map((contract) => ({
    id: contract.id,
    contractId: contract.id,
    contractNumber: contract.contractNumber,
    renterName: contract.renter.name,
    roomInfo: `${contract.room.building.name} - ${contract.room.roomNumber}`,
    endDate: contract.endDate,
    daysUntilExpiry: calculateDaysUntilContractExpiry(
      contract.endDate,
      reminderWindow.today
    ),
    monthlyRent: Number(contract.monthlyRent),
    alertLevel: 'danger' as const,
  }))

  return {
    alerts,
    total: alerts.length,
    title: EXPIRED_CONTRACT_ALERT_TITLE,
    summary: {
      total: alerts.length,
      warning: 0,
      danger: alerts.length,
      expired: alerts.length,
    },
  }
}

export async function getDashboardOverduePaymentsData() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const bills = await prisma.bill.findMany({
    where: {
      status: { in: ['PENDING', 'OVERDUE'] },
      dueDate: {
        lt: new Date(),
        gte: thirtyDaysAgo,
      },
      pendingAmount: {
        gt: 0,
      },
    },
    include: {
      contract: {
        include: {
          renter: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          room: {
            include: {
              building: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
  })

  return {
    bills: bills.map((bill) => ({
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
      contract: {
        ...bill.contract,
        monthlyRent: Number(bill.contract.monthlyRent),
        totalRent: Number(bill.contract.totalRent),
        deposit: Number(bill.contract.deposit),
        room: {
          ...bill.contract.room,
          rent: Number(bill.contract.room.rent),
          area: bill.contract.room.area ? Number(bill.contract.room.area) : null,
        },
      },
    })),
    total: bills.length,
  }
}

export async function getDashboardUnpaidRentData() {
  const contracts = await prisma.contract.findMany({
    where: {
      status: { in: ['EXPIRED', 'TERMINATED'] },
      bills: {
        some: {
          status: { in: ['PENDING', 'OVERDUE'] },
          pendingAmount: {
            gt: 0,
          },
        },
      },
    },
    include: {
      renter: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      room: {
        include: {
          building: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      bills: {
        where: {
          status: { in: ['PENDING', 'OVERDUE'] },
          pendingAmount: {
            gt: 0,
          },
        },
        select: {
          id: true,
          billNumber: true,
          amount: true,
          receivedAmount: true,
          pendingAmount: true,
          dueDate: true,
          status: true,
          type: true,
        },
      },
    },
    orderBy: {
      endDate: 'desc',
    },
  })

  return {
    contracts: contracts.map((contract) => {
      const pendingAmount = contract.bills.reduce(
        (sum, bill) => sum + Number(bill.pendingAmount),
        0
      )

      return {
        ...contract,
        monthlyRent: Number(contract.monthlyRent),
        totalRent: Number(contract.totalRent),
        deposit: Number(contract.deposit),
        keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
        cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
        pendingAmount,
        room: {
          ...contract.room,
          rent: Number(contract.room.rent),
          area: contract.room.area ? Number(contract.room.area) : null,
        },
        bills: contract.bills.map((bill) => ({
          ...bill,
          amount: Number(bill.amount),
          receivedAmount: Number(bill.receivedAmount),
          pendingAmount: Number(bill.pendingAmount),
        })),
      }
    }),
    total: contracts.length,
  }
}
