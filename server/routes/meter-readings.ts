import { billingDomainBoundary, metersDomainBoundary } from '@/lib/domain'
import {
  isMeterReadingDomainValidationError,
  meterReadingDomainService,
} from '@/lib/domain/meters'

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
    'src/app/api/meter-readings/route.ts',
    'src/app/api/meter-readings/status-check/route.ts',
    'src/app/api/meter-readings/repair-status/route.ts',
    'src/app/api/meter-readings/[id]/route.ts',
    'src/app/api/meter-readings/[id]/related-bills/route.ts',
    'src/app/api/utility-readings/route.ts',
    'src/app/api/meters/[meterId]/route.ts',
    'src/app/api/meters/[meterId]/status/route.ts',
  ] as const,
  reason:
    'phase09-04 起由 server/routes/meter-readings.ts 与 src/lib/domain/meters 承接抄表写入、详情、相关账单追溯、终抄语义与禁删规则；旧 Next 入口仅保留 compat wrapper。',
  exitCondition:
    '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/meter-readings/* 与 src/app/api/utility-readings/route.ts compat wrapper 可移除。',
} as const

function appendMeterReadingsFallback(
  routeApp: Hono<AuthAppEnv>,
  env: MinixServerEnv
) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        'phase09-04 仅迁入抄表写入、详情、相关账单追溯与禁删语义；其余抄表治理/辅助接口仍由 compat wrapper 或后续子任务承接。',
        {
          phase: 'phase09-04',
          routeKey: 'meter-readings',
          domainServiceHost: 'src/lib/domain/meters',
          migrationState: 'partial-migrated',
          compatBoundary: LEGACY_COMPAT,
          modules: [metersDomainBoundary, billingDomainBoundary].map((moduleBoundary) => ({
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

export function createMeterReadingRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.post('/', async (c) => {
    const body = (await readJsonBody<{
      readings: Array<{
        meterId: string
        contractId?: string | null
        previousReading?: number | null
        currentReading: number
        readingDate?: string
        period?: string
        unitPrice?: number | null
        operator?: string | null
        remarks?: string | null
      }>
      validateOnly?: boolean
      aggregationMode?: 'SINGLE' | 'AGGREGATED'
    }>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })) as {
      readings: Array<{
        meterId: string
        contractId?: string | null
        previousReading?: number | null
        currentReading: number
        readingDate?: string
        period?: string
        unitPrice?: number | null
        operator?: string | null
        remarks?: string | null
      }>
      validateOnly?: boolean
      aggregationMode?: 'SINGLE' | 'AGGREGATED'
    }

    try {
      const result = await meterReadingDomainService.createRegularMeterReadingBatch({
        readings: body.readings,
        validateOnly: body.validateOnly,
        aggregationMode: body.aggregationMode,
      })

      return jsonSuccess(c, {
        data: {
          ...result,
          compatBoundary: LEGACY_COMPAT,
        },
        message:
          `成功处理 ${result.summary.success} 个抄表记录` +
          (result.summary.billsGenerated > 0
            ? `，生成 ${result.summary.billsGenerated} 个账单`
            : ''),
        env,
      })
    } catch (error) {
      if (isMeterReadingDomainValidationError(error)) {
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

  routeApp.get('/:id', async (c) => {
    const readingId = c.req.param('id')

    try {
      const result = await meterReadingDomainService.getMeterReadingDetail(readingId)

      return jsonSuccess(c, {
        data: {
          ...result,
          compatBoundary: LEGACY_COMPAT,
        },
        message: '抄表详情获取成功',
        env,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'MeterReading not found') {
        return jsonApiError(c, notFoundError('抄表记录不存在'), { env })
      }

      throw error
    }
  })

  routeApp.get('/:id/related-bills', async (c) => {
    const readingId = c.req.param('id')

    try {
      const result =
        await meterReadingDomainService.getRelatedBillsForMeterReading(readingId)

      return jsonSuccess(c, {
        data: {
          ...result,
          compatBoundary: LEGACY_COMPAT,
        },
        message: '抄表关联账单追溯成功',
        env,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'MeterReading not found') {
        return jsonApiError(c, notFoundError('抄表记录不存在'), { env })
      }

      throw error
    }
  })

  routeApp.delete('/:id', async (c) => {
    const readingId = c.req.param('id')

    try {
      const deleteGuard =
        await meterReadingDomainService.performMeterReadingDeleteSafetyCheck(
          readingId
        )

      return jsonApiError(
        c,
        validationError('当前阶段不支持删除抄表记录', {
          ...deleteGuard,
          compatBoundary: LEGACY_COMPAT,
        }),
        { env }
      )
    } catch (error) {
      if (error instanceof Error && error.message === 'MeterReading not found') {
        return jsonApiError(c, notFoundError('抄表记录不存在'), { env })
      }

      throw error
    }
  })

  appendMeterReadingsFallback(routeApp, env)

  return routeApp
}
