import {
  contractsDomainBoundary,
  deleteGuardsDomainBoundary,
} from '@/lib/domain'
import {
  contractDomainService,
  contractLifecycleService,
  isContractDomainValidationError,
} from '@/lib/domain/contracts'
import {
  deletePendingContractWithoutHistory,
  isContractDeleteGuardBlockedError,
  performContractDeleteSafetyCheck,
} from '@/lib/domain/delete-guards'
import { globalSettings } from '@/lib/global-settings'
import { optimizedContractQueries } from '@/lib/optimized-queries'

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
    'src/app/api/contracts/route.ts',
    'src/app/api/contracts/activate/route.ts',
    'src/app/api/contracts/[id]/route.ts',
    'src/app/api/contracts/[id]/renew/route.ts',
    'src/app/api/contracts/[id]/generate-bills/route.ts',
  ] as const,
  reason:
    'phase09-05 起由 server/routes/contracts.ts 与 src/lib/domain/contracts|delete-guards 承接合同激活、续租、补账单与删除门禁；旧 Next 入口仅保留 compat wrapper。',
  exitCondition:
    '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/contracts/* compat wrapper 可移除。',
} as const

function toClientContract(contract: any) {
  return {
    ...contract,
    monthlyRent: Number(contract.monthlyRent),
    totalRent: Number(contract.totalRent),
    deposit: Number(contract.deposit),
    keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
    cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
    room: {
      ...contract.room,
      rent: Number(contract.room.rent),
      area: contract.room.area ? Number(contract.room.area) : null,
      building: {
        ...contract.room.building,
        totalRooms: Number(contract.room.building.totalRooms),
      },
    },
    bills: contract.bills.map((bill: any) => ({
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
    })),
  }
}

function appendContractsFallback(
  routeApp: Hono<AuthAppEnv>,
  env: MinixServerEnv
) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        'phase09-05 仅迁入合同激活、续租、补账单与合同删除门禁；其余合同入口仍由 compat wrapper 或后续子任务承接。',
        {
          phase: 'phase09-05',
          routeKey: 'contracts',
          domainServiceHost: 'src/lib/domain',
          migrationState: 'partial-migrated',
          compatBoundary: LEGACY_COMPAT,
          modules: [contractsDomainBoundary, deleteGuardsDomainBoundary].map(
            (moduleBoundary) => ({
              name: moduleBoundary.name,
              description: moduleBoundary.description,
              compatBoundary: moduleBoundary.compatBoundary,
              transactionBoundary: moduleBoundary.transactionBoundary,
            })
          ),
        }
      ),
      { env }
    )
  })
}

export function createContractRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.get('/', async (c) => {
    const url = new URL(c.req.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(
      Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10)),
      100
    )
    const search = url.searchParams.get('search')?.trim() || undefined
    const status = url.searchParams.get('status')?.trim() || undefined
    const buildingId = url.searchParams.get('buildingId')?.trim() || undefined
    const isExpiringSoon = url.searchParams.get('isExpiringSoon') === 'true'
    const shouldFilterExpiringSoon =
      status === 'expiring_soon' || isExpiringSoon

    let expiringDays: number | undefined
    if (shouldFilterExpiringSoon) {
      const contractAlertSettingsLoadResult =
        await globalSettings.getContractAlertSettings()
      expiringDays =
        contractAlertSettingsLoadResult.settings.contractExpiryAlertDays
    }

    const result = await optimizedContractQueries.findWithPagination(
      { page, limit },
      {
        ...(status && status !== 'all' && status !== 'expiring_soon'
          ? { status: status as any }
          : {}),
        ...(search ? { search } : {}),
        ...(buildingId ? { buildingId } : {}),
        ...(expiringDays ? { expiringDays } : {}),
      }
    )

    return jsonSuccess(c, {
      data: {
        contracts: result.data.map(toClientContract),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
      env,
    })
  })

  routeApp.post('/activate', async (c) => {
    const body =
      (await readJsonBody<{ contractId?: string }>(c, {
        allowEmpty: true,
        maxBytes: env.requestGovernance.maxRequestSize,
      })) ?? {}

    if (body.contractId) {
      const result = await contractLifecycleService.manualActivateContract(
        body.contractId
      )

      if (!result.success) {
        return jsonApiError(
          c,
          validationError(result.message, {
            contractId: body.contractId,
            compatBoundary: LEGACY_COMPAT,
          }),
          { env }
        )
      }

      return jsonSuccess(c, {
        data: {
          message: result.message,
          contractId: body.contractId,
        },
        message: result.message,
        env,
      })
    }

    const result = await contractLifecycleService.activatePendingContracts()

    return jsonSuccess(c, {
      data: {
        activated: result.activated,
        errors: result.errors,
        message: `激活任务完成，成功激活 ${result.activated} 个合同`,
      },
      message: `激活任务完成，成功激活 ${result.activated} 个合同`,
      env,
    })
  })

  routeApp.post('/:id/renew', async (c) => {
    const originalContractId = c.req.param('id')
    const body = (await readJsonBody<{
      newStartDate: string
      newEndDate: string
      newMonthlyRent: number
      newDeposit?: number
      newKeyDeposit?: number
      newCleaningFee?: number
      paymentMethod?: string | null
      paymentTiming?: string | null
      signedBy?: string | null
      signedDate?: string | null
      remarks?: string | null
    }>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })) as {
      newStartDate: string
      newEndDate: string
      newMonthlyRent: number
      newDeposit?: number
      newKeyDeposit?: number
      newCleaningFee?: number
      paymentMethod?: string | null
      paymentTiming?: string | null
      signedBy?: string | null
      signedDate?: string | null
      remarks?: string | null
    }

    try {
      const result = await contractDomainService.renewContract({
        originalContractId,
        newStartDate: body.newStartDate,
        newEndDate: body.newEndDate,
        newMonthlyRent: body.newMonthlyRent,
        newDeposit: body.newDeposit,
        newKeyDeposit: body.newKeyDeposit,
        newCleaningFee: body.newCleaningFee,
        paymentMethod: body.paymentMethod,
        paymentTiming: body.paymentTiming,
        signedBy: body.signedBy,
        signedDate: body.signedDate,
        remarks: body.remarks,
      })

      return jsonSuccess(c, {
        data: {
          ...result,
          compatBoundary: LEGACY_COMPAT,
        },
        message:
          result.billGeneration.success
            ? '续租成功'
            : '续租成功，补账单生成需人工复核',
        env,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return jsonApiError(c, notFoundError('原合同不存在'), { env })
      }

      if (isContractDomainValidationError(error)) {
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

  routeApp.post('/:id/generate-bills', async (c) => {
    const contractId = c.req.param('id')

    try {
      const result = await contractDomainService.generateContractBills(contractId, {
        mode: 'auto',
      })

      return jsonSuccess(c, {
        data: {
          ...result,
          compatBoundary: LEGACY_COMPAT,
        },
        message:
          result.generationMode === 'GENERATE_BASE'
            ? `成功为合同生成 ${result.generatedBills.length} 个基础账单`
            : `成功补齐 ${result.generatedBills.length} 个缺失租金账单`,
        env,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return jsonApiError(c, notFoundError('合同不存在'), { env })
      }

      if (isContractDomainValidationError(error)) {
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
    const contractId = c.req.param('id')
    const safetyCheck = await performContractDeleteSafetyCheck(contractId)

    if (!safetyCheck.canDelete) {
      return jsonApiError(
        c,
        validationError('无法删除合同', {
          code: safetyCheck.errorCode,
          currentStatus: safetyCheck.contractStatus,
          billCount: safetyCheck.billCount,
          paidBillCount: safetyCheck.paidBillCount,
          unpaidBillCount: safetyCheck.unpaidBillCount,
          meterReadingCount: safetyCheck.meterReadingCount,
          billedMeterReadingCount: safetyCheck.billedMeterReadingCount,
          billDetailCount: safetyCheck.billDetailCount,
          blockingReasons: safetyCheck.blockingReasons,
          suggestion: safetyCheck.suggestion,
          compatBoundary: LEGACY_COMPAT,
        }),
        { env }
      )
    }

    try {
      const result = await deletePendingContractWithoutHistory(contractId)

      return jsonSuccess(c, {
        data: result,
        message: result.message,
        env,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return jsonApiError(c, notFoundError('合同不存在'), { env })
      }

      if (isContractDeleteGuardBlockedError(error)) {
        const latestSafetyCheck = error.details

        return jsonApiError(
          c,
          validationError('无法删除合同', {
            code: latestSafetyCheck.errorCode,
            currentStatus: latestSafetyCheck.contractStatus,
            billCount: latestSafetyCheck.billCount,
            paidBillCount: latestSafetyCheck.paidBillCount,
            unpaidBillCount: latestSafetyCheck.unpaidBillCount,
            meterReadingCount: latestSafetyCheck.meterReadingCount,
            billedMeterReadingCount: latestSafetyCheck.billedMeterReadingCount,
            billDetailCount: latestSafetyCheck.billDetailCount,
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

  appendContractsFallback(routeApp, env)

  return routeApp
}
