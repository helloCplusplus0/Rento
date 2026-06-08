import {
  calculateDaysUntilContractExpiry,
  calculateDaysUntilContractStart,
  createContractExpiryAlertDeadline,
  createUpcomingMoveInAlertDeadline,
  EXPIRED_CONTRACT_ALERT_TITLE,
  formatContractExpiryAlertTitle,
  formatUpcomingMoveInAlertTitle,
} from '@/lib/contract-alert-semantics'
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

// phase13 dashboard bridge:
// keep homepage summary and alert queries anchored in shared compat helpers so
// the unified Hono host can serve the existing page without treating this as
// the phase14 dashboard query cutover.
export async function getDashboardStatsPageClosureData() {
  return getEnhancedDashboardStats()
}

export async function getDashboardVacantRoomsPageClosureData() {
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

export async function getDashboardLeavingTenantsPageClosureData() {
  const contractAlertSettingsLoadResult =
    await globalSettings.getContractAlertSettings()
  const contractExpiryAlertDays =
    contractAlertSettingsLoadResult.settings.contractExpiryAlertDays
  const expiryAlertDeadline = createContractExpiryAlertDeadline(
    contractExpiryAlertDays
  )

  const contracts = await prisma.contract.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        gte: new Date(),
        lte: expiryAlertDeadline,
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

export async function getDashboardUpcomingContractsPageClosureData() {
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

export async function getDashboardContractAlertsPageClosureData() {
  const today = new Date()

  const expiredContracts = await prisma.contract.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lt: today,
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
    daysUntilExpiry: calculateDaysUntilContractExpiry(contract.endDate, today),
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
