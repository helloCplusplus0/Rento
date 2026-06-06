import { billingDomainBoundary } from '@/lib/domain'
import {
  billingDomainService,
  isBillDeleteGuardBlockedError,
  isBillingDomainValidationError,
} from '@/lib/domain/billing'
import { optimizedBillQueries } from '@/lib/optimized-queries'

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
