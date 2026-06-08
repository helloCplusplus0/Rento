import { ErrorLogger, ErrorSeverity, ErrorType } from '@/lib/error-logger'
import { meterReadingQueries } from '@/lib/queries'
import {
  getReadingStatusStats,
  repairReadingStatusInconsistencies,
  validateReadingBillConsistency,
} from '@/lib/reading-status-sync'

export interface MeterReadingHistoryRouteQuery {
  page?: unknown
  limit?: unknown
  meterId?: unknown
  contractId?: unknown
  roomId?: unknown
  recordType?: unknown
  startDate?: unknown
  endDate?: unknown
  status?: unknown
  meterType?: unknown
  search?: unknown
  operator?: unknown
  dateRange?: unknown
}

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

function normalizePositiveInteger(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10)
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }

  return undefined
}

function resolveDateRange(
  dateRange?: string,
  startDate?: string,
  endDate?: string
) {
  if (!dateRange || dateRange === 'all') {
    return {
      actualStartDate: startDate,
      actualEndDate: endDate,
    }
  }

  const now = new Date()

  switch (dateRange) {
    case 'today': {
      const today = now.toISOString().split('T')[0]
      return {
        actualStartDate: today,
        actualEndDate: today,
      }
    }
    case 'week': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return {
        actualStartDate: weekAgo.toISOString().split('T')[0],
        actualEndDate: now.toISOString().split('T')[0],
      }
    }
    case 'month': {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return {
        actualStartDate: monthAgo.toISOString().split('T')[0],
        actualEndDate: now.toISOString().split('T')[0],
      }
    }
    default:
      return {
        actualStartDate: startDate,
        actualEndDate: endDate,
      }
  }
}

function serializeMeterReadings(readings: any[]) {
  return readings.map((reading: any) => ({
    ...reading,
    previousReading: reading.previousReading ? Number(reading.previousReading) : null,
    currentReading: Number(reading.currentReading),
    usage: Number(reading.usage),
    unitPrice: Number(reading.unitPrice),
    amount: Number(reading.amount),
    readingDate: reading.readingDate
      ? new Date(reading.readingDate).toISOString()
      : null,
    createdAt: reading.createdAt ? new Date(reading.createdAt).toISOString() : null,
    updatedAt: reading.updatedAt ? new Date(reading.updatedAt).toISOString() : null,
    meter: reading.meter
      ? {
          ...reading.meter,
          unitPrice: Number(reading.meter.unitPrice),
          room: reading.meter.room
            ? {
                ...reading.meter.room,
                rent: Number(reading.meter.room.rent),
                area: reading.meter.room.area ? Number(reading.meter.room.area) : null,
                building: reading.meter.room.building
                  ? {
                      ...reading.meter.room.building,
                      totalRooms: Number(reading.meter.room.building.totalRooms),
                    }
                  : undefined,
              }
            : undefined,
        }
      : undefined,
  }))
}

export async function listMeterReadings(
  query: MeterReadingHistoryRouteQuery
) {
  const requestedPage = normalizePositiveInteger(query.page)
  const requestedLimit = normalizePositiveInteger(query.limit)
  const hasExplicitPagination =
    requestedPage !== undefined || requestedLimit !== undefined
  const currentPage = hasExplicitPagination ? requestedPage ?? 1 : 1
  const limit = hasExplicitPagination ? requestedLimit ?? 20 : undefined
  const offset =
    hasExplicitPagination && limit ? (currentPage - 1) * limit : 0
  const meterId = normalizeOptionalString(query.meterId)
  const contractId = normalizeOptionalString(query.contractId)
  const roomId = normalizeOptionalString(query.roomId)
  const recordType = normalizeOptionalString(query.recordType)
  const startDate = normalizeOptionalString(query.startDate)
  const endDate = normalizeOptionalString(query.endDate)
  const status = normalizeOptionalString(query.status)
  const meterType = normalizeOptionalString(query.meterType)
  const search = normalizeOptionalString(query.search)
  const operator = normalizeOptionalString(query.operator)
  const dateRange = normalizeOptionalString(query.dateRange)
  let readings: any[]
  let total = 0

  if (meterId) {
    ;[readings, total] = await Promise.all([
      meterReadingQueries.findByMeter(meterId, limit, offset),
      meterReadingQueries.countByMeter(meterId),
    ])
  } else if (contractId) {
    ;[readings, total] = await Promise.all([
      meterReadingQueries.findByContract(contractId, limit, offset),
      meterReadingQueries.countByContract(contractId),
    ])
  } else {
    const { actualStartDate, actualEndDate } = resolveDateRange(
      dateRange,
      startDate,
      endDate
    )

    const filters = {
      startDate: actualStartDate,
      endDate: actualEndDate,
      status,
      meterType,
      recordType,
      search,
      operator,
      roomId,
    }

    ;[readings, total] = await Promise.all([
      meterReadingQueries.findAll({
        ...filters,
        ...(limit ? { limit, offset } : {}),
      }),
      meterReadingQueries.countAll(filters),
    ])
  }

  const data = serializeMeterReadings(readings)
  const effectiveLimit =
    limit ?? (total > 0 ? total : Math.max(data.length, 1))
  const totalPages = hasExplicitPagination
    ? total > 0
      ? Math.ceil(total / effectiveLimit)
      : 1
    : 1

  return {
    data,
    pagination: {
      page: currentPage,
      limit: effectiveLimit,
      total,
      totalPages,
      hasNext: hasExplicitPagination && currentPage < totalPages,
      hasPrev: hasExplicitPagination && currentPage > 1,
    },
    success: true,
    timestamp: new Date().toISOString(),
  }
}

export async function getMeterReadingStatusCheck() {
  const validation = await validateReadingBillConsistency()
  const stats = await getReadingStatusStats()

  return {
    success: true,
    data: {
      isConsistent: validation.totalInconsistencies === 0,
      inconsistencies: validation.totalInconsistencies,
      details: {
        orphanedReadings: validation.orphanedReadings.length,
        inconsistentReadings: validation.inconsistentReadings.length,
      },
      orphanedReadings: validation.orphanedReadings.map((reading) => ({
        id: reading.id,
        meterName: reading.meter.displayName,
        meterType: reading.meter.meterType,
        status: reading.status,
        isBilled: reading.isBilled,
        contractId: reading.contractId,
        roomInfo: reading.contract
          ? {
              roomNumber: reading.contract.room.roomNumber,
              buildingName: reading.contract.room.building.name,
              renterName: reading.contract.renter.name,
            }
          : null,
        createdAt: reading.createdAt,
        updatedAt: reading.updatedAt,
      })),
      inconsistentReadings: validation.inconsistentReadings.map((reading) => ({
        id: reading.id,
        meterName: reading.meter.displayName,
        meterType: reading.meter.meterType,
        status: reading.status,
        isBilled: reading.isBilled,
        billDetailsCount: reading.billDetails.length,
        contractId: reading.contractId,
        roomInfo: reading.contract
          ? {
              roomNumber: reading.contract.room.roomNumber,
              buildingName: reading.contract.room.building.name,
              renterName: reading.contract.renter.name,
            }
          : null,
        createdAt: reading.createdAt,
        updatedAt: reading.updatedAt,
      })),
      statistics: stats,
    },
    message:
      validation.totalInconsistencies === 0
        ? '所有抄表记录状态一致'
        : `发现 ${validation.totalInconsistencies} 个状态不一致的记录`,
  }
}

export async function repairMeterReadingStatus() {
  const preValidation = await validateReadingBillConsistency()

  if (preValidation.totalInconsistencies === 0) {
    return {
      success: true,
      data: {
        repairedOrphaned: 0,
        repairedInconsistent: 0,
        errors: [],
      },
      message: '所有抄表记录状态已一致，无需修复',
    }
  }

  const repairResults = await repairReadingStatusInconsistencies()
  const postValidation = await validateReadingBillConsistency()

  return {
    success: repairResults.errors.length === 0,
    data: {
      ...repairResults,
      preRepairInconsistencies: preValidation.totalInconsistencies,
      postRepairInconsistencies: postValidation.totalInconsistencies,
      fullyRepaired: postValidation.totalInconsistencies === 0,
    },
    message:
      repairResults.errors.length === 0
        ? `修复完成: 孤立记录${repairResults.repairedOrphaned}个, 不一致记录${repairResults.repairedInconsistent}个`
        : `修复部分完成: 成功${repairResults.repairedOrphaned + repairResults.repairedInconsistent}个, 失败${repairResults.errors.length}个`,
  }
}

export async function logMeterReadingRepairFailure(error: unknown) {
  const logger = ErrorLogger.getInstance()
  await logger.logError(
    ErrorType.SYSTEM_ERROR,
    ErrorSeverity.HIGH,
    '抄表状态修复API执行失败',
    {
      module: 'MeterReadingRepairStatusAPI',
      function: 'POST',
      url: '/api/meter-readings/repair-status',
    },
    error instanceof Error ? error : undefined
  )
}
