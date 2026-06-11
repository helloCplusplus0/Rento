import type { ContractStatus, RoomStatus } from '@/types/database'

interface RoomOccupancyContractLike {
  id?: string
  status: ContractStatus | string
  startDate?: Date | string | null
  createdAt?: Date | string | null
  renter?: {
    name?: string | null
  } | null
}

interface RoomOccupancySourceLike {
  status: RoomStatus | string
  currentRenter?: string | null
  overdueDays?: number | null
  contracts?: RoomOccupancyContractLike[] | null
}

export interface DerivedRoomOccupancySnapshot {
  status: RoomStatus
  currentRenter: string | null
  overdueDays: number | null
  activeContractId: string | null
}

function toComparableTime(value: Date | string | null | undefined): number {
  if (!value) {
    return 0
  }

  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

export function pickPrimaryActiveRoomContract(
  contracts: RoomOccupancyContractLike[] | null | undefined
): RoomOccupancyContractLike | null {
  const activeContracts = (contracts ?? []).filter(
    (contract) => contract.status === 'ACTIVE'
  )

  if (activeContracts.length === 0) {
    return null
  }

  return [...activeContracts].sort((left, right) => {
    const startDiff =
      toComparableTime(right.startDate) - toComparableTime(left.startDate)
    if (startDiff !== 0) {
      return startDiff
    }

    return toComparableTime(right.createdAt) - toComparableTime(left.createdAt)
  })[0]
}

export function deriveRoomOccupancySnapshot(
  room: RoomOccupancySourceLike
): DerivedRoomOccupancySnapshot {
  const primaryActiveContract = pickPrimaryActiveRoomContract(room.contracts)

  if (!primaryActiveContract) {
    return {
      status: room.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'VACANT',
      currentRenter: null,
      overdueDays: null,
      activeContractId: null,
    }
  }

  const shouldKeepOverdue =
    room.status === 'OVERDUE' &&
    typeof room.overdueDays === 'number' &&
    room.overdueDays > 0

  return {
    status: shouldKeepOverdue ? 'OVERDUE' : 'OCCUPIED',
    currentRenter:
      primaryActiveContract.renter?.name?.trim() || room.currentRenter || null,
    overdueDays: shouldKeepOverdue ? room.overdueDays ?? null : null,
    activeContractId: primaryActiveContract.id ?? null,
  }
}

export function normalizeRoomOccupancySnapshot<T extends RoomOccupancySourceLike>(
  room: T
): T & DerivedRoomOccupancySnapshot {
  const derived = deriveRoomOccupancySnapshot(room)

  return {
    ...room,
    status: derived.status,
    currentRenter: derived.currentRenter,
    overdueDays: derived.overdueDays,
    activeContractId: derived.activeContractId,
  }
}

export function isRoomOccupancySnapshotStale(
  room: RoomOccupancySourceLike
): boolean {
  const derived = deriveRoomOccupancySnapshot(room)

  return (
    room.status !== derived.status ||
    (room.currentRenter ?? null) !== derived.currentRenter ||
    (room.overdueDays ?? null) !== derived.overdueDays
  )
}
