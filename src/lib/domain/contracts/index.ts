import { Prisma } from '@prisma/client'

import {
  applyCheckoutSettlementSubmission,
  buildCheckoutBillStatusAfterSettlement,
  calculateCheckoutSettlement,
  type AppliedCheckoutSettlementResult,
  type CheckoutSettlementSubmissionItem,
} from '@/lib/checkout-settlement'
import { prisma } from '@/lib/prisma'
import { runInMainChainWriteTransaction } from '@/lib/transaction-manager'
import {
  BILL_AMOUNT_EPSILON,
  OPEN_BILL_STATUSES,
  generateBaseBillsForContract,
  repairMissingRentBillsForContract,
  toBillAmount,
  type GeneratedBaseBillSummary,
} from '../billing'
import {
  createCheckoutFinalReadingsTx,
  type CheckoutFinalMeterProcessingResult,
} from '../meters'
import {
  defineDomainModuleBoundary,
  PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
} from '../shared'

/**
 * Contract 仍是主链事实锚点。
 * phase09-01 先冻结共享领域承接位，具体写入逻辑后续再从旧宿主迁入。
 */
export const contractsDomainBoundary = defineDomainModuleBoundary({
  name: 'contracts',
  description: '承接合同生命周期、续租、退租前置校验与房态联动语义。',
  compatBoundary: {
    strategy: 'compat-wrapper',
    reason:
      'phase09-01 仅冻结新宿主与共享领域承接位，旧 src/app/api/contracts/* 仍需承接存量请求与迁移对照。',
    exitCondition:
      '当合同相关正式入口已迁入 server/routes/*，并由 src/lib/domain/contracts 承接事务边界且通过主链 smoke 后，旧入口降级为薄包装或移除。',
  },
  transactionBoundary: {
    ...PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
    note:
      '合同创建、续租、退租等跨聚合写操作的事务编排统一下沉到 src/lib/domain/contracts，而不是散落在路由层。',
  },
})

type PrismaDbClient = typeof prisma | Prisma.TransactionClient

type LifecycleContractRecord = Prisma.ContractGetPayload<{
  include: {
    room: {
      include: {
        building: true
      }
    }
    renter: true
  }
}>

type CheckoutContractRecord = Prisma.ContractGetPayload<{
  include: {
    room: {
      include: {
        building: true
      }
    }
    renter: true
    bills: true
  }
}>

type ContractFactSnapshotRecord = Prisma.ContractGetPayload<{
  select: {
    id: true
    contractNumber: true
    status: true
    businessStatus: true
    room: {
      select: {
        id: true
        roomNumber: true
        status: true
        currentRenter: true
      }
    }
    renter: {
      select: {
        id: true
        name: true
      }
    }
    bills: {
      select: {
        id: true
        status: true
      }
    }
    meterReadings: {
      select: {
        id: true
        isBilled: true
      }
    }
  }
}>

export const CONTRACT_MAIN_FLOW_KEYS = [
  'NEW_SIGN_CONTRACT',
  'RENEW_CONTRACT',
  'CHECKOUT_SETTLEMENT',
  'METER_READING_BILLING',
] as const

export type ContractMainFlowKey = (typeof CONTRACT_MAIN_FLOW_KEYS)[number]

export interface ContractMainFlowDescriptor {
  key: ContractMainFlowKey
  label: string
  canonicalWriteHost: string
  canonicalQueryHosts: string[]
  compatWrappers: string[]
}

export const CONTRACT_MAIN_FLOW_CONSISTENCY_MATRIX: readonly ContractMainFlowDescriptor[] = [
  {
    key: 'NEW_SIGN_CONTRACT',
    label: '新签合同出账',
    canonicalWriteHost:
      'server/routes/contracts.ts -> prisma.$transaction|generateBillsOnContractSigned|createInitialBaselineReadingsForContractTx',
    canonicalQueryHosts: [
      '合同列表分页 -> server/routes/contracts.ts -> src/lib/optimized-queries.ts',
      '合同详情/SSR 回查 -> server/routes/contracts.ts -> src/lib/queries.ts',
      '提醒窗口配置 -> src/lib/global-settings.ts',
    ],
    compatWrappers: [
      'src/app/api/contracts/route.ts',
      'src/app/api/contracts/[id]/generate-bills/route.ts',
    ],
  },
  {
    key: 'RENEW_CONTRACT',
    label: '续租与补账单',
    canonicalWriteHost: 'server/routes/contracts.ts -> src/lib/domain/contracts',
    canonicalQueryHosts: [
      '合同详情 -> server/routes/contracts.ts -> src/lib/queries.ts',
      '续租响应事实快照 -> server/routes/contracts.ts -> src/lib/domain/contracts',
    ],
    compatWrappers: [
      'src/app/api/contracts/[id]/route.ts',
      'src/app/api/contracts/[id]/renew/route.ts',
    ],
  },
  {
    key: 'CHECKOUT_SETTLEMENT',
    label: '退租结算',
    canonicalWriteHost: 'server/routes/checkout.ts -> src/lib/domain/contracts',
    canonicalQueryHosts: [
      '合同详情 -> server/routes/contracts.ts -> src/lib/queries.ts',
      '退租结算响应事实快照 -> server/routes/checkout.ts -> src/lib/domain/contracts',
      '终抄详情/related bills -> server/routes/meter-readings.ts -> src/lib/domain/meters',
    ],
    compatWrappers: [
      'src/app/api/contracts/[id]/route.ts',
      'src/app/api/contracts/[id]/checkout/route.ts',
    ],
  },
  {
    key: 'METER_READING_BILLING',
    label: '多仪表抄表出账',
    canonicalWriteHost: 'src/lib/domain/meters',
    canonicalQueryHosts: [
      '抄表详情 -> src/lib/domain/meters',
      'related bills compat 宿主 -> src/app/api/meter-readings/[id]/related-bills/route.ts',
    ],
    compatWrappers: ['src/app/api/meter-readings/route.ts'],
  },
] as const

export interface ContractFactSnapshot {
  contractId: string
  contractNumber: string
  contractStatus: string
  businessStatus: string | null
  room: {
    id: string
    roomNumber: string
    status: string
    currentRenter: string | null
  }
  renter: {
    id: string
    name: string
  }
  counts: {
    totalBills: number
    openBills: number
    settledBills: number
    meterReadings: number
    billedMeterReadings: number
  }
}

export interface FlowConsistencyEvidence {
  flow: ContractMainFlowDescriptor
  factSnapshot: ContractFactSnapshot
}

export interface SerializedLifecycleContract {
  id: string
  contractNumber: string
  roomId: string
  renterId: string
  startDate: Date
  endDate: Date
  monthlyRent: number
  totalRent: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  paymentMethod: string | null
  paymentTiming: string | null
  status: string
  businessStatus: string | null
  remarks: string | null
  room: {
    id: string
    roomNumber: string
    status: string
    currentRenter: string | null
    building: {
      id: string
      name: string
    }
  }
  renter: {
    id: string
    name: string
    phone: string | null
  }
}

export interface GenerateContractBillsResult {
  contractId: string
  generationMode: 'GENERATE_BASE' | 'REPAIR_MISSING_RENT'
  generatedBills: GeneratedBaseBillSummary[]
  factSnapshot: ContractFactSnapshot
  consistency: FlowConsistencyEvidence
}

export interface RenewContractInput {
  originalContractId: string
  newStartDate: string | Date
  newEndDate: string | Date
  newMonthlyRent: number
  newDeposit?: number
  newKeyDeposit?: number
  newCleaningFee?: number
  paymentMethod?: string | null
  paymentTiming?: string | null
  signedBy?: string | null
  signedDate?: string | Date | null
  remarks?: string | null
}

export interface RenewContractResult {
  originalContractId: string
  newContract: SerializedLifecycleContract
  billGeneration: {
    success: boolean
    error: string | null
    result: GenerateContractBillsResult | null
  }
  originalFactSnapshot: ContractFactSnapshot
  newContractFactSnapshot: ContractFactSnapshot
  consistency: FlowConsistencyEvidence
}

export interface CheckoutContractInput {
  contractId: string
  checkoutDate: string | Date
  checkoutReason: string
  damageAssessment?: number
  finalMeterReadings?: Record<string, number>
  remarks?: string | null
  settlementItems: CheckoutSettlementSubmissionItem[]
  operator?: string | null
}

export interface CheckoutContractResult {
  contract: SerializedLifecycleContract
  settlement: AppliedCheckoutSettlementResult
  meterProcessing: CheckoutFinalMeterProcessingResult[]
  settlementBillId: string
  oldBills: {
    settledCount: number
    settledAmount: number
    waivedAmount: number
  }
  factSnapshot: ContractFactSnapshot
  consistency: FlowConsistencyEvidence
}

export interface PendingContractActivationResult {
  activated: number
  errors: Array<{ contractId: string; error: string }>
}

export interface ManualContractActivationResult {
  success: boolean
  message: string
}

export interface ContractDomainValidationErrorDetails {
  [key: string]: unknown
}

export class ContractDomainValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: ContractDomainValidationErrorDetails
  ) {
    super(message)
    this.name = 'ContractDomainValidationError'
  }
}

export function isContractDomainValidationError(
  error: unknown
): error is ContractDomainValidationError {
  return error instanceof ContractDomainValidationError
}

function getStartOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function determineContractInitialStatus(startDate: Date) {
  const normalizedStartDate = new Date(startDate)
  normalizedStartDate.setHours(0, 0, 0, 0)
  return normalizedStartDate > getStartOfToday() ? 'PENDING' : 'ACTIVE'
}

function getContractMainFlowDescriptor(key: ContractMainFlowKey) {
  return CONTRACT_MAIN_FLOW_CONSISTENCY_MATRIX.find((item) => item.key === key)!
}

function appendAuditRemark(existingRemark: string | null, auditRemark: string) {
  return [existingRemark?.trim(), auditRemark.trim()].filter(Boolean).join('\n')
}

function appendRemarkBlock(existingRemark: string | null, block: string) {
  return [existingRemark?.trim(), block.trim()].filter(Boolean).join('\n\n')
}

function parseInputDate(
  value: string | Date | null | undefined,
  field: string
): Date | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  const parsedDate = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    throw new ContractDomainValidationError('日期格式不合法', 'CONTRACT_INVALID_DATE', {
      field,
      value,
    })
  }

  return parsedDate
}

function parseRequiredInputDate(value: string | Date, field: string) {
  const parsedDate = parseInputDate(value, field)
  if (!parsedDate) {
    throw new ContractDomainValidationError('缺少必填日期', 'CONTRACT_REQUIRED_DATE', {
      field,
    })
  }

  return parsedDate
}

function calculateContractMonthsDifference(startDate: Date, endDate: Date): number {
  const normalizedStartDate = new Date(startDate)
  const normalizedEndDate = new Date(endDate)
  const timeDiff = normalizedEndDate.getTime() - normalizedStartDate.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1

  if (daysDiff >= 365) {
    const years = Math.floor(daysDiff / 365)
    return years * 12
  }

  if (daysDiff >= 30) {
    return Math.ceil(daysDiff / 30)
  }

  return 1
}

function generateContractNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `CT${year}${month}${String(Date.now()).slice(-6)}`
}

function serializeLifecycleContract(
  contract: LifecycleContractRecord
): SerializedLifecycleContract {
  return {
    id: contract.id,
    contractNumber: contract.contractNumber,
    roomId: contract.roomId,
    renterId: contract.renterId,
    startDate: contract.startDate,
    endDate: contract.endDate,
    monthlyRent: Number(contract.monthlyRent),
    totalRent: Number(contract.totalRent),
    deposit: Number(contract.deposit),
    keyDeposit: contract.keyDeposit !== null ? Number(contract.keyDeposit) : null,
    cleaningFee:
      contract.cleaningFee !== null ? Number(contract.cleaningFee) : null,
    paymentMethod: contract.paymentMethod,
    paymentTiming: contract.paymentTiming,
    status: contract.status,
    businessStatus: contract.businessStatus,
    remarks: contract.remarks,
    room: {
      id: contract.room.id,
      roomNumber: contract.room.roomNumber,
      status: contract.room.status,
      currentRenter: contract.room.currentRenter,
      building: {
        id: contract.room.building.id,
        name: contract.room.building.name,
      },
    },
    renter: {
      id: contract.renter.id,
      name: contract.renter.name,
      phone: contract.renter.phone,
    },
  }
}

function buildCheckoutSettlementBillData(params: {
  contractId: string
  checkoutDate: Date
  operator: string
  settlement: AppliedCheckoutSettlementResult
  metadata: string
}) {
  const billDateKey = params.checkoutDate.toISOString().split('T')[0]
  const settlementAmount = toBillAmount(Math.abs(params.settlement.summary.netAmount))
  const settlementType = params.settlement.summary.settlementType
  const billPrefix =
    settlementType === 'REFUND'
      ? 'RF'
      : settlementType === 'CHARGE'
        ? 'AD'
        : 'BL'

  return {
    billNumber: `${billPrefix}${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    type: 'OTHER' as const,
    amount:
      settlementType === 'REFUND'
        ? -settlementAmount
        : settlementType === 'CHARGE'
          ? settlementAmount
          : 0,
    receivedAmount: settlementType === 'CHARGE' ? settlementAmount : 0,
    pendingAmount: 0,
    dueDate: params.checkoutDate,
    paidDate: params.checkoutDate,
    period: `退租结算-${billDateKey}`,
    status: 'COMPLETED' as const,
    contractId: params.contractId,
    paymentMethod: '退租结算',
    operator: params.operator,
    remarks: `退租结算：${params.settlement.description}`,
    metadata: params.metadata,
  }
}

function buildSettlementAuditMetadata(params: {
  contractId: string
  checkoutDate: Date
  checkoutReason: string
  operator: string
  settlement: AppliedCheckoutSettlementResult
}) {
  return JSON.stringify({
    source: 'checkout-settlement',
    contractId: params.contractId,
    checkoutDate: params.checkoutDate.toISOString(),
    checkoutReason: params.checkoutReason,
    operator: params.operator,
    generatedAt: new Date().toISOString(),
    summary: params.settlement.summary,
    items: params.settlement.submissionItems.map((item) => ({
      id: item.id,
      name: item.name,
      sourceType: item.sourceType,
      direction: item.direction,
      billId: item.billId ?? null,
      originalAmount: item.originalAmount,
      adjustedAmount: item.adjustedAmount,
      adjustmentReason: item.adjustmentReason || null,
    })),
  })
}

async function getLifecycleContractById(
  db: PrismaDbClient,
  contractId: string
): Promise<LifecycleContractRecord | null> {
  return db.contract.findUnique({
    where: { id: contractId },
    include: {
      room: {
        include: {
          building: true,
        },
      },
      renter: true,
    },
  })
}

async function getContractFactSnapshotRecord(
  db: PrismaDbClient,
  contractId: string
): Promise<ContractFactSnapshotRecord | null> {
  return db.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      contractNumber: true,
      status: true,
      businessStatus: true,
      room: {
        select: {
          id: true,
          roomNumber: true,
          status: true,
          currentRenter: true,
        },
      },
      renter: {
        select: {
          id: true,
          name: true,
        },
      },
      bills: {
        select: {
          id: true,
          status: true,
        },
      },
      meterReadings: {
        select: {
          id: true,
          isBilled: true,
        },
      },
    },
  })
}

function buildContractFactSnapshot(
  record: ContractFactSnapshotRecord
): ContractFactSnapshot {
  const openBills = record.bills.filter((bill) =>
    OPEN_BILL_STATUSES.includes(bill.status)
  ).length

  return {
    contractId: record.id,
    contractNumber: record.contractNumber,
    contractStatus: record.status,
    businessStatus: record.businessStatus,
    room: {
      id: record.room.id,
      roomNumber: record.room.roomNumber,
      status: record.room.status,
      currentRenter: record.room.currentRenter,
    },
    renter: {
      id: record.renter.id,
      name: record.renter.name,
    },
    counts: {
      totalBills: record.bills.length,
      openBills,
      settledBills: record.bills.length - openBills,
      meterReadings: record.meterReadings.length,
      billedMeterReadings: record.meterReadings.filter((item) => item.isBilled)
        .length,
    },
  }
}

function buildFlowConsistencyEvidence(
  flowKey: ContractMainFlowKey,
  factSnapshot: ContractFactSnapshot
): FlowConsistencyEvidence {
  return {
    flow: getContractMainFlowDescriptor(flowKey),
    factSnapshot,
  }
}

async function activateContract(contractId: string) {
  return runInMainChainWriteTransaction(async (tx) => {
    const contract = await tx.contract.findUnique({
      where: { id: contractId },
      include: { room: true, renter: true },
    })

    if (!contract) {
      throw new Error(`合同不存在: ${contractId}`)
    }

    if (contract.status !== 'PENDING') {
      throw new Error(`合同状态不是PENDING: ${contract.status}`)
    }

    if (contract.room.status !== 'VACANT') {
      throw new Error(`房间不可用，当前状态: ${contract.room.status}`)
    }

    await tx.contract.update({
      where: { id: contractId },
      data: { status: 'ACTIVE' },
    })

    await tx.room.update({
      where: { id: contract.roomId },
      data: {
        status: 'OCCUPIED',
        currentRenter: contract.renter.name,
      },
    })

    return {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      roomId: contract.roomId,
      renterId: contract.renterId,
    }
  })
}

export async function getContractFactSnapshot(
  contractId: string
): Promise<ContractFactSnapshot> {
  const contract = await getContractFactSnapshotRecord(prisma, contractId)

  if (!contract) {
    throw new Error('Contract not found')
  }

  return buildContractFactSnapshot(contract)
}

export async function generateContractBills(
  contractId: string,
  options: {
    mode?: 'auto' | 'base' | 'repair'
  } = {}
): Promise<GenerateContractBillsResult> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      bills: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!contract) {
    throw new Error('Contract not found')
  }

  const generationMode =
    options.mode === 'base'
      ? 'GENERATE_BASE'
      : options.mode === 'repair'
        ? 'REPAIR_MISSING_RENT'
        : contract.bills.length === 0
          ? 'GENERATE_BASE'
          : 'REPAIR_MISSING_RENT'

  const generatedBills =
    generationMode === 'GENERATE_BASE'
      ? await generateBaseBillsForContract(contractId)
      : await repairMissingRentBillsForContract(contractId)
  const factSnapshot = await getContractFactSnapshot(contractId)

  return {
    contractId,
    generationMode,
    generatedBills,
    factSnapshot,
    consistency: buildFlowConsistencyEvidence('NEW_SIGN_CONTRACT', factSnapshot),
  }
}

export async function renewContract(
  input: RenewContractInput
): Promise<RenewContractResult> {
  const startDate = parseRequiredInputDate(input.newStartDate, 'newStartDate')
  const endDate = parseRequiredInputDate(input.newEndDate, 'newEndDate')
  const monthlyRent = Number(input.newMonthlyRent)

  if (endDate <= startDate) {
    throw new ContractDomainValidationError(
      '结束日期必须晚于开始日期',
      'CONTRACT_RENEW_END_BEFORE_START'
    )
  }

  if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
    throw new ContractDomainValidationError(
      '租金必须大于 0',
      'CONTRACT_RENEW_MONTHLY_RENT_INVALID',
      {
        newMonthlyRent: input.newMonthlyRent,
      }
    )
  }

  const transactionResult = await runInMainChainWriteTransaction(async (tx) => {
    const originalContract = await tx.contract.findUnique({
      where: { id: input.originalContractId },
      include: {
        room: {
          include: {
            building: true,
          },
        },
        renter: true,
        bills: true,
      },
    })

    if (!originalContract) {
      throw new Error('Contract not found')
    }

    if (!['ACTIVE', 'EXPIRED'].includes(originalContract.status)) {
      throw new ContractDomainValidationError(
        `合同状态不允许续租，当前状态：${originalContract.status}`,
        'CONTRACT_RENEW_STATUS_INVALID',
        {
          contractId: input.originalContractId,
          currentStatus: originalContract.status,
        }
      )
    }

    if (originalContract.room.status !== 'OCCUPIED') {
      throw new ContractDomainValidationError(
        `房间状态异常，当前状态：${originalContract.room.status}`,
        'CONTRACT_RENEW_ROOM_STATUS_INVALID',
        {
          roomId: originalContract.roomId,
          roomStatus: originalContract.room.status,
        }
      )
    }

    const unpaidBills = originalContract.bills.filter((bill) =>
      OPEN_BILL_STATUSES.includes(bill.status)
    )

    if (unpaidBills.length > 0) {
      throw new ContractDomainValidationError(
        `存在${unpaidBills.length}个未结清账单，请先处理完毕再续租`,
        'CONTRACT_RENEW_HAS_OPEN_BILLS',
        {
          contractId: input.originalContractId,
          openBillIds: unpaidBills.map((bill) => bill.id),
          openBillCount: unpaidBills.length,
        }
      )
    }

    const contractNumber = generateContractNumber()
    const monthsDiff = calculateContractMonthsDifference(startDate, endDate)
    const totalRent = monthlyRent * monthsDiff
    const nextStatus = determineContractInitialStatus(startDate)
    const signedDate = parseInputDate(input.signedDate, 'signedDate') ?? new Date()

    const newContract = await tx.contract.create({
      data: {
        contractNumber,
        roomId: originalContract.roomId,
        renterId: originalContract.renterId,
        startDate,
        endDate,
        monthlyRent,
        totalRent,
        deposit:
          input.newDeposit !== undefined
            ? input.newDeposit
            : Number(originalContract.deposit),
        keyDeposit:
          input.newKeyDeposit !== undefined
            ? input.newKeyDeposit
            : originalContract.keyDeposit,
        cleaningFee:
          input.newCleaningFee !== undefined
            ? input.newCleaningFee
            : originalContract.cleaningFee,
        paymentMethod:
          input.paymentMethod !== undefined
            ? input.paymentMethod || null
            : originalContract.paymentMethod,
        paymentTiming:
          input.paymentTiming !== undefined
            ? input.paymentTiming || null
            : originalContract.paymentTiming,
        signedBy:
          input.signedBy !== undefined
            ? input.signedBy || null
            : originalContract.signedBy,
        signedDate,
        remarks: input.remarks
          ? `续租自合同${originalContract.contractNumber}。${input.remarks}`
          : `续租自合同${originalContract.contractNumber}`,
        status: nextStatus,
      },
      include: {
        room: {
          include: {
            building: true,
          },
        },
        renter: true,
      },
    })

    await tx.contract.update({
      where: { id: input.originalContractId },
      data: {
        status: 'EXPIRED',
        isExtended: true,
        updatedAt: new Date(),
        remarks: appendRemarkBlock(
          originalContract.remarks,
          `[续租记录 ${new Date().toISOString().split('T')[0]}]\n续租至合同: ${newContract.contractNumber}`
        ),
      },
    })

    await tx.room.update({
      where: { id: originalContract.roomId },
      data: {
        status: 'OCCUPIED',
        currentRenter: originalContract.renter.name,
        updatedAt: new Date(),
      },
    })

    return {
      newContract,
    }
  })

  let billGenerationResult: GenerateContractBillsResult | null = null
  let billGenerationError: string | null = null

  try {
    billGenerationResult = await generateContractBills(
      transactionResult.newContract.id,
      {
        mode: 'auto',
      }
    )
  } catch (error) {
    billGenerationError =
      error instanceof Error ? error.message : '续租后的补账单生成失败'
  }

  const originalFactSnapshot = await getContractFactSnapshot(input.originalContractId)
  const newContractFactSnapshot =
    billGenerationResult?.factSnapshot ??
    (await getContractFactSnapshot(transactionResult.newContract.id))

  return {
    originalContractId: input.originalContractId,
    newContract: serializeLifecycleContract(transactionResult.newContract),
    billGeneration: {
      success: billGenerationError === null,
      error: billGenerationError,
      result: billGenerationResult,
    },
    originalFactSnapshot,
    newContractFactSnapshot,
    consistency: buildFlowConsistencyEvidence(
      'RENEW_CONTRACT',
      newContractFactSnapshot
    ),
  }
}

export async function checkoutContract(
  input: CheckoutContractInput
): Promise<CheckoutContractResult> {
  const checkoutDate = parseRequiredInputDate(input.checkoutDate, 'checkoutDate')
  const checkoutReason = input.checkoutReason?.trim()
  const settlementItems = input.settlementItems
  const damageAssessment = Number(input.damageAssessment ?? 0)
  const operator = input.operator?.trim() || '管理员'
  const finalMeterReadings = input.finalMeterReadings ?? {}

  if (!checkoutReason) {
    throw new ContractDomainValidationError(
      '退租原因不能为空',
      'CONTRACT_CHECKOUT_REASON_REQUIRED'
    )
  }

  if (!Array.isArray(settlementItems) || settlementItems.length === 0) {
    throw new ContractDomainValidationError(
      '缺少正式结算明细，请刷新页面后重试',
      'CONTRACT_CHECKOUT_SETTLEMENT_ITEMS_REQUIRED'
    )
  }

  if (!Number.isFinite(damageAssessment) || damageAssessment < 0) {
    throw new ContractDomainValidationError(
      '损坏赔偿金额不能为负数',
      'CONTRACT_CHECKOUT_DAMAGE_ASSESSMENT_INVALID',
      {
        damageAssessment: input.damageAssessment,
      }
    )
  }

  if (checkoutDate < getStartOfToday()) {
    throw new ContractDomainValidationError(
      '退租日期不能早于当前日期',
      'CONTRACT_CHECKOUT_DATE_BEFORE_TODAY'
    )
  }

  const transactionResult = await runInMainChainWriteTransaction(async (tx) => {
    const contract = (await tx.contract.findUnique({
      where: { id: input.contractId },
      include: {
        room: {
          include: {
            building: true,
          },
        },
        renter: true,
        bills: {
          where: {
            status: { in: OPEN_BILL_STATUSES },
          },
        },
      },
    })) as CheckoutContractRecord | null

    if (!contract) {
      throw new Error('Contract not found')
    }

    if (contract.status !== 'ACTIVE') {
      throw new ContractDomainValidationError(
        `合同状态不允许退租，当前状态：${contract.status}`,
        'CONTRACT_CHECKOUT_STATUS_INVALID',
        {
          contractId: input.contractId,
          currentStatus: contract.status,
        }
      )
    }

    if (checkoutDate > contract.endDate) {
      throw new ContractDomainValidationError(
        '退租日期不能晚于合同结束日期',
        'CONTRACT_CHECKOUT_DATE_AFTER_END_DATE',
        {
          contractId: input.contractId,
          checkoutDate,
          contractEndDate: contract.endDate,
        }
      )
    }

    const settlementResult = calculateCheckoutSettlement(contract, {
      checkoutDate,
      damageAssessment,
    })
    const finalSettlement = applyCheckoutSettlementSubmission(
      settlementResult,
      settlementItems,
      {
        requireReasonForAdjusted: true,
      }
    )
    const contractBillMap = new Map(contract.bills.map((bill) => [bill.id, bill]))

    for (const item of finalSettlement.submissionItems) {
      if (item.sourceType !== 'OPEN_BILL' || !item.billId) {
        continue
      }

      const relatedBill = contractBillMap.get(item.billId)
      if (!relatedBill) {
        throw new ContractDomainValidationError(
          `结算项 ${item.name} 对应的账单不存在或已变化`,
          'CONTRACT_CHECKOUT_BILL_CHANGED',
          {
            billId: item.billId,
            contractId: input.contractId,
          }
        )
      }

      const currentPendingAmount = toBillAmount(relatedBill.pendingAmount)
      const currentReceivedAmount = toBillAmount(relatedBill.receivedAmount)
      const currentAmount = toBillAmount(relatedBill.amount)

      if (item.adjustedAmount < -BILL_AMOUNT_EPSILON) {
        throw new ContractDomainValidationError(
          `${item.name} 的结算金额不能小于 0`,
          'CONTRACT_CHECKOUT_BILL_SETTLEMENT_NEGATIVE',
          {
            billId: item.billId,
          }
        )
      }

      if (item.adjustedAmount - currentPendingAmount > BILL_AMOUNT_EPSILON) {
        throw new ContractDomainValidationError(
          `${item.name} 的结算金额不能超过当前待收 ${currentPendingAmount.toFixed(2)}`,
          'CONTRACT_CHECKOUT_BILL_SETTLEMENT_EXCEEDS_PENDING',
          {
            billId: item.billId,
            pendingAmount: currentPendingAmount,
            adjustedAmount: item.adjustedAmount,
          }
        )
      }

      const projectedReceivedAmount = toBillAmount(
        currentReceivedAmount + item.adjustedAmount
      )

      if (projectedReceivedAmount - currentAmount > BILL_AMOUNT_EPSILON) {
        throw new ContractDomainValidationError(
          `${item.name} 的结算结果会覆盖既有已收事实，已被阻止`,
          'CONTRACT_CHECKOUT_BILL_RECEIVED_AMOUNT_INVALID',
          {
            billId: item.billId,
            currentAmount,
            projectedReceivedAmount,
          }
        )
      }
    }

    const settlementAuditMetadata = buildSettlementAuditMetadata({
      contractId: input.contractId,
      checkoutDate,
      checkoutReason,
      operator,
      settlement: finalSettlement,
    })

    const settlementBill = await tx.bill.create({
      data: buildCheckoutSettlementBillData({
        contractId: input.contractId,
        checkoutDate,
        operator,
        settlement: finalSettlement,
        metadata: settlementAuditMetadata,
      }),
    })

    const unpaidBills = await tx.bill.findMany({
      where: {
        contractId: input.contractId,
        status: { in: OPEN_BILL_STATUSES },
      },
    })

    let settledOldBillCount = 0
    let settledOldBillAmount = 0
    let waivedOldBillAmount = 0

    for (const bill of unpaidBills) {
      const settlementItem = finalSettlement.submissionItems.find(
        (item) => item.sourceType === 'OPEN_BILL' && item.billId === bill.id
      )

      if (!settlementItem) {
        throw new ContractDomainValidationError(
          `旧账单 ${bill.billNumber} 未进入正式退租结算明细，请刷新页面后重试`,
          'CONTRACT_CHECKOUT_OPEN_BILL_MISSING_FROM_SETTLEMENT',
          {
            billId: bill.id,
            billNumber: bill.billNumber,
          }
        )
      }

      const currentPendingAmount = toBillAmount(bill.pendingAmount)
      const currentReceivedAmount = toBillAmount(bill.receivedAmount)
      const { settledAmount } = buildCheckoutBillStatusAfterSettlement({
        currentStatus: bill.status,
        originalPendingAmount: currentPendingAmount,
        settledAmount: settlementItem.adjustedAmount,
      })
      const waivedAmount = toBillAmount(currentPendingAmount - settledAmount)
      const nextReceivedAmount = toBillAmount(currentReceivedAmount + settledAmount)
      const auditRemark = [
        `[退租结算 ${checkoutDate.toISOString().split('T')[0]}]`,
        `原待收: ${currentPendingAmount.toFixed(2)}`,
        `本次纳入: ${settledAmount.toFixed(2)}`,
        `退租减免: ${waivedAmount.toFixed(2)}`,
        '剩余待收: 0.00',
        `既有已收: ${currentReceivedAmount.toFixed(2)}`,
        `退租后已收: ${nextReceivedAmount.toFixed(2)}`,
        `经办人: ${operator}`,
        settlementItem.adjustmentReason
          ? `调整原因: ${settlementItem.adjustmentReason}`
          : waivedAmount > BILL_AMOUNT_EPSILON
            ? '调整原因: 退租结算按最终协商金额收口，剩余部分已减免'
            : '调整原因: 按系统原始待收纳入退租结算',
      ].join(' | ')

      await tx.bill.update({
        where: { id: bill.id },
        data: {
          status: 'COMPLETED',
          receivedAmount: nextReceivedAmount,
          pendingAmount: 0,
          paidDate: checkoutDate,
          paymentMethod: '退租结算',
          operator,
          remarks: appendAuditRemark(bill.remarks, auditRemark),
        },
      })

      settledOldBillCount += 1
      settledOldBillAmount = toBillAmount(settledOldBillAmount + settledAmount)
      waivedOldBillAmount = toBillAmount(waivedOldBillAmount + waivedAmount)
    }

    await tx.contract.update({
      where: { id: input.contractId },
      data: {
        status: 'TERMINATED',
        businessStatus: 'CHECKED_OUT',
        updatedAt: new Date(),
        remarks: appendRemarkBlock(
          contract.remarks,
          input.remarks
            ? `[退租记录 ${checkoutDate.toISOString().split('T')[0]}]\n退租原因: ${checkoutReason}\n${input.remarks}`
            : `[退租记录 ${checkoutDate.toISOString().split('T')[0]}]\n退租原因: ${checkoutReason}`
        ),
      },
    })

    await tx.room.update({
      where: { id: contract.roomId },
      data: {
        status: 'VACANT',
        currentRenter: null,
        overdueDays: null,
        updatedAt: new Date(),
      },
    })

    const meterProcessing = await createCheckoutFinalReadingsTx(tx, {
      contractId: input.contractId,
      roomId: contract.roomId,
      checkoutDate,
      finalMeterReadings,
    })

    await tx.renter.update({
      where: { id: contract.renterId },
      data: {
        updatedAt: new Date(),
        remarks: appendRemarkBlock(
          contract.renter.remarks,
          `[退租记录 ${checkoutDate.toISOString().split('T')[0]}] 合同${contract.contractNumber}正常退租`
        ),
      },
    })

    const finalContract = await getLifecycleContractById(tx, input.contractId)
    if (!finalContract) {
      throw new Error('Contract not found')
    }

    return {
      contract: finalContract,
      settlement: finalSettlement,
      meterProcessing,
      settlementBillId: settlementBill.id,
      oldBills: {
        settledCount: settledOldBillCount,
        settledAmount: settledOldBillAmount,
        waivedAmount: waivedOldBillAmount,
      },
    }
  })

  const factSnapshot = await getContractFactSnapshot(input.contractId)

  return {
    contract: serializeLifecycleContract(transactionResult.contract),
    settlement: transactionResult.settlement,
    meterProcessing: transactionResult.meterProcessing,
    settlementBillId: transactionResult.settlementBillId,
    oldBills: transactionResult.oldBills,
    factSnapshot,
    consistency: buildFlowConsistencyEvidence(
      'CHECKOUT_SETTLEMENT',
      factSnapshot
    ),
  }
}

export const contractLifecycleService = {
  async activatePendingContracts(): Promise<PendingContractActivationResult> {
    const pendingContracts = await prisma.contract.findMany({
      where: {
        status: 'PENDING',
        startDate: {
          lte: getStartOfToday(),
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    const result: PendingContractActivationResult = {
      activated: 0,
      errors: [],
    }

    for (const contract of pendingContracts) {
      try {
        await activateContract(contract.id)
        result.activated += 1
      } catch (error) {
        result.errors.push({
          contractId: contract.id,
          error: error instanceof Error ? error.message : '未知错误',
        })
      }
    }

    return result
  },

  async manualActivateContract(
    contractId: string
  ): Promise<ManualContractActivationResult> {
    try {
      await activateContract(contractId)
      return {
        success: true,
        message: '合同激活成功',
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '激活失败',
      }
    }
  },
}

export const contractDomainService = {
  activatePendingContracts: contractLifecycleService.activatePendingContracts,
  manualActivateContract: contractLifecycleService.manualActivateContract,
  generateContractBills,
  renewContract,
  checkoutContract,
  getContractFactSnapshot,
}
