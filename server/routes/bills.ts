import { billingDomainBoundary } from '@/lib/domain'
import { advancedBillStats, parseDateRange } from '@/lib/bill-stats'
import {
  billingDomainService,
  isBillDeleteGuardBlockedError,
  isBillingDomainValidationError,
} from '@/lib/domain/billing'
import { billQueryCache } from '@/lib/bill-cache'
import { optimizedBillQueries } from '@/lib/optimized-queries'
import { prisma } from '@/lib/prisma'
import { billQueries, contractQueries } from '@/lib/queries'

import type { AuthAppEnv } from '../lib/auth-context'
import {
  notFoundError,
  notImplementedError,
  validationError,
} from '../lib/api-errors'
import {
  jsonApiError,
  jsonSuccess,
  readJsonBody,
} from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
import { Hono } from 'hono'

const LEGACY_COMPAT = {
  currentState: 'compat-wrapper',
  targetStrategy: 'compat-wrapper',
  legacyPaths: [
    'src/app/api/bills/route.ts',
    'src/app/api/bills/stats/route.ts',
    'src/app/api/bills/repair-details/route.ts',
    'src/app/api/bills/[id]/route.ts',
    'src/app/api/bills/[id]/status/route.ts',
    'src/app/api/bills/[id]/details/route.ts',
    'src/app/api/bills/[id]/utility-details/route.ts',
    'src/app/api/contracts/[id]/generate-bills/route.ts',
  ] as const,
  reason:
    'phase09-03 起由 server/routes/bills.ts 与 src/lib/domain/billing 承接账单金额/状态语义、基础支付周期出账和账单删除门禁；旧 Next 入口仅保留 compat wrapper。',
  exitCondition:
    '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/bills/* 与基础生成入口 compat wrapper 可移除。',
} as const

interface BillDetailItem {
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
  meterReading?: unknown
}

interface BillDetailResponse {
  success: boolean
  data: BillDetailItem[]
  metadata: {
    source: 'bill_details' | 'meter_reading' | 'related_readings' | 'empty'
    isLegacy: boolean
    totalAmount?: number
    billInfo?: {
      id: string
      billNumber: string
      type: string
      amount: number
      status: string
    }
  }
}

function toClientBill(bill: any) {
  return {
    ...bill,
    amount: Number(bill.amount),
    receivedAmount: Number(bill.receivedAmount),
    pendingAmount: Number(bill.pendingAmount),
    contract: {
      ...bill.contract,
      monthlyRent: Number(bill.contract.monthlyRent),
      totalRent: Number(bill.contract.totalRent),
      deposit: Number(bill.contract.deposit),
      keyDeposit: bill.contract.keyDeposit ? Number(bill.contract.keyDeposit) : null,
      cleaningFee: bill.contract.cleaningFee
        ? Number(bill.contract.cleaningFee)
        : null,
    },
  }
}

function isBeforeToday(date: Date) {
  const candidate = new Date(date)
  candidate.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return candidate < today
}

async function validateBillCreation(data: {
  contractId?: string
  amount?: number
  dueDate?: string
  billNumber?: string
  type?: 'RENT' | 'DEPOSIT' | 'UTILITIES' | 'OTHER'
  itemLabel?: string
}) {
  try {
    const contract = data.contractId
      ? await contractQueries.findById(data.contractId)
      : null
    if (!contract || contract.status !== 'ACTIVE') {
      return { valid: false, error: '合同不存在或已失效' }
    }
  } catch (_error) {
    return { valid: false, error: '合同验证失败' }
  }

  if (
    typeof data.amount !== 'number' ||
    data.amount <= 0 ||
    data.amount > 999999.99
  ) {
    return { valid: false, error: '金额必须在0.01-999999.99之间' }
  }

  const dueDate = new Date(data.dueDate ?? '')
  if (Number.isNaN(dueDate.getTime()) || isBeforeToday(dueDate)) {
    return { valid: false, error: '到期日期格式错误或早于今天' }
  }

  if (!data.billNumber || !/^BILL[A-Z0-9]{6,12}$/.test(data.billNumber)) {
    return { valid: false, error: '账单编号格式不正确' }
  }

  if (data.type === 'OTHER') {
    const itemLabel =
      typeof data.itemLabel === 'string' ? data.itemLabel.trim() : ''

    if (!itemLabel) {
      return { valid: false, error: '其他账单必须填写条目名' }
    }
  }

  return { valid: true }
}

function appendBillsFallback(routeApp: Hono<AuthAppEnv>, env: MinixServerEnv) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        'phase09-03 仅迁入账单更新、状态语义查询与账单删除门禁；其余账务入口仍由 compat wrapper 或后续子任务承接。',
        {
          phase: 'phase09-03',
          routeKey: 'bills',
          domainServiceHost: 'src/lib/domain',
          migrationState: 'partial-migrated',
          compatBoundary: LEGACY_COMPAT,
          modules: [billingDomainBoundary].map((moduleBoundary) => ({
            name: moduleBoundary.name,
            description: moduleBoundary.description,
            compatBoundary: moduleBoundary.compatBoundary,
            transactionBoundary: moduleBoundary.transactionBoundary,
          })),
        }
      ),
      { env }
    )
  })
}

export function createBillRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.get('/', async (c) => {
    const url = new URL(c.req.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(
      Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10)),
      100
    )
    const status = url.searchParams.get('status')?.trim() || undefined
    const type = url.searchParams.get('type')?.trim() || undefined
    const contractId = url.searchParams.get('contractId')?.trim() || undefined
    const search = url.searchParams.get('search')?.trim() || undefined
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const buildingId = url.searchParams.get('buildingId')?.trim() || undefined
    const renterId = url.searchParams.get('renterId')?.trim() || undefined

    const result = await optimizedBillQueries.findWithPagination(
      { page, limit },
      {
        ...(status ? { status: status as any } : {}),
        ...(type ? { type: type as any } : {}),
        ...(contractId ? { contractId } : {}),
        ...(search ? { search } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        ...(buildingId ? { buildingId } : {}),
        ...(renterId ? { renterId } : {}),
      }
    )

    return c.json({
      data: result.data.map(toClientBill),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
    })
  })

  routeApp.post('/', async (c) => {
    const billData =
      (await readJsonBody<{
        billNumber?: string
        contractId?: string
        amount?: number
        pendingAmount?: number
        dueDate?: string
        period?: string
        itemLabel?: string
        type?: 'RENT' | 'DEPOSIT' | 'UTILITIES' | 'OTHER'
        paymentMethod?: string
        operator?: string
        remarks?: string
      }>(c, {
        maxBytes: env.requestGovernance.maxRequestSize,
      })) ?? {}
    const normalizedItemLabel =
      typeof billData.itemLabel === 'string' ? billData.itemLabel.trim() : ''

    if (
      !billData.billNumber ||
      !billData.contractId ||
      !billData.amount ||
      !billData.dueDate
    ) {
      return c.json(
        { error: '缺少必填字段: billNumber, contractId, amount, dueDate' },
        400
      )
    }

    const validationResult = await validateBillCreation({
      contractId: billData.contractId,
      amount: billData.amount,
      dueDate: billData.dueDate,
      billNumber: billData.billNumber,
      type: billData.type,
      itemLabel: normalizedItemLabel,
    })

    if (!validationResult.valid) {
      return c.json({ error: validationResult.error }, 400)
    }

    const newBill = await billQueries.create({
      billNumber: billData.billNumber,
      type: billData.type || 'OTHER',
      itemLabel:
        (billData.type || 'OTHER') === 'OTHER' ? normalizedItemLabel : undefined,
      amount: billData.amount,
      pendingAmount: billData.pendingAmount || billData.amount,
      dueDate: new Date(billData.dueDate),
      period: billData.period,
      contractId: billData.contractId,
      paymentMethod: billData.paymentMethod || '待确定',
      operator: billData.operator || '手动创建',
      remarks:
        billData.remarks || `${billData.type || 'OTHER'}账单 - 手动创建`,
    })

    return c.json(toClientBill(newBill))
  })

  routeApp.get('/stats', async (c) => {
    const url = new URL(c.req.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')
    const range = url.searchParams.get('range')
    const groupBy =
      (url.searchParams.get('groupBy') as 'day' | 'week' | 'month') || 'day'
    const includeComparison = url.searchParams.get('comparison') === 'true'
    const dateRange = parseDateRange({
      start: start || undefined,
      end: end || undefined,
      range: range || undefined,
    })

    // phase13-07 keeps `/api/bills/stats` on retained-legacy semantics.
    // The unified Hono host only provides a static bridge here so the route is
    // no longer swallowed by the dynamic `/:id` handler before phase14 drain.
    const statsData = await advancedBillStats.getDetailedStats({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy,
      includeComparison,
    })

    return c.json({
      ...statsData,
      totalAmount: Number(statsData.totalAmount),
      paidAmount: Number(statsData.paidAmount),
      pendingAmount: Number(statsData.pendingAmount),
      overdueAmount: Number(statsData.overdueAmount),
      timeSeries: statsData.timeSeries.map((item) => ({
        ...item,
        totalAmount: Number(item.totalAmount),
        paidAmount: Number(item.paidAmount),
        pendingAmount: Number(item.pendingAmount),
      })),
      typeBreakdown: Object.fromEntries(
        Object.entries(statsData.typeBreakdown).map(([key, value]) => [
          key,
          {
            amount: Number(value.amount),
            count: Number(value.count),
          },
        ])
      ),
    })
  })

  routeApp.get('/:id/details', async (c) => {
    try {
      const billId = c.req.param('id')
      const result = await billQueryCache.getCachedQuery(
        {
          type: 'filter',
          filters: { billId, type: 'details' },
        },
        async (): Promise<BillDetailResponse | { success: false; data: []; metadata: BillDetailResponse['metadata'] }> => {
          const bill = await prisma.bill.findUnique({
            where: { id: billId },
            select: {
              id: true,
              billNumber: true,
              type: true,
              amount: true,
              status: true,
              meterReadingId: true,
            },
          })

          if (!bill) {
            return {
              success: false,
              data: [],
              metadata: {
                source: 'empty',
                isLegacy: false,
              },
            }
          }

          const billDetails = await prisma.billDetail.findMany({
            where: { billId },
            include: {
              meterReading: {
                include: {
                  meter: {
                    select: {
                      id: true,
                      displayName: true,
                      meterType: true,
                      unit: true,
                      unitPrice: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          })

          if (billDetails.length > 0) {
            const detailItems: BillDetailItem[] = billDetails.map((detail) => ({
              id: detail.id,
              billId: detail.billId,
              meterReadingId: detail.meterReadingId,
              meterType: detail.meterType,
              meterName:
                detail.meterName ||
                detail.meterReading?.meter?.displayName ||
                '未知仪表',
              usage: Number(detail.usage),
              unitPrice: Number(detail.unitPrice),
              amount: Number(detail.amount),
              unit: detail.unit,
              previousReading:
                detail.previousReading !== null
                  ? Number(detail.previousReading)
                  : null,
              currentReading: Number(detail.currentReading),
              readingDate: detail.readingDate.toISOString(),
              priceSource: detail.priceSource || 'METER_CONFIG',
              createdAt: detail.createdAt.toISOString(),
              updatedAt: detail.updatedAt.toISOString(),
              meterReading: detail.meterReading,
            }))

            return {
              success: true,
              data: detailItems,
              metadata: {
                source: 'bill_details',
                isLegacy: false,
                totalAmount: detailItems.reduce((sum, item) => sum + item.amount, 0),
                billInfo: {
                  id: bill.id,
                  billNumber: bill.billNumber,
                  type: bill.type,
                  amount: Number(bill.amount),
                  status: bill.status,
                },
              },
            }
          }

          if (bill.meterReadingId) {
            const meterReading = await prisma.meterReading.findUnique({
              where: { id: bill.meterReadingId },
              include: {
                meter: {
                  select: {
                    id: true,
                    displayName: true,
                    meterType: true,
                    unit: true,
                    unitPrice: true,
                  },
                },
              },
            })

            if (meterReading) {
              const legacyDetail: BillDetailItem = {
                id: `legacy-${meterReading.id}`,
                billId,
                meterReadingId: meterReading.id,
                meterType: meterReading.meter.meterType,
                meterName: meterReading.meter.displayName,
                usage: Number(meterReading.usage),
                unitPrice: Number(meterReading.unitPrice),
                amount: Number(meterReading.amount),
                unit: meterReading.meter.unit,
                previousReading:
                  meterReading.previousReading !== null
                    ? Number(meterReading.previousReading)
                    : null,
                currentReading: Number(meterReading.currentReading),
                readingDate: meterReading.readingDate.toISOString(),
                priceSource: 'METER_CONFIG',
                createdAt: meterReading.createdAt.toISOString(),
                updatedAt: meterReading.updatedAt.toISOString(),
                meterReading,
              }

              return {
                success: true,
                data: [legacyDetail],
                metadata: {
                  source: 'meter_reading',
                  isLegacy: true,
                  totalAmount: legacyDetail.amount,
                  billInfo: {
                    id: bill.id,
                    billNumber: bill.billNumber,
                    type: bill.type,
                    amount: Number(bill.amount),
                    status: bill.status,
                  },
                },
              }
            }
          }

          return {
            success: true,
            data: [],
            metadata: {
              source: 'empty',
              isLegacy: false,
              totalAmount: 0,
              billInfo: {
                id: bill.id,
                billNumber: bill.billNumber,
                type: bill.type,
                amount: Number(bill.amount),
                status: bill.status,
              },
            },
          }
        }
      )

      return c.json(result)
    } catch (error) {
      console.error('获取账单明细失败:', error)
      return c.json(
        {
          success: false,
          error: '获取账单明细失败',
          data: [],
          metadata: {
            source: 'empty',
            isLegacy: false,
          },
        },
        500
      )
    }
  })

  routeApp.get('/:id', async (c) => {
    const billId = c.req.param('id')
    const bill = await billQueries.findById(billId)

    if (!bill) {
      return c.json({ error: 'Bill not found' }, 404)
    }

    return c.json(toClientBill(bill))
  })

  routeApp.get('/:id/semantics', async (c) => {
    const billId = c.req.param('id')

    try {
      const snapshot = await billingDomainService.getBillingSemanticsSnapshot(billId)

      return jsonSuccess(c, {
        data: {
          ...snapshot,
          compatBoundary: LEGACY_COMPAT,
        },
        message: '账单语义快照获取成功',
        env,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Bill not found') {
        return jsonApiError(c, notFoundError('账单不存在'), { env })
      }

      throw error
    }
  })

  routeApp.patch('/:id', async (c) => {
    const billId = c.req.param('id')
    const body =
      (await readJsonBody<{
        amount?: number
        pendingAmount?: number
        dueDate?: string
        period?: string | null
        itemLabel?: string | null
        remarks?: string | null
      }>(c, {
        allowEmpty: true,
        maxBytes: env.requestGovernance.maxRequestSize,
      })) ?? {}

    try {
      const bill = await billingDomainService.updatePendingBillDraft(billId, body)

      return jsonSuccess(c, {
        data: {
          bill,
          compatBoundary: LEGACY_COMPAT,
        },
        message: '账单草稿更新成功',
        env,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Bill not found') {
        return jsonApiError(c, notFoundError('账单不存在'), { env })
      }

      if (isBillingDomainValidationError(error)) {
        return jsonApiError(
          c,
          validationError(error.message, {
            code: error.code,
            ...error.details,
            compatBoundary: LEGACY_COMPAT,
          }),
          { env }
        )
      }

      throw error
    }
  })

  routeApp.patch('/:id/status', async (c) => {
    const billId = c.req.param('id')
    const body = (await readJsonBody<{
      status: 'PENDING' | 'PAID' | 'OVERDUE' | 'COMPLETED'
      receivedAmount?: number
      pendingAmount?: number
      paidDate?: string | null
      paymentMethod?: string | null
      operator?: string | null
      remarks?: string | null
    }>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })) as {
      status: 'PENDING' | 'PAID' | 'OVERDUE' | 'COMPLETED'
      receivedAmount?: number
      pendingAmount?: number
      paidDate?: string | null
      paymentMethod?: string | null
      operator?: string | null
      remarks?: string | null
    }

    try {
      const bill = await billingDomainService.updateBillCollectionStatus(billId, body)

      return jsonSuccess(c, {
        data: {
          bill,
          compatBoundary: LEGACY_COMPAT,
        },
        message: '账单收款状态更新成功',
        env,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Bill not found') {
        return jsonApiError(c, notFoundError('账单不存在'), { env })
      }

      if (isBillingDomainValidationError(error)) {
        return jsonApiError(
          c,
          validationError(error.message, {
            code: error.code,
            ...error.details,
            compatBoundary: LEGACY_COMPAT,
          }),
          { env }
        )
      }

      throw error
    }
  })

  routeApp.delete('/:id', async (c) => {
    const billId = c.req.param('id')
    let safetyCheck
    try {
      safetyCheck = await billingDomainService.performBillDeleteSafetyCheck(billId)
    } catch (error) {
      if (error instanceof Error && error.message === 'Bill not found') {
        return jsonApiError(c, notFoundError('账单不存在'), { env })
      }

      throw error
    }

    if (!safetyCheck.canDelete) {
      return jsonApiError(
        c,
        validationError('无法删除账单', {
          code: safetyCheck.errorCode,
          billStatus: safetyCheck.billStatus,
          amount: safetyCheck.amount,
          receivedAmount: safetyCheck.receivedAmount,
          pendingAmount: safetyCheck.pendingAmount,
          billDetailCount: safetyCheck.billDetailCount,
          meterReadingId: safetyCheck.meterReadingId,
          paidDate: safetyCheck.paidDate,
          hasSettlementTrace: safetyCheck.hasSettlementTrace,
          hasUsageHistory: safetyCheck.hasUsageHistory,
          blockingReasons: safetyCheck.blockingReasons,
          suggestion: safetyCheck.suggestion,
          compatBoundary: LEGACY_COMPAT,
        }),
        { env }
      )
    }

    try {
      const result = await billingDomainService.deletePendingBillWithoutHistory(billId)

      return jsonSuccess(c, {
        data: {
          ...result,
          compatBoundary: LEGACY_COMPAT,
        },
        message: result.message,
        env,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Bill not found') {
        return jsonApiError(c, notFoundError('账单不存在'), { env })
      }

      if (isBillDeleteGuardBlockedError(error)) {
        const latestSafetyCheck = error.details

        return jsonApiError(
          c,
          validationError('无法删除账单', {
            code: latestSafetyCheck.errorCode,
            billStatus: latestSafetyCheck.billStatus,
            amount: latestSafetyCheck.amount,
            receivedAmount: latestSafetyCheck.receivedAmount,
            pendingAmount: latestSafetyCheck.pendingAmount,
            billDetailCount: latestSafetyCheck.billDetailCount,
            meterReadingId: latestSafetyCheck.meterReadingId,
            paidDate: latestSafetyCheck.paidDate,
            hasSettlementTrace: latestSafetyCheck.hasSettlementTrace,
            hasUsageHistory: latestSafetyCheck.hasUsageHistory,
            blockingReasons: latestSafetyCheck.blockingReasons,
            suggestion: latestSafetyCheck.suggestion,
            compatBoundary: LEGACY_COMPAT,
          }),
          { env }
        )
      }

      throw error
    }
  })

  appendBillsFallback(routeApp, env)

  return routeApp
}
