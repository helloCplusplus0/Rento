import {
  calculateDaysUntilContractExpiry,
  isContractExpiringSoon,
} from '@/lib/contract-alert-semantics'
import {
  parseDateRange,
  type BillStatsData,
  type DateRange,
} from '@/lib/bill-stats.shared'
import {
  DEFAULT_METER_READING_HISTORY_FILTERS,
  type MeterReadingHistoryFilters,
  type MeterReadingHistoryRecord,
  type MeterReadingRecordType,
} from '@/lib/meter-reading-history'
import type { CheckoutContractPageDto } from '@/lib/checkout-contract.shared'
import type {
  BillWithContractForClient,
  ContractWithDetailsForClient,
  RenterContractForClient,
  RenterWithContractsForClient,
  RoomWithBuildingForClient,
} from '@/types/database'
import type { AppSettings } from '@/hooks/useSettings'

import { minixClientEnv } from '../env'

const PAGE_LIMIT = 100

interface RequestOptions {
  signal?: AbortSignal
}

interface ApiEnvelope<TData> {
  success?: boolean
  data?: TData
  error?: string
  message?: string
}

interface RoomSearchResponse {
  rooms: any[]
  pagination: {
    totalPages: number
  }
}

interface RenterListResponse {
  renters: any[]
  totalPages: number
}

interface ContractListResponse {
  contracts: any[]
  totalPages: number
}

interface BillListResponse {
  data: any[]
  totalPages: number
}

interface ContractStats {
  totalCount: number
  activeCount: number
  expiredCount: number
  terminatedCount: number
  expiringSoonCount: number
  newThisMonth: number
  statusDistribution: {
    pending: number
    active: number
    expired: number
    terminated: number
  }
}

interface ContractExpiryAlert {
  id: string
  contractId: string
  contractNumber: string
  renterName: string
  roomInfo: string
  endDate: Date
  daysUntilExpiry: number
  alertType: 'warning' | 'danger' | 'expired'
}

export interface RoomListRouteData {
  initialSearchQuery: string
  rooms: any[]
}

export interface RoomDetailRouteData {
  room: any
}

export interface EditRoomRouteData {
  room: any
  buildings: any[]
}

export interface AddRoomRouteData {
  buildings: any[]
}

export interface RenterListStats {
  totalCount: number
  activeCount: number
  inactiveCount: number
  newThisMonth: number
}

export interface RenterListRouteData {
  initialSearchQuery: string
  renters: RenterWithContractsForClient[]
  stats: RenterListStats
}

export interface RenterDetailRouteData {
  renter: RenterWithContractsForClient
}

export type RenterCreateRouteData = null

export interface RenterEditRouteData {
  renter: RenterWithContractsForClient
}

export interface ContractListRouteData {
  initialSearchQuery: string
  contracts: ContractWithDetailsForClient[]
  stats: ContractStats
  expiryAlerts: ContractExpiryAlert[]
  contractExpiryAlertDays: number
}

export interface ContractCreateRouteData {
  renters: RenterWithContractsForClient[]
  availableRooms: RoomWithBuildingForClient[]
  preselectedRoomId?: string
  preselectedRenterId?: string
}

export interface ContractDetailRouteData {
  contract: ContractWithDetailsForClient
  contractExpiryAlertDays: number
}

export interface ContractEditRouteData {
  contract: ContractWithDetailsForClient
}

export interface ContractRenewRouteData {
  contract: ContractWithDetailsForClient
}

export interface ContractCheckoutRouteData {
  contract: CheckoutContractPageDto
}

export interface BillListRouteData {
  initialSearchQuery: string
  bills: BillWithContractForClient[]
}

export interface BillStatsRouteData {
  initialRange: DateRange
  statsData: BillStatsData
}

export interface CreateBillRouteData {
  contracts: ContractWithDetailsForClient[]
}

interface BillUtilityDetailApiItem {
  id: string
  billId: string
  meterReadingId: string
  meterType: string
  meterName: string
  usage: unknown
  unitPrice: unknown
  amount: unknown
  unit: string
  previousReading: unknown
  currentReading: unknown
  readingDate: string
  priceSource: string
  createdAt: string
  updatedAt: string
}

interface BillUtilityDetailsApiResponse {
  success?: boolean
  data?: BillUtilityDetailApiItem[]
  error?: string
  metadata?: {
    source?: 'bill_details' | 'meter_reading' | 'related_readings' | 'empty'
    isLegacy?: boolean
  }
}

export interface BillUtilityDetailRouteItem {
  id: string
  billId: string
  meterReadingId: string
  meterType: string
  meterName: string
  usage: number
  unitPrice: number
  amount: number
  unit: string
  previousReading: number | null
  currentReading: number
  readingDate: string
  priceSource: string
  createdAt: string
  updatedAt: string
}

export interface BillUtilityDetailsRouteData {
  items: BillUtilityDetailRouteItem[]
  isLegacy: boolean
  errorMessage: string | null
}

export interface BillDetailRouteData {
  bill: any
  utilityDetailsData: BillUtilityDetailsRouteData | null
}

export interface EditBillRouteData {
  bill: any
}

export interface SettingsRouteData {
  settings: Partial<AppSettings>
}

export interface BatchMeterReadingMeter {
  id: string
  displayName: string
  meterNumber?: string
  meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  unitPrice: number
  unit: string
  isActive: boolean
  lastReading?: number
  lastReadingDate?: string | null
  contractId?: string | null
  contractNumber?: string | null
  renterName?: string | null
  contractStatus?: string | null
}

export interface BatchMeterReadingRoom {
  id: string
  roomNumber: string
  building: {
    name: string
  }
  meters: BatchMeterReadingMeter[]
  activeContract?: {
    id: string
    contractNumber: string
    renter: unknown
    startDate: string
    endDate: string
    status: string
  } | null
}

export interface MeterReadingBatchRouteData {
  rooms: BatchMeterReadingRoom[]
}

export interface MeterReadingHistoryRouteData {
  readings: MeterReadingHistoryRecord[]
  initialFilters: MeterReadingHistoryFilters
}

function buildApiUrl(path: string) {
  const basePath = minixClientEnv.apiBaseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${basePath}${normalizedPath}`
}

function normalizeSearchQuery(value: string | null) {
  return value?.trim() || ''
}

function normalizeSelectFilterValue(value: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : 'all'
}

function normalizeOptionalId(value: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeTotalPages(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return 1
  }

  return Math.trunc(value)
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: () => number }).toNumber === 'function'
  ) {
    const parsed = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function toNullableNumberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return toNumberValue(value, 0)
}

function toDateValue(value: unknown): Date | undefined {
  if (!value) {
    return undefined
  }

  const parsed = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function normalizeBillForClient(bill: any) {
  return {
    ...bill,
    amount: toNumberValue(bill.amount),
    receivedAmount: toNumberValue(bill.receivedAmount),
    pendingAmount: toNumberValue(bill.pendingAmount),
    dueDate: toDateValue(bill.dueDate),
    startDate: toDateValue(bill.startDate),
    endDate: toDateValue(bill.endDate),
    paidDate: toDateValue(bill.paidDate),
    createdAt: toDateValue(bill.createdAt),
    updatedAt: toDateValue(bill.updatedAt),
  }
}

function normalizeBillStatsBase(source: any) {
  return {
    totalAmount: toNumberValue(source?.totalAmount),
    paidAmount: toNumberValue(source?.paidAmount),
    pendingAmount: toNumberValue(source?.pendingAmount),
    overdueAmount: toNumberValue(source?.overdueAmount),
    totalCount: toNumberValue(source?.totalCount),
    settledCount: toNumberValue(source?.settledCount),
    openCount: toNumberValue(source?.openCount),
    overdueCount: toNumberValue(source?.overdueCount),
  }
}

function normalizeBillStatsTypeBreakdown(
  breakdown: unknown
): BillStatsData['typeBreakdown'] {
  const source =
    typeof breakdown === 'object' && breakdown !== null
      ? (breakdown as Record<string, { amount?: unknown; count?: unknown }>)
      : {}

  return {
    RENT: {
      amount: toNumberValue(source.RENT?.amount),
      count: toNumberValue(source.RENT?.count),
    },
    DEPOSIT: {
      amount: toNumberValue(source.DEPOSIT?.amount),
      count: toNumberValue(source.DEPOSIT?.count),
    },
    UTILITIES: {
      amount: toNumberValue(source.UTILITIES?.amount),
      count: toNumberValue(source.UTILITIES?.count),
    },
    OTHER: {
      amount: toNumberValue(source.OTHER?.amount),
      count: toNumberValue(source.OTHER?.count),
    },
  }
}

function normalizeBillStatsDateRange(
  source: unknown,
  fallbackRange: DateRange
): BillStatsData['dateRange'] {
  const dateRange =
    typeof source === 'object' && source !== null
      ? (source as { startDate?: unknown; endDate?: unknown })
      : {}

  return {
    startDate: toDateValue(dateRange.startDate) ?? fallbackRange.startDate,
    endDate: toDateValue(dateRange.endDate) ?? fallbackRange.endDate,
  }
}

function normalizeBillStatsPreviousPeriod(
  source: unknown,
  fallbackRange: DateRange
): NonNullable<BillStatsData['comparison']>['previousPeriod'] {
  const previousPeriod =
    typeof source === 'object' && source !== null
      ? (source as Record<string, unknown>)
      : {}

  return {
    ...normalizeBillStatsBase(previousPeriod),
    typeBreakdown: normalizeBillStatsTypeBreakdown(previousPeriod.typeBreakdown),
    dateRange: normalizeBillStatsDateRange(previousPeriod.dateRange, fallbackRange),
  }
}

function normalizeBillStatsForClient(
  source: unknown,
  fallbackRange: DateRange
): BillStatsData {
  const stats = typeof source === 'object' && source !== null ? source : {}
  const typedStats = stats as Record<string, unknown>

  return {
    ...normalizeBillStatsBase(typedStats),
    typeBreakdown: normalizeBillStatsTypeBreakdown(typedStats.typeBreakdown),
    timeSeries: Array.isArray(typedStats.timeSeries)
      ? typedStats.timeSeries.map((item) => ({
          date:
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { date?: unknown }).date === 'string'
              ? ((item as { date: string }).date ?? '')
              : '',
          totalAmount:
            typeof item === 'object' && item !== null
              ? toNumberValue((item as { totalAmount?: unknown }).totalAmount)
              : 0,
          paidAmount:
            typeof item === 'object' && item !== null
              ? toNumberValue((item as { paidAmount?: unknown }).paidAmount)
              : 0,
          pendingAmount:
            typeof item === 'object' && item !== null
              ? toNumberValue((item as { pendingAmount?: unknown }).pendingAmount)
              : 0,
          count:
            typeof item === 'object' && item !== null
              ? toNumberValue((item as { count?: unknown }).count)
              : 0,
        }))
      : [],
    comparison:
      typeof typedStats.comparison === 'object' && typedStats.comparison !== null
        ? {
            previousPeriod: normalizeBillStatsPreviousPeriod(
              (typedStats.comparison as { previousPeriod?: unknown }).previousPeriod,
              fallbackRange
            ),
            growthRate: toNumberValue(
              (typedStats.comparison as { growthRate?: unknown }).growthRate
            ),
            changeAmount: toNumberValue(
              (typedStats.comparison as { changeAmount?: unknown }).changeAmount
            ),
          }
        : undefined,
    dateRange: normalizeBillStatsDateRange(typedStats.dateRange, fallbackRange),
  }
}

function normalizeBillUtilityDetailForClient(
  detail: BillUtilityDetailApiItem
): BillUtilityDetailRouteItem {
  return {
    id: detail.id,
    billId: detail.billId,
    meterReadingId: detail.meterReadingId,
    meterType: detail.meterType,
    meterName: detail.meterName,
    usage: toNumberValue(detail.usage),
    unitPrice: toNumberValue(detail.unitPrice),
    amount: toNumberValue(detail.amount),
    unit: detail.unit,
    previousReading: toNullableNumberValue(detail.previousReading),
    currentReading: toNumberValue(detail.currentReading),
    readingDate: detail.readingDate,
    priceSource: detail.priceSource,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  }
}

function normalizeBuildingForClient(building: any) {
  if (!building) {
    return building
  }

  return {
    ...building,
    totalRooms: toNumberValue(building.totalRooms),
    createdAt: toDateValue(building.createdAt),
    updatedAt: toDateValue(building.updatedAt),
  }
}

function normalizeContractSummaryForClient(contract: any) {
  return {
    ...contract,
    monthlyRent: toNumberValue(contract.monthlyRent),
    totalRent: toNumberValue(contract.totalRent),
    deposit: toNumberValue(contract.deposit),
    keyDeposit: toNullableNumberValue(contract.keyDeposit),
    cleaningFee: toNullableNumberValue(contract.cleaningFee),
    startDate: toDateValue(contract.startDate),
    endDate: toDateValue(contract.endDate),
    signedDate: toDateValue(contract.signedDate),
    createdAt: toDateValue(contract.createdAt),
    updatedAt: toDateValue(contract.updatedAt),
    room: contract.room
      ? normalizeRoomForClient(contract.room, { includeContracts: false })
      : contract.room,
    renter: contract.renter
      ? normalizeRenterForClient(contract.renter, { includeContracts: false })
      : contract.renter,
    bills: (contract.bills ?? []).map((bill: any) => normalizeBillForClient(bill)),
  }
}

function normalizeRenterContractForClient(contract: any): RenterContractForClient {
  return {
    ...contract,
    monthlyRent: toNullableNumberValue(contract.monthlyRent),
    totalRent: toNullableNumberValue(contract.totalRent),
    deposit: toNullableNumberValue(contract.deposit),
    keyDeposit: toNullableNumberValue(contract.keyDeposit),
    cleaningFee: toNullableNumberValue(contract.cleaningFee),
    startDate: toDateValue(contract.startDate) ?? new Date(contract.startDate),
    endDate: toDateValue(contract.endDate) ?? new Date(contract.endDate),
    signedDate: toDateValue(contract.signedDate),
    createdAt: toDateValue(contract.createdAt) ?? new Date(contract.createdAt),
    updatedAt: toDateValue(contract.updatedAt) ?? new Date(contract.updatedAt),
    room: contract.room
      ? normalizeRoomForClient(contract.room, { includeContracts: false })
      : contract.room,
    bills: (contract.bills ?? []).map((bill: any) => normalizeBillForClient(bill)),
  } as RenterContractForClient
}

function normalizeRoomForClient(
  room: any,
  options: { includeContracts?: boolean } = {}
): RoomWithBuildingForClient {
  return {
    ...room,
    rent: toNumberValue(room.rent),
    area: toNullableNumberValue(room.area),
    createdAt: toDateValue(room.createdAt),
    updatedAt: toDateValue(room.updatedAt),
    building: normalizeBuildingForClient(room.building),
    contracts: options.includeContracts
      ? (room.contracts ?? []).map((contract: any) =>
          normalizeContractSummaryForClient(contract)
        )
      : room.contracts,
  } as RoomWithBuildingForClient
}

function normalizeRenterForClient(
  renter: any,
  options: { includeContracts?: boolean } = {}
): RenterWithContractsForClient {
  return {
    ...renter,
    moveInDate: toDateValue(renter.moveInDate),
    createdAt: toDateValue(renter.createdAt),
    updatedAt: toDateValue(renter.updatedAt),
    contracts: options.includeContracts
      ? (renter.contracts ?? []).map((contract: any) =>
          normalizeRenterContractForClient(contract)
        )
      : renter.contracts,
  } as RenterWithContractsForClient
}

function isAbortLikeError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

function normalizeContractForClient(contract: any): ContractWithDetailsForClient {
  return {
    ...normalizeContractSummaryForClient(contract),
    room: normalizeRoomForClient(contract.room, { includeContracts: false }),
    renter: normalizeRenterForClient(contract.renter, {
      includeContracts: false,
    }),
    bills: (contract.bills ?? []).map((bill: any) => normalizeBillForClient(bill)),
  } as ContractWithDetailsForClient
}

function normalizeBillWithContractForClient(
  bill: any
): BillWithContractForClient {
  const normalizedBill = normalizeBillForClient(bill)
  const normalizedContract = normalizeContractForClient(bill.contract)
  const { bills: _unusedBills, ...contract } = normalizedContract

  return {
    ...normalizedBill,
    contract,
  } as BillWithContractForClient
}

function normalizeCheckoutMeter(meter: any) {
  return {
    id: meter.id,
    meterNumber: meter.meterNumber,
    displayName: meter.displayName,
    meterType: meter.meterType,
    unitPrice: toNumberValue(meter.unitPrice),
    unit: meter.unit,
    location: meter.location ?? null,
    latestReading: toNullableNumberValue(
      meter.latestReading ?? meter.lastReading ?? meter.readings?.[0]?.currentReading
    ),
  }
}

function normalizeBatchMeterReadingMeter(
  meter: any
): BatchMeterReadingMeter {
  return {
    id: meter.id,
    displayName: meter.displayName,
    meterNumber: meter.meterNumber ?? undefined,
    meterType: meter.meterType,
    unitPrice: toNumberValue(meter.unitPrice),
    unit: meter.unit,
    isActive: Boolean(meter.isActive),
    lastReading: toNumberValue(meter.lastReading),
    lastReadingDate: meter.lastReadingDate
      ? new Date(meter.lastReadingDate).toISOString()
      : null,
    contractId: meter.contractId ?? null,
    contractNumber: meter.contractNumber ?? null,
    renterName: meter.renterName ?? null,
    contractStatus: meter.contractStatus ?? null,
  }
}

function normalizeBatchMeterReadingRoom(room: any): BatchMeterReadingRoom {
  return {
    id: room.id,
    roomNumber: room.roomNumber,
    building: {
      name: room.building?.name ?? '',
    },
    // 批量抄表默认只承接激活中的仪表，保持旧页面展示与提交语义一致。
    meters: (room.meters ?? [])
      .map((meter: any) => normalizeBatchMeterReadingMeter(meter))
      .filter((meter: BatchMeterReadingMeter) => meter.isActive),
    activeContract: room.activeContract
      ? {
          id: room.activeContract.id,
          contractNumber: room.activeContract.contractNumber,
          renter: room.activeContract.renter,
          startDate: room.activeContract.startDate,
          endDate: room.activeContract.endDate,
          status: room.activeContract.status,
        }
      : null,
  }
}

function normalizeMeterReadingHistoryRecord(
  reading: any
): MeterReadingHistoryRecord {
  return {
    ...reading,
    previousReading: toNullableNumberValue(reading.previousReading),
    currentReading: toNumberValue(reading.currentReading),
    usage: toNumberValue(reading.usage),
    unitPrice: toNumberValue(reading.unitPrice),
    amount: toNumberValue(reading.amount),
    readingDate: reading.readingDate,
    period: reading.period ?? undefined,
    operator: reading.operator ?? undefined,
    remarks: reading.remarks ?? undefined,
    recordType: reading.recordType ?? null,
    isBilled: Boolean(reading.isBilled),
    createdAt: reading.createdAt,
    updatedAt: reading.updatedAt,
    meter: reading.meter
      ? {
          ...reading.meter,
          meterNumber: reading.meter.meterNumber ?? undefined,
          room: reading.meter.room
            ? {
                ...reading.meter.room,
                building: reading.meter.room.building
                  ? {
                      name: reading.meter.room.building.name,
                    }
                  : undefined,
              }
            : undefined,
        }
      : undefined,
    contract: reading.contract
      ? {
          renter: reading.contract.renter
            ? {
                name: reading.contract.renter.name,
              }
            : undefined,
        }
      : undefined,
  }
}

function normalizeMeterReadingHistoryFilters(
  requestUrl: string
): MeterReadingHistoryFilters {
  const url = new URL(requestUrl)
  const recordType = url.searchParams.get('recordType')

  return {
    search: normalizeSearchQuery(url.searchParams.get('search')),
    meterType: normalizeSelectFilterValue(url.searchParams.get('meterType')),
    status: normalizeSelectFilterValue(url.searchParams.get('status')),
    dateRange: normalizeSelectFilterValue(url.searchParams.get('dateRange')),
    operator: normalizeSearchQuery(url.searchParams.get('operator')),
    recordType:
      recordType === 'INITIAL_BASELINE' ||
      recordType === 'REGULAR_READING' ||
      recordType === 'CHECKOUT_FINAL'
        ? recordType
        : 'all',
  }
}

function buildMeterReadingHistorySearchParams(
  filters: MeterReadingHistoryFilters
) {
  const searchParams = new URLSearchParams()

  if (filters.search) {
    searchParams.set('search', filters.search)
  }

  if (filters.meterType !== 'all') {
    searchParams.set('meterType', filters.meterType)
  }

  if (filters.status !== 'all') {
    searchParams.set('status', filters.status)
  }

  if (filters.dateRange !== 'all') {
    searchParams.set('dateRange', filters.dateRange)
  }

  if (filters.operator) {
    searchParams.set('operator', filters.operator)
  }

  if (filters.recordType !== 'all') {
    searchParams.set('recordType', filters.recordType)
  }

  return searchParams
}

function getSafeStatusText(status: number) {
  switch (status) {
    case 400:
      return 'Bad Request'
    case 401:
      return 'Unauthorized'
    case 403:
      return 'Forbidden'
    case 404:
      return 'Not Found'
    case 500:
      return 'Internal Server Error'
    default:
      return 'Error'
  }
}

function createRouteDataErrorResponse(message: string, status: number) {
  // Browser-native Response rejects non-ASCII statusText, so keep the
  // human-readable Chinese message in the body and use a safe HTTP phrase here.
  return new Response(message, {
    status,
    statusText: getSafeStatusText(status),
  })
}

function remapRouteDataError(
  error: unknown,
  notFoundMessage: string,
  fallbackMessage: string
): never {
  if (error instanceof Response) {
    if (error.status === 404) {
      throw createRouteDataErrorResponse(notFoundMessage, 404)
    }

    throw error
  }

  if (error instanceof Error) {
    throw createRouteDataErrorResponse(error.message || fallbackMessage, 500)
  }

  throw createRouteDataErrorResponse(fallbackMessage, 500)
}

async function readJsonResponse<TData>(
  response: Response,
  fallbackMessage: string
): Promise<TData> {
  try {
    return (await response.json()) as TData
  } catch {
    throw createRouteDataErrorResponse(fallbackMessage, response.status || 500)
  }
}

async function fetchJson<TData>(
  path: string,
  fallbackMessage: string,
  options: RequestOptions = {}
): Promise<TData> {
  const response = await fetch(buildApiUrl(path), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    signal: options.signal,
  })

  const payload = await readJsonResponse<TData | ApiEnvelope<TData>>(
    response,
    fallbackMessage
  )

  if (!response.ok) {
    const detail =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String(payload.error || fallbackMessage)
        : fallbackMessage

    throw createRouteDataErrorResponse(detail, response.status)
  }

  return payload as TData
}

async function fetchApiEnvelope<TData>(
  path: string,
  fallbackMessage: string,
  options: RequestOptions = {}
): Promise<TData> {
  const payload = await fetchJson<ApiEnvelope<TData>>(path, fallbackMessage, options)

  if (!payload.success || payload.data === undefined) {
    throw createRouteDataErrorResponse(payload.error || fallbackMessage, 500)
  }

  return payload.data
}

async function fetchAllRoomPages(options: RequestOptions = {}) {
  const rooms: any[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
    })

    const payload = await fetchJson<RoomSearchResponse>(
      `/rooms?${searchParams.toString()}`,
      '房源列表加载失败',
      options
    )

    rooms.push(...payload.rooms)
    totalPages = normalizeTotalPages(payload.pagination.totalPages)
    page += 1
  }

  return rooms
}

async function fetchAllVacantRoomPages(options: RequestOptions = {}) {
  const rooms: RoomWithBuildingForClient[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
      statuses: 'VACANT',
    })

    const payload = await fetchJson<RoomSearchResponse>(
      `/rooms?${searchParams.toString()}`,
      '可用房间加载失败',
      options
    )

    rooms.push(
      ...payload.rooms.map((room) =>
        normalizeRoomForClient(room, { includeContracts: true })
      )
    )
    totalPages = normalizeTotalPages(payload.pagination.totalPages)
    page += 1
  }

  return rooms
}

async function fetchRoomDetail(roomId: string, options: RequestOptions = {}) {
  try {
    return await fetchJson<any>(
      `/rooms/${roomId}`,
      '房间详情加载失败',
      options
    )
  } catch (error) {
    remapRouteDataError(error, '房间不存在或已被删除', '房间详情加载失败')
  }
}

async function fetchBuildings(options: RequestOptions = {}) {
  return fetchJson<any[]>('/buildings', '楼栋列表加载失败', options)
}

async function fetchAllContractPages(
  filters: { renterId?: string } = {},
  options: RequestOptions = {}
): Promise<ContractWithDetailsForClient[]> {
  const contracts: ContractWithDetailsForClient[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
    })

    if (filters.renterId) {
      searchParams.set('renterId', filters.renterId)
    }

    const payload = await fetchApiEnvelope<ContractListResponse>(
      `/contracts?${searchParams.toString()}`,
      '合同列表加载失败',
      options
    )

    contracts.push(
      ...payload.contracts.map((contract) => normalizeContractForClient(contract))
    )
    totalPages = normalizeTotalPages(payload.totalPages)
    page += 1
  }

  return contracts
}

async function fetchAllRenterPages(options: RequestOptions = {}) {
  const renters: RenterWithContractsForClient[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
    })

    const payload = await fetchApiEnvelope<RenterListResponse>(
      `/renters?${searchParams.toString()}`,
      '租客列表加载失败',
      options
    )

    renters.push(
      ...payload.renters.map((renter) =>
        normalizeRenterForClient(renter, { includeContracts: true })
      )
    )
    totalPages = normalizeTotalPages(payload.totalPages)
    page += 1
  }

  return renters
}

async function fetchRenterStats(options: RequestOptions = {}) {
  return fetchJson<RenterListStats>('/renters/stats', '租客统计加载失败', options)
}

function buildRenterListStats(
  renters: RenterWithContractsForClient[]
): RenterListStats {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const activeCount = renters.filter((renter) =>
    (renter.contracts ?? []).some((contract) => contract.status === 'ACTIVE')
  ).length

  return {
    totalCount: renters.length,
    activeCount,
    inactiveCount: renters.length - activeCount,
    newThisMonth: renters.filter((renter) => {
      const createdAt = toDateValue(renter.createdAt)
      return Boolean(createdAt && createdAt >= startOfMonth)
    }).length,
  }
}

async function fetchRenterDetail(
  renterId: string,
  options: RequestOptions = {}
): Promise<RenterWithContractsForClient> {
  try {
    const renter = await fetchJson<any>(
      `/renters/${renterId}`,
      '租客详情加载失败',
      options
    )

    return normalizeRenterForClient(renter, { includeContracts: true })
  } catch (error) {
    remapRouteDataError(error, '租客不存在或已被删除', '租客详情加载失败')
  }
}

async function fetchContractDetail(contractId: string, options: RequestOptions = {}) {
  try {
    const contract = await fetchApiEnvelope<any>(
      `/contracts/${contractId}`,
      '合同详情加载失败',
      options
    )

    return normalizeContractForClient(contract)
  } catch (error) {
    remapRouteDataError(error, '合同不存在或已被删除', '合同详情加载失败')
  }
}

async function fetchActiveRoomMeters(roomId: string, options: RequestOptions = {}) {
  const payload = await fetchJson<ApiEnvelope<any[]>>(
    `/rooms/${roomId}/meters`,
    '房间仪表加载失败',
    options
  )

  const meters = payload.success && Array.isArray(payload.data) ? payload.data : []
  return meters.filter((meter) => meter.isActive).map(normalizeCheckoutMeter)
}

async function fetchAllActiveContractPages(options: RequestOptions = {}) {
  const contracts: ContractWithDetailsForClient[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
      status: 'ACTIVE',
    })

    const payload = await fetchApiEnvelope<ContractListResponse>(
      `/contracts?${searchParams.toString()}`,
      '创建账单所需合同加载失败',
      options
    )

    contracts.push(
      ...payload.contracts.map((contract) => normalizeContractForClient(contract))
    )
    totalPages = normalizeTotalPages(payload.totalPages)
    page += 1
  }

  return contracts
}

async function fetchAllBillPages(
  initialSearchQuery: string,
  options: RequestOptions = {}
): Promise<BillWithContractForClient[]> {
  const bills: BillWithContractForClient[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
    })

    if (initialSearchQuery) {
      searchParams.set('search', initialSearchQuery)
    }

    const payload = await fetchJson<BillListResponse>(
      `/bills?${searchParams.toString()}`,
      '账单列表加载失败',
      options
    )

    bills.push(...payload.data.map((bill) => normalizeBillWithContractForClient(bill)))
    totalPages = normalizeTotalPages(payload.totalPages)
    page += 1
  }

  return bills
}

async function fetchBatchMeterReadingRooms(
  options: RequestOptions = {}
): Promise<BatchMeterReadingRoom[]> {
  const rooms = await fetchJson<any[]>(
    '/rooms?includeMeters=true',
    '批量抄表房间数据加载失败',
    options
  )

  return rooms
    .map((room) => normalizeBatchMeterReadingRoom(room))
    .filter((room) => room.meters.length > 0)
}

async function fetchMeterReadingHistory(
  filters: MeterReadingHistoryFilters,
  options: RequestOptions = {}
): Promise<MeterReadingHistoryRecord[]> {
  const searchParams = buildMeterReadingHistorySearchParams(filters)
  const path = searchParams.size
    ? `/meter-readings?${searchParams.toString()}`
    : '/meter-readings'
  const payload = await fetchJson<{ data?: any[] }>(
    path,
    '抄表历史加载失败',
    options
  )

  return Array.isArray(payload.data)
    ? payload.data.map((reading) => normalizeMeterReadingHistoryRecord(reading))
    : []
}

async function fetchBillDetail(billId: string, options: RequestOptions = {}) {
  try {
    return await fetchJson<any>(`/bills/${billId}`, '账单详情加载失败', options)
  } catch (error) {
    remapRouteDataError(error, '账单不存在或已被删除', '账单详情加载失败')
  }
}

async function fetchBillUtilityDetails(
  billId: string,
  options: RequestOptions = {}
): Promise<BillUtilityDetailsRouteData> {
  const fallbackMessage = '账单用量明细加载失败，请稍后重试。'
  try {
    const response = await fetch(buildApiUrl(`/bills/${billId}/details`), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      signal: options.signal,
    })

    const payload = await readJsonResponse<BillUtilityDetailsApiResponse>(
      response,
      fallbackMessage
    )

    if (!response.ok || !payload.success) {
      return {
        items: [],
        isLegacy: Boolean(payload.metadata?.isLegacy),
        errorMessage: payload.error || fallbackMessage,
      }
    }

    return {
      items: (payload.data ?? []).map(normalizeBillUtilityDetailForClient),
      isLegacy: Boolean(payload.metadata?.isLegacy),
      errorMessage: null,
    }
  } catch {
    return {
      items: [],
      isLegacy: false,
      errorMessage: fallbackMessage,
    }
  }
}

async function fetchBillStatsRouteData(
  requestUrl: string,
  options: RequestOptions = {}
): Promise<BillStatsRouteData> {
  const request = new URL(requestUrl)
  const initialRange = parseDateRange({
    start: request.searchParams.get('start') ?? undefined,
    end: request.searchParams.get('end') ?? undefined,
    range: request.searchParams.get('range') ?? undefined,
  })
  const searchParams = new URLSearchParams({
    start: initialRange.startDate.toISOString().split('T')[0],
    end: initialRange.endDate.toISOString().split('T')[0],
    comparison: 'true',
  })

  if (initialRange.preset) {
    searchParams.set('range', initialRange.preset)
  }

  // phase14-05 keeps the page parity bridge narrow while promoting stats reads to
  // the unified Hono host; the minix route now consumes the formal host directly.
  const payload = await fetchJson<unknown>(
    `/bills/stats?${searchParams.toString()}`,
    '账单统计加载失败',
    options
  )

  return {
    initialRange,
    statsData: normalizeBillStatsForClient(payload, initialRange),
  }
}

function buildContractStats(
  contracts: ContractWithDetailsForClient[],
  contractExpiryAlertDays: number
): ContractStats {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    totalCount: contracts.length,
    activeCount: contracts.filter((contract) => contract.status === 'ACTIVE').length,
    expiredCount: contracts.filter((contract) => contract.status === 'EXPIRED').length,
    terminatedCount: contracts.filter((contract) => contract.status === 'TERMINATED')
      .length,
    expiringSoonCount: contracts.filter(
      (contract) =>
        contract.status === 'ACTIVE' &&
        isContractExpiringSoon(contract.endDate, contractExpiryAlertDays, now)
    ).length,
    newThisMonth: contracts.filter((contract) => {
      const createdAt = new Date(contract.createdAt)
      return !Number.isNaN(createdAt.getTime()) && createdAt >= startOfMonth
    }).length,
    statusDistribution: {
      pending: contracts.filter((contract) => contract.status === 'PENDING').length,
      active: contracts.filter((contract) => contract.status === 'ACTIVE').length,
      expired: contracts.filter((contract) => contract.status === 'EXPIRED').length,
      terminated: contracts.filter((contract) => contract.status === 'TERMINATED')
        .length,
    },
  }
}

function buildContractExpiryAlerts(
  contracts: ContractWithDetailsForClient[],
  contractExpiryAlertDays: number
): ContractExpiryAlert[] {
  const now = new Date()

  return contracts
    .filter((contract) => contract.status === 'ACTIVE')
    .map((contract) => {
      const daysUntilExpiry = calculateDaysUntilContractExpiry(contract.endDate, now)

      return {
        id: contract.id,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        renterName: contract.renter.name,
        roomInfo: `${contract.room.building.name}-${contract.room.roomNumber}`,
        endDate: new Date(contract.endDate),
        daysUntilExpiry,
        alertType:
          daysUntilExpiry <= 0 ? 'expired' : daysUntilExpiry <= 7 ? 'danger' : 'warning',
      } as ContractExpiryAlert
    })
    .filter(
      (alert) => alert.daysUntilExpiry <= contractExpiryAlertDays
    )
    .sort((left, right) => left.daysUntilExpiry - right.daysUntilExpiry)
}

export async function loadRoomListRouteData(
  requestUrl: string,
  options: RequestOptions = {}
): Promise<RoomListRouteData> {
  const url = new URL(requestUrl)
  const initialSearchQuery = normalizeSearchQuery(url.searchParams.get('search'))
  const rooms = await fetchAllRoomPages(options)

  return {
    initialSearchQuery,
    rooms,
  }
}

export async function loadRoomDetailRouteData(
  roomId: string,
  options: RequestOptions = {}
): Promise<RoomDetailRouteData> {
  const room = await fetchRoomDetail(roomId, options)

  return {
    room,
  }
}

export async function loadEditRoomRouteData(
  roomId: string,
  options: RequestOptions = {}
): Promise<EditRoomRouteData> {
  try {
    const [room, buildings] = await Promise.all([
      fetchRoomDetail(roomId, options),
      fetchBuildings(options),
    ])

    return {
      room,
      buildings,
    }
  } catch (error) {
    remapRouteDataError(error, '房间不存在或已被删除', '编辑房间数据加载失败')
  }
}

export async function loadAddRoomRouteData(
  options: RequestOptions = {}
): Promise<AddRoomRouteData> {
  const buildings = await fetchBuildings(options)

  return {
    buildings,
  }
}

export async function loadRenterListRouteData(
  requestUrl: string,
  options: RequestOptions = {}
): Promise<RenterListRouteData> {
  const url = new URL(requestUrl)
  const initialSearchQuery = normalizeSearchQuery(url.searchParams.get('search'))
  const rentersPromise = fetchAllRenterPages(options)
  const statsPromise = fetchRenterStats(options).catch((error) => {
    if (isAbortLikeError(error)) {
      throw error
    }

    // phase13-04 safe fallback: keep the renter list route usable when the
    // legacy-only stats endpoint is temporarily unavailable.
    return null
  })
  const renters = await rentersPromise
  const stats = (await statsPromise) ?? buildRenterListStats(renters)

  return {
    initialSearchQuery,
    renters,
    stats,
  }
}

export async function loadRenterDetailRouteData(
  renterId: string,
  options: RequestOptions = {}
): Promise<RenterDetailRouteData> {
  const renter = await fetchRenterDetail(renterId, options)

  return {
    renter,
  }
}

export async function loadRenterCreateRouteData(
  _options: RequestOptions = {}
): Promise<RenterCreateRouteData> {
  return null
}

export async function loadRenterEditRouteData(
  renterId: string,
  options: RequestOptions = {}
): Promise<RenterEditRouteData> {
  try {
    const renter = await fetchRenterDetail(renterId, options)

    return {
      renter,
    }
  } catch (error) {
    remapRouteDataError(error, '租客不存在或已被删除', '编辑租客数据加载失败')
  }
}

export async function loadContractListRouteData(
  requestUrl: string,
  options: RequestOptions = {}
): Promise<ContractListRouteData> {
  const url = new URL(requestUrl)
  const initialSearchQuery = normalizeSearchQuery(url.searchParams.get('search'))
  const renterId = normalizeOptionalId(url.searchParams.get('renterId'))
  const [contracts, settings] = await Promise.all([
    fetchAllContractPages({ renterId }, options),
    fetchApiEnvelope<Partial<AppSettings>>('/settings', '设置加载失败', options),
  ])
  const contractExpiryAlertDays = Number(settings.contractExpiryAlertDays) || 30

  return {
    initialSearchQuery,
    contracts,
    stats: buildContractStats(contracts, contractExpiryAlertDays),
    expiryAlerts: buildContractExpiryAlerts(contracts, contractExpiryAlertDays),
    contractExpiryAlertDays,
  }
}

export async function loadContractCreateRouteData(
  requestUrl: string,
  options: RequestOptions = {}
): Promise<ContractCreateRouteData> {
  const url = new URL(requestUrl)
  const [renters, availableRooms] = await Promise.all([
    fetchAllRenterPages(options),
    fetchAllVacantRoomPages(options),
  ])

  return {
    renters,
    availableRooms,
    preselectedRoomId: normalizeOptionalId(url.searchParams.get('roomId')),
    preselectedRenterId: normalizeOptionalId(url.searchParams.get('renterId')),
  }
}

export async function loadContractDetailRouteData(
  contractId: string,
  options: RequestOptions = {}
): Promise<ContractDetailRouteData> {
  const [contract, settings] = await Promise.all([
    fetchContractDetail(contractId, options),
    fetchApiEnvelope<Partial<AppSettings>>('/settings', '设置加载失败', options),
  ])

  return {
    contract,
    contractExpiryAlertDays: Number(settings.contractExpiryAlertDays) || 30,
  }
}

export async function loadContractEditRouteData(
  contractId: string,
  options: RequestOptions = {}
): Promise<ContractEditRouteData> {
  const contract = await fetchContractDetail(contractId, options)

  return {
    contract,
  }
}

export async function loadContractRenewRouteData(
  contractId: string,
  options: RequestOptions = {}
): Promise<ContractRenewRouteData> {
  const contract = await fetchContractDetail(contractId, options)

  return {
    contract,
  }
}

export async function loadContractCheckoutRouteData(
  contractId: string,
  options: RequestOptions = {}
): Promise<ContractCheckoutRouteData> {
  const contract = await fetchContractDetail(contractId, options)
  const activeRoomMeters = await fetchActiveRoomMeters(contract.roomId, options)

  return {
    contract: {
      ...contract,
      room: {
        ...contract.room,
        meters: activeRoomMeters,
      },
    } as ContractCheckoutRouteData['contract'],
  }
}

export async function loadBillListRouteData(
  requestUrl: string,
  options: RequestOptions = {}
): Promise<BillListRouteData> {
  const url = new URL(requestUrl)
  const initialSearchQuery = normalizeSearchQuery(url.searchParams.get('search'))
  const bills = await fetchAllBillPages(initialSearchQuery, options)

  return {
    initialSearchQuery,
    bills,
  }
}

export async function loadBillStatsRouteData(
  requestUrl: string,
  options: RequestOptions = {}
): Promise<BillStatsRouteData> {
  return fetchBillStatsRouteData(requestUrl, options)
}

export async function loadCreateBillRouteData(
  options: RequestOptions = {}
): Promise<CreateBillRouteData> {
  const contracts = await fetchAllActiveContractPages(options)

  return {
    contracts,
  }
}

export async function loadBillDetailRouteData(
  billId: string,
  options: RequestOptions = {}
): Promise<BillDetailRouteData> {
  const bill = await fetchBillDetail(billId, options)
  const utilityDetailsData =
    bill.type === 'UTILITIES'
      ? await fetchBillUtilityDetails(billId, options)
      : null

  return {
    bill,
    utilityDetailsData,
  }
}

export async function loadEditBillRouteData(
  billId: string,
  options: RequestOptions = {}
): Promise<EditBillRouteData> {
  const bill = await fetchBillDetail(billId, options)

  return {
    bill,
  }
}

export async function loadSettingsRouteData(
  options: RequestOptions = {}
): Promise<SettingsRouteData> {
  const settings = await fetchApiEnvelope<Partial<AppSettings>>(
    '/settings',
    '设置加载失败',
    options
  )

  return {
    settings,
  }
}

export async function loadMeterReadingBatchRouteData(
  options: RequestOptions = {}
): Promise<MeterReadingBatchRouteData> {
  const rooms = await fetchBatchMeterReadingRooms(options)

  return {
    rooms,
  }
}

export async function loadMeterReadingHistoryRouteData(
  requestUrl: string,
  options: RequestOptions = {}
): Promise<MeterReadingHistoryRouteData> {
  const initialFilters = normalizeMeterReadingHistoryFilters(requestUrl)
  const readings = await fetchMeterReadingHistory(initialFilters, options)

  return {
    readings,
    initialFilters,
  }
}
