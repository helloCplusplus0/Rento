import { prisma } from './prisma'
import {
  buildContractRentBillPlan,
  formatContractPaymentCycle,
  normalizeContractPaymentCycle,
} from './contract-payment-cycle'

const RENT_BILL_MANUAL_UPDATE_THRESHOLD_MS = 5_000

type DecimalLike = number | string | { toNumber(): number }

export type RentBillMismatchReason =
  | 'THEORETICAL_COUNT_MISMATCH'
  | 'THEORETICAL_AMOUNT_MISMATCH'
  | 'THEORETICAL_DUE_DATE_MISMATCH'
  | 'THEORETICAL_PERIOD_MISMATCH'
  | 'PLAN_BUILD_FAILED'

export type RentBillAutoFixBlockReason =
  | 'NO_EXISTING_RENT_BILLS'
  | 'HAS_NON_PENDING_STATUS'
  | 'HAS_RECEIVED_AMOUNT'
  | 'HAS_PENDING_AMOUNT_DRIFT'
  | 'HAS_PAID_DATE'
  | 'HAS_METER_READING_LINK'
  | 'HAS_BILL_DETAIL_HISTORY'
  | 'HAS_MANUAL_UPDATE_TRACE'
  | 'HAS_NON_SYSTEM_OPERATOR'
  | 'PLAN_BUILD_FAILED'

interface CandidateRentBill {
  id: string
  amount: DecimalLike
  receivedAmount: DecimalLike
  pendingAmount: DecimalLike
  dueDate: Date
  period: string | null
  status: string
  paidDate: Date | null
  paymentMethod: string | null
  operator: string | null
  remarks: string | null
  meterReadingId: string | null
  createdAt: Date
  updatedAt: Date
  billDetails: Array<{ id: string }>
}

interface CandidateContract {
  id: string
  contractNumber: string
  paymentMethod: string | null
  startDate: Date
  endDate: Date
  monthlyRent: DecimalLike
  bills: CandidateRentBill[]
}

export interface HistoricalRentBillAuditResult {
  contractId: string
  contractNumber: string
  paymentMethod: string | null
  normalizedPaymentCycle: string
  paymentCycleLabel: string
  theoreticalRentBillCount: number
  theoreticalRentAmountPerPeriod: number
  theoreticalPeriods: Array<{
    dueDate: string
    period: string
  }>
  actualRentBillCount: number
  actualBillStatuses: string[]
  mismatchReasons: RentBillMismatchReason[]
  autoFixBlockedReasons: RentBillAutoFixBlockReason[]
  manualTouchedBillIds: string[]
  safeToAutoFix: boolean
  manualHandlingStrategy: string
  existingRentBillIds: string[]
}

export interface HistoricalRentBillRepairSummary {
  totalAuditedContracts: number
  totalFlaggedContracts: number
  autoFixableContracts: number
  auditOnlyContracts: number
  results: HistoricalRentBillAuditResult[]
}

export interface HistoricalRentBillApplySummary {
  auditedContracts: number
  fixableContracts: number
  repairedContracts: number
  repairedBills: number
  skippedContracts: Array<{
    contractNumber: string
    reason: string
  }>
  results: HistoricalRentBillAuditResult[]
}

interface AuditFilters {
  contractNumbers?: string[]
}

function toMoneyNumber(value: DecimalLike): number {
  const numericValue =
    typeof value === 'object' && value !== null && 'toNumber' in value
      ? value.toNumber()
      : Number(value)

  if (!Number.isFinite(numericValue)) {
    throw new Error(`无效金额值: ${String(value)}`)
  }

  return Math.round(numericValue * 100) / 100
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function isSameMoney(left: DecimalLike, right: DecimalLike): boolean {
  return Math.abs(toMoneyNumber(left) - toMoneyNumber(right)) < 0.01
}

function hasManualUpdateTrace(bill: CandidateRentBill): boolean {
  return bill.updatedAt.getTime() - bill.createdAt.getTime() > RENT_BILL_MANUAL_UPDATE_THRESHOLD_MS
}

function hasNonSystemOperator(bill: CandidateRentBill): boolean {
  return Boolean(bill.operator && bill.operator !== 'SYSTEM')
}

function buildManualHandlingStrategy(
  autoFixBlockedReasons: RentBillAutoFixBlockReason[]
): string {
  if (autoFixBlockedReasons.length === 0) {
    return '默认只读；确认后可通过 --apply 在安全边界内删除并重建该合同全部错误 RENT 账单。'
  }

  if (
    autoFixBlockedReasons.includes('HAS_NON_PENDING_STATUS') ||
    autoFixBlockedReasons.includes('HAS_RECEIVED_AMOUNT') ||
    autoFixBlockedReasons.includes('HAS_PAID_DATE')
  ) {
    return '仅输出审计清单；该合同存在已进入账务流程的 RENT 账单，需人工核对收款与账期后处理。'
  }

  if (
    autoFixBlockedReasons.includes('HAS_MANUAL_UPDATE_TRACE') ||
    autoFixBlockedReasons.includes('HAS_NON_SYSTEM_OPERATOR')
  ) {
    return '仅输出审计清单；检测到人工修改痕迹，需先人工确认备注、经办人与账期语义。'
  }

  return '仅输出审计清单；当前合同超出 fix_001 自动修复边界，应改走人工复核或专用修复流程。'
}

async function loadCandidateContracts(
  filters: AuditFilters = {}
): Promise<CandidateContract[]> {
  return prisma.contract.findMany({
    where: {
      paymentMethod: {
        not: null,
      },
      ...(filters.contractNumbers?.length
        ? {
            contractNumber: {
              in: filters.contractNumbers,
            },
          }
        : {}),
    },
    orderBy: {
      contractNumber: 'asc',
    },
    select: {
      id: true,
      contractNumber: true,
      paymentMethod: true,
      startDate: true,
      endDate: true,
      monthlyRent: true,
      bills: {
        where: {
          type: 'RENT',
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          amount: true,
          receivedAmount: true,
          pendingAmount: true,
          dueDate: true,
          period: true,
          status: true,
          paidDate: true,
          paymentMethod: true,
          operator: true,
          remarks: true,
          meterReadingId: true,
          createdAt: true,
          updatedAt: true,
          billDetails: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })
}

function evaluateHistoricalRentBills(
  contract: CandidateContract
): HistoricalRentBillAuditResult | null {
  const normalizedPaymentCycle = normalizeContractPaymentCycle(contract.paymentMethod)
  if (normalizedPaymentCycle === 'MONTHLY') {
    return null
  }

  const paymentCycleLabel = formatContractPaymentCycle(normalizedPaymentCycle)
  const existingBills = contract.bills
  const actualBillStatuses = Array.from(new Set(existingBills.map((bill) => bill.status)))
  const existingRentBillIds = existingBills.map((bill) => bill.id)
  const manualTouchedBillIds = existingBills
    .filter((bill) => hasManualUpdateTrace(bill) || hasNonSystemOperator(bill))
    .map((bill) => bill.id)

  try {
    const plan = buildContractRentBillPlan(
      contract.startDate,
      contract.endDate,
      contract.monthlyRent,
      contract.paymentMethod
    )

    const mismatchReasons: RentBillMismatchReason[] = []

    if (existingBills.length !== plan.periods.length) {
      mismatchReasons.push('THEORETICAL_COUNT_MISMATCH')
    }

    if (
      existingBills.some(
        (bill) => !isSameMoney(bill.amount, plan.rentAmountPerPeriod)
      )
    ) {
      mismatchReasons.push('THEORETICAL_AMOUNT_MISMATCH')
    }

    if (
      existingBills.length === plan.periods.length &&
      existingBills.some(
        (bill, index) =>
          formatDateKey(bill.dueDate) !== formatDateKey(plan.periods[index].dueDate)
      )
    ) {
      mismatchReasons.push('THEORETICAL_DUE_DATE_MISMATCH')
    }

    if (
      existingBills.length === plan.periods.length &&
      existingBills.some(
        (bill, index) => (bill.period ?? '') !== plan.periods[index].periodLabel
      )
    ) {
      mismatchReasons.push('THEORETICAL_PERIOD_MISMATCH')
    }

    if (mismatchReasons.length === 0) {
      return null
    }

    const autoFixBlockedReasons: RentBillAutoFixBlockReason[] = []

    if (existingBills.length === 0) {
      autoFixBlockedReasons.push('NO_EXISTING_RENT_BILLS')
    }

    if (!existingBills.every((bill) => bill.status === 'PENDING')) {
      autoFixBlockedReasons.push('HAS_NON_PENDING_STATUS')
    }

    if (!existingBills.every((bill) => isSameMoney(bill.receivedAmount, 0))) {
      autoFixBlockedReasons.push('HAS_RECEIVED_AMOUNT')
    }

    if (
      !existingBills.every((bill) => isSameMoney(bill.pendingAmount, bill.amount))
    ) {
      autoFixBlockedReasons.push('HAS_PENDING_AMOUNT_DRIFT')
    }

    if (existingBills.some((bill) => bill.paidDate !== null)) {
      autoFixBlockedReasons.push('HAS_PAID_DATE')
    }

    if (existingBills.some((bill) => bill.meterReadingId !== null)) {
      autoFixBlockedReasons.push('HAS_METER_READING_LINK')
    }

    if (existingBills.some((bill) => bill.billDetails.length > 0)) {
      autoFixBlockedReasons.push('HAS_BILL_DETAIL_HISTORY')
    }

    if (existingBills.some((bill) => hasManualUpdateTrace(bill))) {
      autoFixBlockedReasons.push('HAS_MANUAL_UPDATE_TRACE')
    }

    if (existingBills.some((bill) => hasNonSystemOperator(bill))) {
      autoFixBlockedReasons.push('HAS_NON_SYSTEM_OPERATOR')
    }

    return {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      paymentMethod: contract.paymentMethod,
      normalizedPaymentCycle,
      paymentCycleLabel,
      theoreticalRentBillCount: plan.periods.length,
      theoreticalRentAmountPerPeriod: plan.rentAmountPerPeriod,
      theoreticalPeriods: plan.periods.map((period) => ({
        dueDate: formatDateKey(period.dueDate),
        period: period.periodLabel,
      })),
      actualRentBillCount: existingBills.length,
      actualBillStatuses,
      mismatchReasons,
      autoFixBlockedReasons,
      manualTouchedBillIds,
      safeToAutoFix: autoFixBlockedReasons.length === 0,
      manualHandlingStrategy: buildManualHandlingStrategy(autoFixBlockedReasons),
      existingRentBillIds,
    }
  } catch {
    return {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      paymentMethod: contract.paymentMethod,
      normalizedPaymentCycle,
      paymentCycleLabel,
      theoreticalRentBillCount: 0,
      theoreticalRentAmountPerPeriod: 0,
      theoreticalPeriods: [],
      actualRentBillCount: existingBills.length,
      actualBillStatuses,
      mismatchReasons: ['PLAN_BUILD_FAILED'],
      autoFixBlockedReasons: ['PLAN_BUILD_FAILED'],
      manualTouchedBillIds,
      safeToAutoFix: false,
      manualHandlingStrategy:
        '仅输出审计清单；该合同无法可靠推导理论账期，请先人工确认合同起止日期与支付周期。',
      existingRentBillIds,
    }
  }
}

function generateRepairBillNumber(
  contractNumber: string,
  timestampSeed: string,
  index: number
): string {
  const suffix = contractNumber.slice(-3)
  const sequence = String(index + 1).padStart(2, '0')
  return `BILL${suffix}R${timestampSeed}${sequence}`
}

export async function auditHistoricalRentBillRepairs(
  filters: AuditFilters = {}
): Promise<HistoricalRentBillRepairSummary> {
  const contracts = await loadCandidateContracts(filters)
  const results = contracts
    .map((contract) => evaluateHistoricalRentBills(contract))
    .filter((result): result is HistoricalRentBillAuditResult => result !== null)

  return {
    totalAuditedContracts: contracts.length,
    totalFlaggedContracts: results.length,
    autoFixableContracts: results.filter((result) => result.safeToAutoFix).length,
    auditOnlyContracts: results.filter((result) => !result.safeToAutoFix).length,
    results,
  }
}

export async function applySafeHistoricalRentBillRepairs(
  filters: AuditFilters = {}
): Promise<HistoricalRentBillApplySummary> {
  const auditSummary = await auditHistoricalRentBillRepairs(filters)
  const fixableContracts = auditSummary.results.filter((result) => result.safeToAutoFix)
  let repairedContracts = 0
  let repairedBills = 0
  const skippedContracts: Array<{ contractNumber: string; reason: string }> = []

  for (const result of fixableContracts) {
    try {
      await prisma.$transaction(async (tx) => {
        const contract = await tx.contract.findUnique({
          where: {
            id: result.contractId,
          },
          select: {
            id: true,
            contractNumber: true,
            paymentMethod: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            bills: {
              where: {
                type: 'RENT',
              },
              orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
              select: {
                id: true,
                amount: true,
                receivedAmount: true,
                pendingAmount: true,
                dueDate: true,
                period: true,
                status: true,
                paidDate: true,
                paymentMethod: true,
                operator: true,
                remarks: true,
                meterReadingId: true,
                createdAt: true,
                updatedAt: true,
                billDetails: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        })

        if (!contract) {
          throw new Error('合同不存在')
        }

        // 应用前在事务内再次审计，避免 dry-run 与真实写入之间状态漂移。
        const latestAudit = evaluateHistoricalRentBills(contract)
        if (!latestAudit || !latestAudit.safeToAutoFix) {
          throw new Error('合同已超出安全自动修复边界')
        }

        const plan = buildContractRentBillPlan(
          contract.startDate,
          contract.endDate,
          contract.monthlyRent,
          contract.paymentMethod
        )
        const timestampSeed = `${Date.now().toString().slice(-4)}${String(
          plan.periods.length
        ).padStart(2, '0')}`

        const deleteResult = await tx.bill.deleteMany({
          where: {
            id: {
              in: latestAudit.existingRentBillIds,
            },
          },
        })

        if (deleteResult.count !== latestAudit.existingRentBillIds.length) {
          throw new Error('删除历史 RENT 账单数量与审计结果不一致')
        }

        for (const [index, period] of plan.periods.entries()) {
          const amount = plan.rentAmountPerPeriod

          await tx.bill.create({
            data: {
              billNumber: generateRepairBillNumber(
                contract.contractNumber,
                timestampSeed,
                index
              ),
              type: 'RENT',
              amount,
              receivedAmount: 0,
              pendingAmount: amount,
              dueDate: period.dueDate,
              period: period.periodLabel,
              status: 'PENDING',
              contractId: contract.id,
              paymentMethod: contract.paymentMethod || '待确定',
              operator: 'SYSTEM',
              remarks: `${plan.paymentCycleLabel}租金 - 合同${contract.contractNumber} - fix_001历史修复`,
              metadata: JSON.stringify({
                repairKey: 'fix_001_contract_payment_cycle',
                repairMode: 'SAFE_PENDING_ONLY',
                replacedBillIds: latestAudit.existingRentBillIds,
                repairedAt: new Date().toISOString(),
                normalizedPaymentCycle: plan.paymentCycle,
                theoreticalRentBillCount: plan.periods.length,
                theoreticalRentAmountPerPeriod: amount,
              }),
            },
          })
        }

        repairedContracts += 1
        repairedBills += plan.periods.length
      })
    } catch (error) {
      skippedContracts.push({
        contractNumber: result.contractNumber,
        reason: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  return {
    auditedContracts: auditSummary.totalAuditedContracts,
    fixableContracts: fixableContracts.length,
    repairedContracts,
    repairedBills,
    skippedContracts,
    results: auditSummary.results,
  }
}
