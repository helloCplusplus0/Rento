import {
  calculateDaysUntilContractExpiry,
  isContractExpiringSoon,
} from '@/lib/contract-alert-semantics'
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

export interface ContractListRouteData {
  initialSearchQuery: string
  contracts: any[]
  stats: ContractStats
  expiryAlerts: ContractExpiryAlert[]
  contractExpiryAlertDays: number
}

export interface BillListRouteData {
  initialSearchQuery: string
  bills: any[]
}

export interface SettingsRouteData {
  settings: Partial<AppSettings>
}

function buildApiUrl(path: string) {
  const basePath = minixClientEnv.apiBaseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${basePath}${normalizedPath}`
}

function normalizeSearchQuery(value: string | null) {
  return value?.trim() || ''
}

function normalizeTotalPages(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return 1
  }

  return Math.trunc(value)
}

async function readJsonResponse<TData>(
  response: Response,
  fallbackMessage: string
): Promise<TData> {
  try {
    return (await response.json()) as TData
  } catch {
    throw new Response(fallbackMessage, {
      status: response.status || 500,
      statusText: fallbackMessage,
    })
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

    throw new Response(detail, {
      status: response.status,
      statusText: fallbackMessage,
    })
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
    throw new Response(payload.error || fallbackMessage, {
      status: 500,
      statusText: fallbackMessage,
    })
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

async function fetchAllContractPages(options: RequestOptions = {}) {
  const contracts: any[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
    })

    const payload = await fetchApiEnvelope<ContractListResponse>(
      `/contracts?${searchParams.toString()}`,
      '合同列表加载失败',
      options
    )

    contracts.push(...payload.contracts)
    totalPages = normalizeTotalPages(payload.totalPages)
    page += 1
  }

  return contracts
}

async function fetchAllBillPages(
  initialSearchQuery: string,
  options: RequestOptions = {}
) {
  const bills: any[] = []
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

    bills.push(...payload.data)
    totalPages = normalizeTotalPages(payload.totalPages)
    page += 1
  }

  return bills
}

function buildContractStats(
  contracts: any[],
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
  contracts: any[],
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

export async function loadContractListRouteData(
  requestUrl: string,
  options: RequestOptions = {}
): Promise<ContractListRouteData> {
  const url = new URL(requestUrl)
  const initialSearchQuery = normalizeSearchQuery(url.searchParams.get('search'))
  const [contracts, settings] = await Promise.all([
    fetchAllContractPages(options),
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
