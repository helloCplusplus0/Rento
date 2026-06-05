import type {
  Bill,
  BillDetail,
  Meter,
  MeterReadingRecordType,
  ReadingStatus,
} from '@prisma/client'
import { Prisma } from '@prisma/client'

import {
  defineDomainModuleBoundary,
  PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
} from '../shared'
import { globalSettings } from '@/lib/global-settings'
import { generatePeriodDescription } from '@/lib/meter-utils'
import { prisma } from '@/lib/prisma'
import { runInMainChainWriteTransaction } from '@/lib/transaction-manager'

/**
 * 仪表与抄表主链必须保留多仪表历史语义。
 * phase09-04 起正式承接抄表写入、终抄、自动出账、相关账单追溯与禁删语义。
 */
export const metersDomainBoundary = defineDomainModuleBoundary({
  name: 'meters',
  description: '承接仪表、抄表、BillDetail 与历史追溯相关语义。',
  compatBoundary: {
    strategy: 'compat-wrapper',
    reason:
      '旧抄表与仪表入口仍承接存量主链流量，同时作为多仪表历史语义的迁移对照基线。',
    exitCondition:
      '当抄表写入、BillDetail 联动、终抄结算接口已迁入 server/routes/*，并由 src/lib/domain/meters 承接事务边界后，旧入口仅保留薄包装或只读参考。',
  },
  transactionBoundary: {
    ...PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
    note:
      '抄表写入、出账联动与退租终抄的事务编排统一放到 src/lib/domain/meters。',
  },
})

type PrismaDbClient = typeof prisma | Prisma.TransactionClient

type MeterReadingWithRelations = Prisma.MeterReadingGetPayload<{
  include: {
    meter: {
      include: {
        room: {
          include: {
            building: true
          }
        }
      }
    }
    contract: {
      include: {
        renter: true
      }
    }
    bills: true
    billDetails: {
      include: {
        bill: true
      }
    }
  }
}>

type UtilityBillWithDetails = Prisma.BillGetPayload<{
  include: {
    billDetails: true
  }
}>

export type MeterReadingAggregationMode = 'SINGLE' | 'AGGREGATED'
export type MeterReadingPresentationType =
  | 'BASELINE'
  | 'REGULAR'
  | 'CHECKOUT'

export interface MeterReadingRecordTypeSemantics {
  code: MeterReadingRecordType
  label: string
  presentationType: MeterReadingPresentationType
  description: string
  duplicateGuard: 'NONE' | 'PER_METER_PERIOD'
  allowsAutoBilling: boolean
  preserveHistory: boolean
  deletePolicyCode: string
}

export interface SerializedMeterReadingBill {
  id: string
  billNumber: string
  type: string
  amount: number
  receivedAmount: number
  pendingAmount: number
  dueDate: Date
  paidDate: Date | null
  period: string | null
  status: string
  contractId: string
  paymentMethod: string | null
  operator: string | null
  remarks: string | null
  aggregationType: string | null
  metadata: string | null
  meterReadingId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SerializedMeterReadingBillDetail {
  id: string
  billId: string
  meterReadingId: string
  meterType: string
  meterName: string | null
  usage: number
  unitPrice: number
  amount: number
  unit: string
  previousReading: number | null
  currentReading: number
  readingDate: Date
  priceSource: string | null
}

export interface SerializedMeterReading {
  id: string
  meterId: string
  contractId: string | null
  previousReading: number | null
  currentReading: number
  usage: number
  recordType: MeterReadingRecordType
  readingDate: Date
  period: string | null
  unitPrice: number
  amount: number
  status: ReadingStatus
  isBilled: boolean
  operator: string | null
  remarks: string | null
  isAbnormal: boolean
  abnormalReason: string | null
  createdAt: Date
  updatedAt: Date
  meter: {
    id: string
    meterNumber: string
    displayName: string
    meterType: string
    roomId: string
    unitPrice: number
    unit: string
    location: string | null
    isActive: boolean
    room: {
      id: string
      roomNumber: string
      floorNumber: number
      buildingId: string
      status: string
      rent: number
      area: number | null
      building: {
        id: string
        name: string
        totalRooms: number
      }
    }
  }
  contract?: {
    id: string
    contractNumber: string
    status: string
    roomId: string
    renterId: string
    renter: {
      id: string
      name: string
      phone: string | null
    }
  } | null
  bills: SerializedMeterReadingBill[]
  billDetails: SerializedMeterReadingBillDetail[]
}

export interface MeterReadingDeleteSafetyCheck {
  canDelete: boolean
  errorCode: string
  blockingReasons: string[]
  suggestion: string
  recordType: MeterReadingRecordType
  isBilled: boolean
  status: ReadingStatus
  relatedBillCount: number
  relatedBillDetailCount: number
}

export interface MeterReadingDetailResult {
  reading: SerializedMeterReading
  recordTypeSemantics: MeterReadingRecordTypeSemantics
  deleteGuard: MeterReadingDeleteSafetyCheck
}

export interface CreateRegularMeterReadingInput {
  meterId: string
  contractId?: string | null
  previousReading?: number | null
  currentReading: number
  readingDate?: string | Date
  period?: string
  unitPrice?: number | null
  operator?: string | null
  remarks?: string | null
}

export interface CreateRegularMeterReadingBatchInput {
  readings: CreateRegularMeterReadingInput[]
  validateOnly?: boolean
  aggregationMode?: MeterReadingAggregationMode
}

export interface MeterReadingBatchResult {
  results: SerializedMeterReading[]
  bills: SerializedMeterReadingBill[]
  warnings: Array<Record<string, unknown>>
  errors: Array<Record<string, unknown>>
  summary: {
    total: number
    success: number
    warnings: number
    errors: number
    billsGenerated: number
  }
}

export interface RelatedBillsTraceResult {
  reading: SerializedMeterReading
  relatedBills: SerializedMeterReadingBill[]
  billDetails: Array<
    SerializedMeterReadingBill & {
      utilityDetails?: unknown
      matchedBy: Array<'direct-meterReadingId' | 'billDetail' | 'metadata' | 'same-month-fallback'>
    }
  >
  summary: {
    totalBills: number
    totalAmount: number
    paidAmount: number
    pendingAmount: number
  }
}

export interface LegacyUtilityBillCompatInput {
  contractId: string
  electricityUsage: number
  waterUsage: number
  gasUsage?: number
  readingDate: string | Date
  remarks?: string
  previousReading?: unknown
  currentReading?: unknown
}

export interface LegacyUtilityBillCompatResult {
  bill: SerializedMeterReadingBill
  reading: {
    contractId: string
    electricityUsage: number
    waterUsage: number
    gasUsage: number
    readingDate: Date
    totalCost: number
  }
}

export interface ContractUtilityBillHistoryItem {
  id: string
  billNumber: string
  amount: number
  dueDate: Date
  period: string | null
  status: string
  createdAt: Date
  readingData: {
    electricityUsage: number
    waterUsage: number
    gasUsage: number
    readingDate: Date
    meterReadingIds: string[]
  }
  contract: {
    contractNumber: string
    renter: string
    room: string
  }
}

export interface CreateContractInitialBaselineReadingsInput {
  contractId: string
  roomId: string
  contractStartDate: Date
  meterInitialReadings: Record<string, number>
  operator?: string | null
}

export interface CheckoutFinalMeterReadingInput {
  contractId: string
  roomId: string
  checkoutDate: Date
  finalMeterReadings: Record<string, number>
}

export interface CheckoutFinalMeterProcessingResult {
  meterId: string
  meterType: string
  displayName: string
  previousReading: number
  finalReading: number
  usage: number
  amount: number
  readingId: string
  billId?: string
}

export class MeterReadingDomainValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'MeterReadingDomainValidationError'
  }
}

export function isMeterReadingDomainValidationError(
  error: unknown
): error is MeterReadingDomainValidationError {
  return error instanceof MeterReadingDomainValidationError
}

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

function normalizeDate(input: string | Date | undefined, fallback = new Date()) {
  const normalized = input ? new Date(input) : fallback

  if (Number.isNaN(normalized.getTime())) {
    throw new MeterReadingDomainValidationError('抄表日期无效', 'METER_READING_DATE_INVALID')
  }

  return normalized
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function nextMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function normalizePeriod(date: Date, period?: string | null) {
  return typeof period === 'string' && period.trim()
    ? period.trim()
    : generatePeriodDescription(date)
}

function buildRegularReadingPeriodAliases(readingDate: Date, period: string) {
  return Array.from(
    new Set([
      period,
      `${readingDate.getFullYear()}-${readingDate.getMonth() + 1}`,
      `${readingDate.getFullYear()}-${String(readingDate.getMonth() + 1).padStart(2, '0')}`,
    ])
  )
}

function buildRegularReadingDuplicateWhere(
  meterId: string,
  period: string,
  readingDate: Date
): Prisma.MeterReadingWhereInput {
  const monthStart = startOfMonth(readingDate)
  const monthEnd = nextMonthStart(readingDate)
  const periodAliases = buildRegularReadingPeriodAliases(readingDate, period)

  return {
    meterId,
    recordType: 'REGULAR_READING',
    OR: [
      {
        period: {
          in: periodAliases,
        },
      },
      {
        OR: [{ period: null }, { period: '' }],
        readingDate: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    ],
  }
}

async function findRegularReadingByMeterAndPeriod(
  db: PrismaDbClient,
  meterId: string,
  period: string,
  readingDate: Date
) {
  return db.meterReading.findFirst({
    where: buildRegularReadingDuplicateWhere(meterId, period, readingDate),
    select: {
      id: true,
      currentReading: true,
      readingDate: true,
      period: true,
    },
  })
}

function getMeterReadingInclude() {
  return {
    meter: {
      include: {
        room: {
          include: {
            building: true,
          },
        },
      },
    },
    contract: {
      include: {
        renter: true,
      },
    },
    bills: true,
    billDetails: {
      include: {
        bill: true,
      },
    },
  } as const
}

function serializeBill(bill: Bill): SerializedMeterReadingBill {
  return {
    id: bill.id,
    billNumber: bill.billNumber,
    type: bill.type,
    amount: toNumber(bill.amount),
    receivedAmount: toNumber(bill.receivedAmount),
    pendingAmount: toNumber(bill.pendingAmount),
    dueDate: bill.dueDate,
    paidDate: bill.paidDate,
    period: bill.period,
    status: bill.status,
    contractId: bill.contractId,
    paymentMethod: bill.paymentMethod,
    operator: bill.operator,
    remarks: bill.remarks,
    aggregationType: bill.aggregationType,
    metadata: bill.metadata,
    meterReadingId: bill.meterReadingId,
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
  }
}

function serializeBillDetail(detail: BillDetail): SerializedMeterReadingBillDetail {
  return {
    id: detail.id,
    billId: detail.billId,
    meterReadingId: detail.meterReadingId,
    meterType: detail.meterType,
    meterName: detail.meterName,
    usage: toNumber(detail.usage),
    unitPrice: toNumber(detail.unitPrice),
    amount: toNumber(detail.amount),
    unit: detail.unit,
    previousReading:
      detail.previousReading !== null ? toNumber(detail.previousReading) : null,
    currentReading: toNumber(detail.currentReading),
    readingDate: detail.readingDate,
    priceSource: detail.priceSource,
  }
}

function serializeMeterReading(reading: MeterReadingWithRelations): SerializedMeterReading {
  return {
    id: reading.id,
    meterId: reading.meterId,
    contractId: reading.contractId,
    previousReading:
      reading.previousReading !== null ? toNumber(reading.previousReading) : null,
    currentReading: toNumber(reading.currentReading),
    usage: toNumber(reading.usage),
    recordType: reading.recordType,
    readingDate: reading.readingDate,
    period: reading.period,
    unitPrice: toNumber(reading.unitPrice),
    amount: toNumber(reading.amount),
    status: reading.status,
    isBilled: reading.isBilled,
    operator: reading.operator,
    remarks: reading.remarks,
    isAbnormal: reading.isAbnormal,
    abnormalReason: reading.abnormalReason,
    createdAt: reading.createdAt,
    updatedAt: reading.updatedAt,
    meter: {
      id: reading.meter.id,
      meterNumber: reading.meter.meterNumber,
      displayName: reading.meter.displayName,
      meterType: reading.meter.meterType,
      roomId: reading.meter.roomId,
      unitPrice: toNumber(reading.meter.unitPrice),
      unit: reading.meter.unit,
      location: reading.meter.location,
      isActive: reading.meter.isActive,
      room: {
        id: reading.meter.room.id,
        roomNumber: reading.meter.room.roomNumber,
        floorNumber: reading.meter.room.floorNumber,
        buildingId: reading.meter.room.buildingId,
        status: reading.meter.room.status,
        rent: toNumber(reading.meter.room.rent),
        area: reading.meter.room.area !== null ? toNumber(reading.meter.room.area) : null,
        building: {
          id: reading.meter.room.building.id,
          name: reading.meter.room.building.name,
          totalRooms: reading.meter.room.building.totalRooms,
        },
      },
    },
    contract: reading.contract
      ? {
          id: reading.contract.id,
          contractNumber: reading.contract.contractNumber,
          status: reading.contract.status,
          roomId: reading.contract.roomId,
          renterId: reading.contract.renterId,
          renter: {
            id: reading.contract.renter.id,
            name: reading.contract.renter.name,
            phone: reading.contract.renter.phone,
          },
        }
      : null,
    bills: reading.bills.map(serializeBill),
    billDetails: reading.billDetails.map((detail) => serializeBillDetail(detail)),
  }
}

const METER_READING_RECORD_TYPE_SEMANTICS: Record<
  MeterReadingRecordType,
  MeterReadingRecordTypeSemantics
> = {
  INITIAL_BASELINE: {
    code: 'INITIAL_BASELINE',
    label: '合同初始底数',
    presentationType: 'BASELINE',
    description: '合同创建时写入的仪表底数，用于后续正式抄表的起点。',
    duplicateGuard: 'NONE',
    allowsAutoBilling: false,
    preserveHistory: true,
    deletePolicyCode: 'METER_READING_BASELINE_HISTORY_PROTECTED',
  },
  REGULAR_READING: {
    code: 'REGULAR_READING',
    label: '正式抄表',
    presentationType: 'REGULAR',
    description: '正常计费周期内的正式抄表记录，按仪表+业务周期执行重复门禁。',
    duplicateGuard: 'PER_METER_PERIOD',
    allowsAutoBilling: true,
    preserveHistory: true,
    deletePolicyCode: 'METER_READING_DELETE_DISABLED',
  },
  CHECKOUT_FINAL: {
    code: 'CHECKOUT_FINAL',
    label: '退租最终抄表',
    presentationType: 'CHECKOUT',
    description: '退租结算时写入的最终抄表记录，用于冻结合同结束时的计费用量。',
    duplicateGuard: 'NONE',
    allowsAutoBilling: true,
    preserveHistory: true,
    deletePolicyCode: 'METER_READING_CHECKOUT_HISTORY_PROTECTED',
  },
}

export function getMeterReadingRecordTypeSemantics(
  recordType: MeterReadingRecordType
) {
  return METER_READING_RECORD_TYPE_SEMANTICS[recordType]
}

function buildMeterReadingDeleteSafetyCheck(
  reading: MeterReadingWithRelations
): MeterReadingDeleteSafetyCheck {
  const semantics = getMeterReadingRecordTypeSemantics(reading.recordType)
  const blockingReasons = [semantics.deletePolicyCode]

  if (reading.billDetails.length > 0) {
    blockingReasons.push('METER_READING_HAS_BILL_DETAILS')
  }

  if (reading.bills.length > 0 || reading.isBilled) {
    blockingReasons.push('METER_READING_HAS_RELATED_BILLS')
  }

  if (reading.recordType === 'CHECKOUT_FINAL') {
    blockingReasons.push('METER_READING_IS_CHECKOUT_FINAL')
  }

  if (reading.recordType === 'INITIAL_BASELINE') {
    blockingReasons.push('METER_READING_IS_INITIAL_BASELINE')
  }

  const suggestion =
    reading.recordType === 'CHECKOUT_FINAL'
      ? '退租最终抄表属于正式结算事实，请保留历史并通过退租结算链路修正后续业务。'
      : reading.recordType === 'INITIAL_BASELINE'
        ? '合同初始底数属于后续计费基线，请保留历史并通过补录或专用修正流程处理。'
        : reading.isBilled || reading.bills.length > 0 || reading.billDetails.length > 0
          ? '抄表记录已进入账务追溯链路，请保留历史并改用账单或结算修正流程。'
          : '当前阶段默认禁删抄表历史，请保留历史并通过补录、冲正或业务修正流程处理。'

  return {
    canDelete: false,
    errorCode: blockingReasons[0],
    blockingReasons,
    suggestion,
    recordType: reading.recordType,
    isBilled: reading.isBilled,
    status: reading.status,
    relatedBillCount: reading.bills.length,
    relatedBillDetailCount: reading.billDetails.length,
  }
}

async function getMeterReadingSnapshot(
  db: PrismaDbClient,
  readingId: string
) {
  return db.meterReading.findUnique({
    where: { id: readingId },
    include: getMeterReadingInclude(),
  })
}

function parseBillMetadata(metadata: string | null) {
  if (!metadata) {
    return null
  }

  try {
    return JSON.parse(metadata) as Record<string, any>
  } catch {
    return null
  }
}

function generateBillNumber(type: string, contractNumber: string) {
  const timestamp = Date.now().toString().slice(-6)
  const typePrefix =
    {
      RENT: 'R',
      DEPOSIT: 'D',
      UTILITIES: 'U',
      OTHER: 'O',
    }[type] || 'B'

  return `BILL${contractNumber.slice(-3)}${typePrefix}${timestamp}`
}

function calculateDueDate(readingDate: Date) {
  const dueDate = new Date(readingDate)
  dueDate.setDate(dueDate.getDate() + 10)
  return dueDate
}

function buildUtilityBillRemarks(readings: SerializedMeterReading[]) {
  const remarkParts = readings.map((reading) => {
    const meterTypeLabel =
      {
        ELECTRICITY: '电费',
        COLD_WATER: '冷水费',
        HOT_WATER: '热水费',
        GAS: '燃气费',
      }[reading.meter.meterType] || '水电费'

    return `${meterTypeLabel}${reading.amount}元(${reading.usage}${reading.meter.unit})`
  })

  return `水电费账单 - ${remarkParts.join('，')}`
}

function buildUtilityDetails(
  readings: SerializedMeterReading[],
  strategy: MeterReadingAggregationMode,
  period: string
) {
  return {
    period,
    generationStrategy: strategy,
    generatedAt: new Date().toISOString(),
    meterReadingIds: readings.map((reading) => reading.id),
    breakdown: readings.map((reading) => ({
      meterReadingId: reading.id,
      meterId: reading.meterId,
      meterType: reading.meter.meterType,
      meterName: reading.meter.displayName,
      usage: reading.usage,
      unit: reading.meter.unit,
      unitPrice: reading.unitPrice,
      amount: reading.amount,
      readingDate: reading.readingDate.toISOString(),
    })),
  }
}

function selectAggregationMode(
  readings: SerializedMeterReading[],
  userPreference?: MeterReadingAggregationMode
) {
  if (userPreference === 'SINGLE' || userPreference === 'AGGREGATED') {
    return userPreference
  }

  return readings.length > 1 ? 'AGGREGATED' : 'SINGLE'
}

async function generateUtilityBillsForRegularReadings(params: {
  readings: SerializedMeterReading[]
  aggregationMode?: MeterReadingAggregationMode
}) {
  const groupedByContract = new Map<string, SerializedMeterReading[]>()

  for (const reading of params.readings) {
    if (!reading.contractId || reading.recordType !== 'REGULAR_READING') {
      continue
    }

    if (!groupedByContract.has(reading.contractId)) {
      groupedByContract.set(reading.contractId, [])
    }

    groupedByContract.get(reading.contractId)?.push(reading)
  }

  const bills: SerializedMeterReadingBill[] = []
  const warnings: Array<Record<string, unknown>> = []

  for (const [contractId, readings] of groupedByContract.entries()) {
    if (readings.length === 0) {
      continue
    }

    const selectedAggregationMode = selectAggregationMode(
      readings,
      params.aggregationMode
    )

    try {
      const generatedBills = await runInMainChainWriteTransaction(async (tx) => {
        const contract = await tx.contract.findUnique({
          where: { id: contractId },
          select: {
            id: true,
            contractNumber: true,
          },
        })

        if (!contract) {
          throw new MeterReadingDomainValidationError(
            '关联合同不存在，无法自动生成账单',
            'METER_READING_CONTRACT_NOT_FOUND',
            { contractId }
          )
        }

        const period = readings[0]?.period || normalizePeriod(readings[0].readingDate)
        const dueDate = calculateDueDate(readings[0].readingDate)

        if (selectedAggregationMode === 'SINGLE') {
          const createdBills: SerializedMeterReadingBill[] = []

          for (const reading of readings) {
            const utilityDetails = buildUtilityDetails([reading], 'SINGLE', period)
            const bill = await tx.bill.create({
              data: {
                billNumber: generateBillNumber('UTILITIES', contract.contractNumber),
                type: 'UTILITIES',
                amount: reading.amount,
                receivedAmount: 0,
                pendingAmount: reading.amount,
                dueDate,
                period,
                status: 'PENDING',
                contractId,
                meterReadingId: reading.id,
                aggregationType: 'SINGLE',
                remarks: buildUtilityBillRemarks([reading]),
                metadata: JSON.stringify({
                  triggerType: 'UTILITY_READING',
                  generatedAt: new Date().toISOString(),
                  aggregationStrategy: 'SINGLE',
                  utilityDetails,
                }),
              },
            })

            await tx.meterReading.update({
              where: { id: reading.id },
              data: {
                isBilled: true,
                status: 'BILLED',
              },
            })

            createdBills.push(serializeBill(bill))
          }

          return createdBills
        }

        const totalAmount = readings.reduce((sum, reading) => sum + reading.amount, 0)
        const utilityDetails = buildUtilityDetails(readings, 'AGGREGATED', period)
        const bill = await tx.bill.create({
          data: {
            billNumber: generateBillNumber('UTILITIES', contract.contractNumber),
            type: 'UTILITIES',
            amount: totalAmount,
            receivedAmount: 0,
            pendingAmount: totalAmount,
            dueDate,
            period,
            status: 'PENDING',
            contractId,
            aggregationType: 'AGGREGATED',
            remarks: buildUtilityBillRemarks(readings),
            metadata: JSON.stringify({
              triggerType: 'UTILITY_READING',
              generatedAt: new Date().toISOString(),
              aggregationStrategy: 'AGGREGATED',
              utilityDetails,
            }),
          },
        })

        for (const reading of readings) {
          await tx.billDetail.create({
            data: {
              billId: bill.id,
              meterReadingId: reading.id,
              meterType: reading.meter.meterType as any,
              meterName: reading.meter.displayName,
              usage: reading.usage,
              unitPrice: reading.unitPrice,
              amount: reading.amount,
              unit: reading.meter.unit,
              previousReading: reading.previousReading ?? 0,
              currentReading: reading.currentReading,
              readingDate: reading.readingDate,
              priceSource:
                reading.meter.unitPrice > 0 ? 'METER_CONFIG' : 'GLOBAL_SETTING',
            },
          })
        }

        await tx.meterReading.updateMany({
          where: {
            id: {
              in: readings.map((reading) => reading.id),
            },
          },
          data: {
            isBilled: true,
            status: 'BILLED',
          },
        })

        return [serializeBill(bill)]
      })

      bills.push(...generatedBills)
    } catch (error) {
      warnings.push({
        contractId,
        warning:
          error instanceof Error
            ? error.message
            : '自动生成水电账单失败',
      })
    }
  }

  return {
    bills,
    warnings,
  }
}

function buildUtilitySummary(bills: SerializedMeterReadingBill[]) {
  return {
    totalBills: bills.length,
    totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
    paidAmount: bills.reduce((sum, bill) => sum + bill.receivedAmount, 0),
    pendingAmount: bills.reduce((sum, bill) => sum + bill.pendingAmount, 0),
  }
}

export async function getMeterReadingDetail(
  readingId: string
): Promise<MeterReadingDetailResult> {
  const reading = await getMeterReadingSnapshot(prisma, readingId)

  if (!reading) {
    throw new Error('MeterReading not found')
  }

  return {
    reading: serializeMeterReading(reading),
    recordTypeSemantics: getMeterReadingRecordTypeSemantics(reading.recordType),
    deleteGuard: buildMeterReadingDeleteSafetyCheck(reading),
  }
}

export async function performMeterReadingDeleteSafetyCheck(
  readingId: string
): Promise<MeterReadingDeleteSafetyCheck> {
  const reading = await getMeterReadingSnapshot(prisma, readingId)

  if (!reading) {
    throw new Error('MeterReading not found')
  }

  return buildMeterReadingDeleteSafetyCheck(reading)
}

async function createSingleRegularMeterReading(
  input: CreateRegularMeterReadingInput
) {
  const fallbackReadingDate = new Date()
  const readingDate = normalizeDate(input.readingDate, fallbackReadingDate)
  const period = normalizePeriod(readingDate, input.period)

  const meter = await prisma.meter.findUnique({
    where: { id: input.meterId },
    include: {
      room: {
        include: {
          building: true,
        },
      },
    },
  })

  if (!meter) {
    throw new MeterReadingDomainValidationError('仪表不存在', 'METER_NOT_FOUND', {
      meterId: input.meterId,
    })
  }

  const previousReading =
    input.previousReading !== undefined && input.previousReading !== null
      ? Number(input.previousReading)
      : 0
  const currentReading = Number(input.currentReading)

  if (!Number.isFinite(currentReading)) {
    throw new MeterReadingDomainValidationError(
      '当前读数必须为有效数字',
      'METER_READING_CURRENT_INVALID',
      { meterId: input.meterId }
    )
  }

  if (currentReading < previousReading) {
    throw new MeterReadingDomainValidationError(
      '当前读数不能小于上次读数',
      'METER_READING_NEGATIVE_USAGE',
      {
        meterId: input.meterId,
        currentReading,
        previousReading,
      }
    )
  }

  const duplicateReading = await findRegularReadingByMeterAndPeriod(
    prisma,
    input.meterId,
    period,
    readingDate
  )

  if (duplicateReading) {
    return {
      type: 'duplicate' as const,
      meter,
      period,
      readingDate,
      duplicateReading,
    }
  }

  const usage = currentReading - previousReading
  const unitPrice =
    input.unitPrice !== undefined && input.unitPrice !== null
      ? Number(input.unitPrice)
      : toNumber(meter.unitPrice)
  const amount = usage * unitPrice

  const createdReading = await runInMainChainWriteTransaction(async (tx) => {
    const duplicateInTransaction = await findRegularReadingByMeterAndPeriod(
      tx,
      input.meterId,
      period,
      readingDate
    )

    if (duplicateInTransaction) {
      return null
    }

    return tx.meterReading.create({
      data: {
        meterId: input.meterId,
        contractId: input.contractId || undefined,
        previousReading,
        currentReading,
        usage,
        recordType: 'REGULAR_READING',
        readingDate,
        period,
        unitPrice,
        amount,
        operator: input.operator || 'system',
        remarks: input.remarks || undefined,
      },
      include: getMeterReadingInclude(),
    })
  })

  if (!createdReading) {
    return {
      type: 'duplicate' as const,
      meter,
      period,
      readingDate,
      duplicateReading: {
        id: 'unknown',
        currentReading,
        readingDate,
        period,
      },
    }
  }

  return {
    type: 'created' as const,
    reading: serializeMeterReading(createdReading),
  }
}

export async function createRegularMeterReadingBatch(
  input: CreateRegularMeterReadingBatchInput
): Promise<MeterReadingBatchResult> {
  if (!Array.isArray(input.readings) || input.readings.length === 0) {
    throw new MeterReadingDomainValidationError(
      '请提供有效的抄表数据数组',
      'METER_READING_BATCH_EMPTY'
    )
  }

  const validateOnly = input.validateOnly === true
  const readingSettingsLoadResult = await globalSettings.getReadingSettings()
  const warnings: Array<Record<string, unknown>> = []
  const errors: Array<Record<string, unknown>> = []
  const results: SerializedMeterReading[] = []

  if (readingSettingsLoadResult.source !== 'database') {
    warnings.push({
      warning: `抄表全局设置读取未完全命中数据库，已回退默认值: ${readingSettingsLoadResult.fallbackKeys.join(', ')}`,
    })
  }

  for (const readingInput of input.readings) {
    try {
      if (!readingInput.meterId) {
        throw new MeterReadingDomainValidationError(
          '缺少仪表ID',
          'METER_READING_METER_ID_REQUIRED'
        )
      }

      if (readingInput.currentReading === undefined || readingInput.currentReading === null) {
        throw new MeterReadingDomainValidationError(
          '缺少当前读数',
          'METER_READING_CURRENT_REQUIRED',
          { meterId: readingInput.meterId }
        )
      }

      if (validateOnly) {
        const previewDate = normalizeDate(readingInput.readingDate, new Date())
        const previewPeriod = normalizePeriod(previewDate, readingInput.period)
        const duplicate = await findRegularReadingByMeterAndPeriod(
          prisma,
          readingInput.meterId,
          previewPeriod,
          previewDate
        )

        if (duplicate) {
          warnings.push({
            meterId: readingInput.meterId,
            warning: `该周期已存在正式抄表记录（${duplicate.period || previewPeriod}），当前提交仅做校验`,
          })
        }

        continue
      }

      const creationResult = await createSingleRegularMeterReading(readingInput)

      if (creationResult.type === 'duplicate') {
        warnings.push({
          meterId: readingInput.meterId,
          warning: `该周期已存在正式抄表记录（${creationResult.duplicateReading.period || creationResult.period}），本次提交已跳过`,
        })
        continue
      }

      results.push(creationResult.reading)
    } catch (error) {
      errors.push({
        meterId: readingInput.meterId,
        error: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  let generatedBills: SerializedMeterReadingBill[] = []
  if (
    !validateOnly &&
    readingSettingsLoadResult.settings.autoGenerateBills &&
    results.length > 0
  ) {
    const billResult = await generateUtilityBillsForRegularReadings({
      readings: results,
      aggregationMode: input.aggregationMode,
    })
    generatedBills = billResult.bills
    warnings.push(...billResult.warnings)
  }

  return {
    results,
    bills: generatedBills,
    warnings,
    errors,
    summary: {
      total: input.readings.length,
      success: results.length,
      warnings: warnings.length,
      errors: errors.length,
      billsGenerated: generatedBills.length,
    },
  }
}

export async function getRelatedBillsForMeterReading(
  readingId: string
): Promise<RelatedBillsTraceResult> {
  const readingSnapshot = await getMeterReadingSnapshot(prisma, readingId)

  if (!readingSnapshot) {
    throw new Error('MeterReading not found')
  }

  const reading = serializeMeterReading(readingSnapshot)
  const relatedMap = new Map<
    string,
    SerializedMeterReadingBill & {
      utilityDetails?: unknown
      matchedBy: Array<'direct-meterReadingId' | 'billDetail' | 'metadata' | 'same-month-fallback'>
    }
  >()

  for (const bill of readingSnapshot.bills) {
    relatedMap.set(bill.id, {
      ...serializeBill(bill),
      utilityDetails: parseBillMetadata(bill.metadata)?.utilityDetails,
      matchedBy: ['direct-meterReadingId'],
    })
  }

  const relatedByBillDetails = await prisma.billDetail.findMany({
    where: {
      meterReadingId: readingId,
    },
    include: {
      bill: true,
    },
  })

  for (const detail of relatedByBillDetails) {
    const existing = relatedMap.get(detail.bill.id)
    if (existing) {
      if (!existing.matchedBy.includes('billDetail')) {
        existing.matchedBy.push('billDetail')
      }
      continue
    }

    relatedMap.set(detail.bill.id, {
      ...serializeBill(detail.bill),
      utilityDetails: parseBillMetadata(detail.bill.metadata)?.utilityDetails,
      matchedBy: ['billDetail'],
    })
  }

  let contractUtilityBills: UtilityBillWithDetails[] = []
  if (reading.contractId) {
    contractUtilityBills = await prisma.bill.findMany({
      where: {
        contractId: reading.contractId,
        type: 'UTILITIES',
      },
      include: {
        billDetails: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  for (const bill of contractUtilityBills) {
    const metadata = parseBillMetadata(bill.metadata)
    const meterReadingIds = metadata?.utilityDetails?.meterReadingIds

    if (Array.isArray(meterReadingIds) && meterReadingIds.includes(readingId)) {
      const existing = relatedMap.get(bill.id)
      if (existing) {
        if (!existing.matchedBy.includes('metadata')) {
          existing.matchedBy.push('metadata')
        }
      } else {
        relatedMap.set(bill.id, {
          ...serializeBill(bill),
          utilityDetails: metadata?.utilityDetails,
          matchedBy: ['metadata'],
        })
      }
    }
  }

  if (relatedMap.size === 0 && reading.contractId) {
    const monthStart = startOfMonth(reading.readingDate)
    const monthEnd = nextMonthStart(reading.readingDate)

    for (const bill of contractUtilityBills) {
      if (bill.createdAt >= monthStart && bill.createdAt < monthEnd) {
        relatedMap.set(bill.id, {
          ...serializeBill(bill),
          utilityDetails: parseBillMetadata(bill.metadata)?.utilityDetails,
          matchedBy: ['same-month-fallback'],
        })
      }
    }
  }

  const relatedBills = Array.from(relatedMap.values())
  return {
    reading,
    relatedBills,
    billDetails: relatedBills,
    summary: buildUtilitySummary(relatedBills),
  }
}

function buildLegacyUtilityBillMetadata(params: {
  readingDate: Date
  electricityUsage: number
  waterUsage: number
  gasUsage: number
}) {
  const periodStart = new Date(
    params.readingDate.getFullYear(),
    params.readingDate.getMonth(),
    1
  )
  const periodEnd = new Date(
    params.readingDate.getFullYear(),
    params.readingDate.getMonth() + 1,
    0
  )

  return {
    period: `${periodStart.toISOString().slice(0, 10)} 至 ${periodEnd.toISOString().slice(0, 10)}`,
    generatedAt: new Date().toISOString(),
    meterReadingIds: [] as string[],
    generationStrategy: 'LEGACY_UTILITY_COMPAT',
    breakdown: {
      electricity: {
        usage: params.electricityUsage,
      },
      water: {
        usage: params.waterUsage,
      },
      gas: params.gasUsage > 0 ? { usage: params.gasUsage } : null,
    },
  }
}

export async function generateLegacyUtilityBillCompat(
  input: LegacyUtilityBillCompatInput
): Promise<LegacyUtilityBillCompatResult> {
  const contract = await prisma.contract.findUnique({
    where: { id: input.contractId },
    include: {
      room: {
        include: {
          building: true,
        },
      },
      renter: true,
    },
  })

  if (!contract) {
    throw new MeterReadingDomainValidationError('合同不存在', 'UTILITY_CONTRACT_NOT_FOUND', {
      contractId: input.contractId,
    })
  }

  const readingDate = normalizeDate(input.readingDate)
  const utilityBillSettings = await globalSettings.getBillingSettings()
  const electricityPrice = Number(utilityBillSettings.electricityPrice || 0)
  const waterPrice = Number(utilityBillSettings.waterPrice || 0)
  const gasPrice = Number(utilityBillSettings.gasPrice || 0)
  const totalCost =
    input.electricityUsage * electricityPrice +
    input.waterUsage * waterPrice +
    (input.gasUsage || 0) * gasPrice
  const utilityDetails = buildLegacyUtilityBillMetadata({
    readingDate,
    electricityUsage: input.electricityUsage,
    waterUsage: input.waterUsage,
    gasUsage: input.gasUsage || 0,
  })

  const bill = await runInMainChainWriteTransaction(async (tx) => {
    return tx.bill.create({
      data: {
        billNumber: generateBillNumber('UTILITIES', contract.contractNumber),
        type: 'UTILITIES',
        amount: totalCost,
        receivedAmount: 0,
        pendingAmount: totalCost,
        dueDate: calculateDueDate(readingDate),
        period: utilityDetails.period,
        status: 'PENDING',
        contractId: contract.id,
        aggregationType: 'LEGACY_COMPAT',
        remarks:
          input.remarks ||
          `水电费账单 - 电费${input.electricityUsage}、水费${input.waterUsage}${input.gasUsage ? `、燃气${input.gasUsage}` : ''}`,
        metadata: JSON.stringify({
          triggerType: 'UTILITY_READING',
          generatedAt: new Date().toISOString(),
          aggregationStrategy: 'LEGACY_UTILITY_COMPAT',
          calculationBasis: {
            electricityPrice,
            waterPrice,
            gasPrice,
          },
          utilityDetails,
        }),
      },
    })
  })

  return {
    bill: serializeBill(bill),
    reading: {
      contractId: contract.id,
      electricityUsage: input.electricityUsage,
      waterUsage: input.waterUsage,
      gasUsage: input.gasUsage || 0,
      readingDate,
      totalCost,
    },
  }
}

export async function listContractUtilityBillHistory(
  contractId: string
): Promise<ContractUtilityBillHistoryItem[]> {
  const utilityBills = await prisma.bill.findMany({
    where: {
      contractId,
      type: 'UTILITIES',
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      contract: {
        include: {
          room: {
            include: {
              building: true,
            },
          },
          renter: true,
        },
      },
    },
  })

  return utilityBills.map((bill) => {
    const metadata = parseBillMetadata(bill.metadata)
    const utilityDetails = metadata?.utilityDetails
    const breakdown = utilityDetails?.breakdown

    return {
      id: bill.id,
      billNumber: bill.billNumber,
      amount: toNumber(bill.amount),
      dueDate: bill.dueDate,
      period: bill.period,
      status: bill.status,
      createdAt: bill.createdAt,
      readingData: {
        electricityUsage: Number(breakdown?.electricity?.usage || 0),
        waterUsage: Number(breakdown?.water?.usage || 0),
        gasUsage: Number(breakdown?.gas?.usage || 0),
        readingDate: utilityDetails?.generatedAt
          ? new Date(utilityDetails.generatedAt)
          : bill.createdAt,
        meterReadingIds: Array.isArray(utilityDetails?.meterReadingIds)
          ? utilityDetails.meterReadingIds
          : [],
      },
      contract: {
        contractNumber: bill.contract.contractNumber,
        renter: bill.contract.renter.name,
        room: `${bill.contract.room.building.name} - ${bill.contract.room.roomNumber}`,
      },
    }
  })
}

export async function createInitialBaselineReadingsForContractTx(
  db: PrismaDbClient,
  input: CreateContractInitialBaselineReadingsInput
) {
  if (!input.meterInitialReadings || Object.keys(input.meterInitialReadings).length === 0) {
    return []
  }

  const roomMeters = await db.meter.findMany({
    where: {
      roomId: input.roomId,
      isActive: true,
    },
    select: {
      id: true,
      unitPrice: true,
    },
  })

  const baselineDrafts = roomMeters
    .filter((meter) => input.meterInitialReadings[meter.id] !== undefined)
    .map((meter) => ({
      meterId: meter.id,
      contractId: input.contractId,
      currentReading: input.meterInitialReadings[meter.id],
      previousReading: null,
      usage: 0,
      recordType: 'INITIAL_BASELINE' as const,
      unitPrice: meter.unitPrice,
      amount: 0,
      readingDate: input.contractStartDate,
      period: `${input.contractStartDate.toISOString().slice(0, 7)} 初始读数`,
      status: 'CONFIRMED' as const,
      isBilled: false,
      operator: input.operator || 'SYSTEM',
      remarks: '合同创建时的仪表底数',
    }))

  if (baselineDrafts.length === 0) {
    return []
  }

  await db.meterReading.createMany({
    data: baselineDrafts,
  })

  return baselineDrafts
}

function resolveCheckoutFinalReadingInput(
  meter: Pick<Meter, 'id' | 'meterType'>,
  finalMeterReadings: Record<string, number>
) {
  const meterScopedReading = finalMeterReadings[meter.id]
  if (meterScopedReading !== undefined) {
    return meterScopedReading
  }

  // 兼容旧宿主按 meterType 小写键传入的终抄载荷，避免 phase09-04 收口期间中断存量链路。
  return finalMeterReadings[meter.meterType.toLowerCase()]
}

export async function createCheckoutFinalReadingsTx(
  db: PrismaDbClient,
  input: CheckoutFinalMeterReadingInput
): Promise<CheckoutFinalMeterProcessingResult[]> {
  const roomMeters = await db.meter.findMany({
    where: {
      roomId: input.roomId,
      isActive: true,
    },
  })

  const results: CheckoutFinalMeterProcessingResult[] = []

  for (const meter of roomMeters) {
    const finalReading = resolveCheckoutFinalReadingInput(
      meter,
      input.finalMeterReadings
    )

    if (
      finalReading === undefined ||
      finalReading === null ||
      !Number.isFinite(Number(finalReading))
    ) {
      continue
    }

    const latestReading = await db.meterReading.findFirst({
      where: {
        meterId: meter.id,
      },
      orderBy: [{ readingDate: 'desc' }, { createdAt: 'desc' }],
    })

    const previousReading = latestReading?.currentReading
      ? toNumber(latestReading.currentReading)
      : 0
    const normalizedFinalReading = Number(finalReading)

    if (normalizedFinalReading < previousReading) {
      throw new MeterReadingDomainValidationError(
        `仪表 ${meter.displayName} 的最终读数不能小于最近读数`,
        'CHECKOUT_FINAL_READING_BELOW_LATEST',
        {
          meterId: meter.id,
          meterType: meter.meterType,
          displayName: meter.displayName,
          previousReading,
          finalReading: normalizedFinalReading,
        }
      )
    }

    const usage = normalizedFinalReading - previousReading
    const amount = usage * toNumber(meter.unitPrice)
    const createdReading = await db.meterReading.create({
      data: {
        meterId: meter.id,
        contractId: input.contractId,
        previousReading,
        currentReading: normalizedFinalReading,
        usage,
        recordType: 'CHECKOUT_FINAL',
        readingDate: input.checkoutDate,
        period: `退租结算-${input.checkoutDate.toISOString().split('T')[0]}`,
        unitPrice: meter.unitPrice,
        amount,
        status: 'CONFIRMED',
        operator: '退租结算',
        remarks: '退租时最终读数',
      },
    })

    let billId: string | undefined
    if (usage > 0 && amount > 0) {
      const utilityDetails = buildUtilityDetails(
        [
          {
            id: createdReading.id,
            meterId: meter.id,
            contractId: input.contractId,
            previousReading,
            currentReading: normalizedFinalReading,
            usage,
            recordType: 'CHECKOUT_FINAL',
            readingDate: input.checkoutDate,
            period: `退租结算-${input.checkoutDate.toISOString().split('T')[0]}`,
            unitPrice: toNumber(meter.unitPrice),
            amount,
            status: 'CONFIRMED',
            isBilled: true,
            operator: '退租结算',
            remarks: '退租时最终读数',
            isAbnormal: false,
            abnormalReason: null,
            createdAt: createdReading.createdAt,
            updatedAt: createdReading.updatedAt,
            meter: {
              id: meter.id,
              meterNumber: meter.meterNumber,
              displayName: meter.displayName,
              meterType: meter.meterType,
              roomId: meter.roomId,
              unitPrice: toNumber(meter.unitPrice),
              unit: meter.unit,
              location: meter.location,
              isActive: meter.isActive,
              room: {
                id: input.roomId,
                roomNumber: '',
                floorNumber: 0,
                buildingId: '',
                status: '',
                rent: 0,
                area: null,
                building: {
                  id: '',
                  name: '',
                  totalRooms: 0,
                },
              },
            },
            contract: null,
            bills: [],
            billDetails: [],
          },
        ],
        'SINGLE',
        `退租结算-${meter.displayName}-${input.checkoutDate.toISOString().split('T')[0]}`
      )
      const bill = await db.bill.create({
        data: {
          billNumber: `UT${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          type: 'UTILITIES',
          amount,
          receivedAmount: amount,
          pendingAmount: 0,
          dueDate: input.checkoutDate,
          paidDate: input.checkoutDate,
          period: `退租结算-${meter.displayName}-${input.checkoutDate.toISOString().split('T')[0]}`,
          status: 'COMPLETED',
          contractId: input.contractId,
          meterReadingId: createdReading.id,
          aggregationType: 'SINGLE',
          paymentMethod: '退租结算',
          operator: '系统自动',
          remarks: `退租时${meter.displayName}用量结算：${usage}${meter.unit}`,
          metadata: JSON.stringify({
            triggerType: 'UTILITY_READING',
            generatedAt: new Date().toISOString(),
            aggregationStrategy: 'CHECKOUT_FINAL',
            utilityDetails,
          }),
        },
      })

      await db.meterReading.update({
        where: {
          id: createdReading.id,
        },
        data: {
          isBilled: true,
          status: 'BILLED',
        },
      })

      billId = bill.id
    }

    results.push({
      meterId: meter.id,
      meterType: meter.meterType,
      displayName: meter.displayName,
      previousReading,
      finalReading: normalizedFinalReading,
      usage,
      amount,
      readingId: createdReading.id,
      ...(billId ? { billId } : {}),
    })
  }

  return results
}

export const meterReadingDomainService = {
  getMeterReadingDetail,
  createRegularMeterReadingBatch,
  getRelatedBillsForMeterReading,
  performMeterReadingDeleteSafetyCheck,
  createInitialBaselineReadingsForContractTx,
  createCheckoutFinalReadingsTx,
  generateLegacyUtilityBillCompat,
  listContractUtilityBillHistory,
  getMeterReadingRecordTypeSemantics,
}
