import {
  contractsDomainBoundary,
  deleteGuardsDomainBoundary,
} from '@/lib/domain'
import { contractLifecycleService } from '@/lib/domain/contracts'
import {
  deletePendingContractWithoutHistory,
  isContractDeleteGuardBlockedError,
  performContractDeleteSafetyCheck,
} from '@/lib/domain/delete-guards'

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
    'phase09-02 起由 server/routes/contracts.ts 与 src/lib/domain/contracts|delete-guards 承接合同激活与删除门禁；旧 Next 入口仅保留 compat wrapper。',
  exitCondition:
    '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/contracts/* compat wrapper 可移除。',
} as const

function appendContractsFallback(
  routeApp: Hono<AuthAppEnv>,
  env: MinixServerEnv
) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        'phase09-02 仅迁入合同激活与合同删除门禁；其余合同入口仍由 compat wrapper 或后续子任务承接。',
        {
          phase: 'phase09-02',
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
