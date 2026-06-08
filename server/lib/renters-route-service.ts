import {
  revalidateMutationPaths,
  type MutationRevalidationRuntime,
} from '@/lib/mutation-revalidation'
import { optimizedRenterQueries } from '@/lib/optimized-queries'
import { renterQueries } from '@/lib/queries'

export interface RenterMutationPayload {
  name?: string
  gender?: string
  phone?: string
  idCard?: string
  emergencyContact?: string
  emergencyPhone?: string
  occupation?: string
  company?: string
  moveInDate?: string | null
  tenantCount?: number
  remarks?: string
}

interface RenterMutationRuntimeOptions {
  executionRuntime?: MutationRevalidationRuntime
  runtimeName?: string
}

export interface RentersRouteQuery {
  page: number
  limit: number
  search?: unknown
  contractStatus?: unknown
  hasActiveContract?: unknown
  buildingId?: unknown
  sortField?: unknown
  sortOrder?: unknown
}

const SORT_FIELDS = new Set(['name', 'phone', 'moveInDate', 'createdAt'] as const)

function normalizeOptionalString(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized ? normalized : undefined
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return undefined
}

function normalizeSortField(value: unknown) {
  const normalized = normalizeOptionalString(value)
  if (!normalized) {
    return 'name' as const
  }

  return SORT_FIELDS.has(normalized as (typeof SORT_FIELDS extends Set<infer T> ? T : never))
    ? (normalized as 'name' | 'phone' | 'moveInDate' | 'createdAt')
    : ('name' as const)
}

function normalizeSortOrder(value: unknown) {
  return normalizeOptionalString(value) === 'desc' ? 'desc' : 'asc'
}

function normalizeMoveInDate(value: string | null | undefined) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return new Date(value)
}

function serializeRoom(room: any) {
  if (!room) {
    return undefined
  }

  return {
    ...room,
    rent: Number(room.rent),
    area: room.area ? Number(room.area) : null,
    building: room.building
      ? {
          ...room.building,
          totalRooms: Number(room.building.totalRooms),
        }
      : undefined,
  }
}

function serializeContract(contract: any) {
  return {
    ...contract,
    monthlyRent: Number(contract.monthlyRent),
    totalRent: Number(contract.totalRent),
    deposit: Number(contract.deposit),
    keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
    cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
    room: serializeRoom(contract.room),
  }
}

function serializeBill(bill: any) {
  return {
    ...bill,
    amount: Number(bill.amount),
    receivedAmount: Number(bill.receivedAmount),
    pendingAmount: Number(bill.pendingAmount),
  }
}

export function serializeRenterSummary(renter: any) {
  return {
    ...renter,
    contracts: renter.contracts.map((contract: any) => serializeContract(contract)),
  }
}

export function serializeRenterDetail(renter: any) {
  return {
    ...renter,
    contracts: renter.contracts.map((contract: any) => ({
      ...serializeContract(contract),
      bills: contract.bills.map((bill: any) => serializeBill(bill)),
    })),
  }
}

export async function listRenters(query: RentersRouteQuery) {
  const search = normalizeOptionalString(query.search)
  const contractStatus = normalizeOptionalString(query.contractStatus)
  const buildingId = normalizeOptionalString(query.buildingId)
  const sortField = normalizeSortField(query.sortField)
  const sortOrder = normalizeSortOrder(query.sortOrder)
  const hasActiveContract =
    typeof query.hasActiveContract === 'boolean' ? query.hasActiveContract : undefined

  const result = await optimizedRenterQueries.findWithPagination(
    { page: query.page, limit: query.limit },
    {
      search,
      contractStatus: contractStatus as any,
      hasActiveContract,
      buildingId,
    },
    {
      field: sortField,
      order: sortOrder,
    }
  )

  return {
    renters: result.data.map((renter) => serializeRenterSummary(renter)),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasNext: result.hasNext,
    hasPrev: result.hasPrev,
  }
}

export async function getRenterStats() {
  return renterQueries.getRenterStats()
}

export async function getRenterDetail(renterId: string) {
  const renter = await renterQueries.findById(renterId)

  if (!renter) {
    return null
  }

  return serializeRenterDetail(renter)
}

export async function createRenter(
  payload: RenterMutationPayload,
  runtimeOptions: RenterMutationRuntimeOptions = {}
) {
  if (!payload.name?.trim() || !payload.phone?.trim()) {
    return {
      error: '缺少必填字段: name, phone',
      status: 400,
    } as const
  }

  const phone = payload.phone.trim()
  const existingRenter = await renterQueries.findByPhone(phone)
  if (existingRenter) {
    return {
      error: '手机号已存在',
      status: 409,
    } as const
  }

  const renter = await renterQueries.create({
    ...payload,
    name: payload.name.trim(),
    phone,
    moveInDate: normalizeMoveInDate(payload.moveInDate),
  })

  await revalidateMutationPaths({
    scopes: ['dashboard', 'renters'],
    detailPaths: [`/renters/${renter.id}`],
    executionRuntime: runtimeOptions.executionRuntime,
    runtimeName: runtimeOptions.runtimeName,
  })

  return {
    data: renter,
    status: 201,
    message: '租客创建成功',
  } as const
}

export async function updateRenter(
  renterId: string,
  payload: RenterMutationPayload,
  runtimeOptions: RenterMutationRuntimeOptions = {}
) {
  const existingRenter = await renterQueries.findById(renterId)
  if (!existingRenter) {
    return {
      error: 'Renter not found',
      status: 404,
    } as const
  }

  const normalizedPhone = payload.phone?.trim()
  if (normalizedPhone && normalizedPhone !== existingRenter.phone) {
    const phoneExists = await renterQueries.findByPhone(normalizedPhone)
    if (phoneExists) {
      return {
        error: 'Phone number already exists',
        status: 409,
      } as const
    }
  }

  const updatedRenter = await renterQueries.update(renterId, {
    ...payload,
    name: payload.name?.trim(),
    phone: normalizedPhone,
    moveInDate: normalizeMoveInDate(payload.moveInDate),
  })

  await revalidateMutationPaths({
    scopes: ['dashboard', 'renters', 'contracts', 'bills'],
    detailPaths: [`/renters/${renterId}`],
    executionRuntime: runtimeOptions.executionRuntime,
    runtimeName: runtimeOptions.runtimeName,
  })

  return {
    data: updatedRenter,
    status: 200,
  } as const
}

export async function deleteRenter(
  renterId: string,
  runtimeOptions: RenterMutationRuntimeOptions = {}
) {
  const existingRenter = await renterQueries.findById(renterId)
  if (!existingRenter) {
    return {
      error: 'Renter not found',
      status: 404,
    } as const
  }

  const hasActiveContract = existingRenter.contracts.some(
    (contract) => contract.status === 'ACTIVE'
  )
  if (hasActiveContract) {
    return {
      error: 'Cannot delete renter with active contracts',
      status: 400,
    } as const
  }

  await renterQueries.delete(renterId)
  await revalidateMutationPaths({
    scopes: ['dashboard', 'renters', 'contracts', 'bills'],
    detailPaths: [`/renters/${renterId}`],
    executionRuntime: runtimeOptions.executionRuntime,
    runtimeName: runtimeOptions.runtimeName,
  })

  return {
    data: {
      message: 'Renter deleted successfully',
    },
    status: 200,
  } as const
}
