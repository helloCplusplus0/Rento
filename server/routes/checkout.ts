import {
  billingDomainBoundary,
  contractsDomainBoundary,
  deleteGuardsDomainBoundary,
  metersDomainBoundary,
} from '@/lib/domain'
import {
  contractDomainService,
  isContractDomainValidationError,
} from '@/lib/domain/contracts'

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
  legacyPaths: ['src/app/api/contracts/[id]/checkout/route.ts'] as const,
  reason:
    'phase09-05 起由 server/routes/checkout.ts 与 src/lib/domain/contracts 承接退租结算编排；旧 Next 入口仅保留 compat wrapper。',
  exitCondition:
    '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/contracts/[id]/checkout/route.ts compat wrapper 可移除。',
} as const

function appendCheckoutFallback(
  routeApp: Hono<AuthAppEnv>,
  env: MinixServerEnv
) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        'phase09-05 仅迁入退租结算正式写入口；其余 checkout 辅助接口仍由 compat wrapper 或后续子任务承接。',
        {
          phase: 'phase09-05',
          routeKey: 'checkout',
          domainServiceHost: 'src/lib/domain/contracts',
          migrationState: 'partial-migrated',
          compatBoundary: LEGACY_COMPAT,
          modules: [
            contractsDomainBoundary,
            billingDomainBoundary,
            metersDomainBoundary,
            deleteGuardsDomainBoundary,
          ].map((moduleBoundary) => ({
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

export function createCheckoutRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.post('/', async (c) => {
    const contractId = c.req.param('contractId')
    const session = c.get('session')
    const body = (await readJsonBody<{
      checkoutDate: string
      checkoutReason: string
      damageAssessment?: number
      finalMeterReadings?: Record<string, number>
      remarks?: string | null
      settlementItems: Array<{
        id: string
        name: string
        direction: 'REFUND' | 'CHARGE'
        sourceType:
          | 'RENT_REFUND'
          | 'DEPOSIT_REFUND'
          | 'KEY_DEPOSIT_REFUND'
          | 'RENT_CHARGE'
          | 'DAMAGE_CHARGE'
          | 'OPEN_BILL'
        originalAmount: number
        adjustedAmount: number
        adjustmentReason?: string | null
        billId?: string
      }>
    }>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })) as {
      checkoutDate: string
      checkoutReason: string
      damageAssessment?: number
      finalMeterReadings?: Record<string, number>
      remarks?: string | null
      settlementItems: Array<{
        id: string
        name: string
        direction: 'REFUND' | 'CHARGE'
        sourceType:
          | 'RENT_REFUND'
          | 'DEPOSIT_REFUND'
          | 'KEY_DEPOSIT_REFUND'
          | 'RENT_CHARGE'
          | 'DAMAGE_CHARGE'
          | 'OPEN_BILL'
        originalAmount: number
        adjustedAmount: number
        adjustmentReason?: string | null
        billId?: string
      }>
    }

    if (!contractId) {
      return jsonApiError(c, validationError('合同ID不能为空'), { env })
    }

    try {
      const result = await contractDomainService.checkoutContract({
        contractId,
        checkoutDate: body.checkoutDate,
        checkoutReason: body.checkoutReason,
        damageAssessment: body.damageAssessment,
        finalMeterReadings: body.finalMeterReadings,
        remarks: body.remarks,
        settlementItems: body.settlementItems,
        operator: session?.username ?? '管理员',
      })

      return jsonSuccess(c, {
        data: {
          ...result,
          compatBoundary: LEGACY_COMPAT,
        },
        message: '退租成功',
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

  appendCheckoutFallback(routeApp, env)

  return routeApp
}
