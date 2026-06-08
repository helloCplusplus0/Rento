import { billingDomainBoundary, metersDomainBoundary } from '@/lib/domain'
import {
  isMeterReadingDomainValidationError,
  meterReadingDomainService,
} from '@/lib/domain/meters'
import {
  getMeterReadingsPageClosureData,
  getMeterReadingStatusCheckPageClosureData,
  logMeterReadingRepairFailure,
  repairMeterReadingStatusPageClosureData,
} from '@/lib/page-closure-compat/meter-readings'

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
    'phase09-04 已冻结抄表写入/详情主链；phase13-04 额外补的 history/status/repair 仅作为 page-closure compat bridge，由 shared helper 同时供 Next 与 Hono 复用。',
  exitCondition:
    '待 phase13 页面闭环、phase14 `/api/meter-readings*` drain 与最终 cutover 审核完成后，再评估 history/status/repair compat helper 与旧入口退出。',
} as const

function parseMeterReadingHistoryQuery(url: string) {
  const searchParams = new URL(url).searchParams
  const hasExplicitPagination =
    searchParams.has('page') || searchParams.has('limit')
  const page = hasExplicitPagination
    ? Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10))
    : undefined
  const limit = hasExplicitPagination
    ? Math.min(
        100,
        Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10))
      )
    : undefined

  return {
    page,
    limit,
    meterId: searchParams.get('meterId') || undefined,
    contractId: searchParams.get('contractId') || undefined,
    roomId: searchParams.get('roomId') || undefined,
    recordType: searchParams.get('recordType') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    status: searchParams.get('status') || undefined,
    meterType: searchParams.get('meterType') || undefined,
    search: searchParams.get('search') || undefined,
    operator: searchParams.get('operator') || undefined,
    dateRange: searchParams.get('dateRange') || undefined,
  }
}


function appendMeterReadingsFallback(
  routeApp: Hono<AuthAppEnv>,
  env: MinixServerEnv
) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
          'phase09-04 仅冻结抄表写入、详情、相关账单追溯与禁删语义；phase13-04 额外补的 history/status/repair 只用于 Minix page-closure bridge，正式 drain 仍留给 phase14。',
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

  routeApp.get('/', async (c) => {
    const response = await getMeterReadingsPageClosureData(
      parseMeterReadingHistoryQuery(c.req.url)
    )

    return c.json(response)
  })

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

  routeApp.get('/status-check', async (c) => {
    try {
      console.log('[状态检查API] 开始执行状态一致性检查')

      const result = await getMeterReadingStatusCheckPageClosureData()

      console.log(`[状态检查API] 完成 - ${result.message}`)

      return c.json(result)
    } catch (error) {
      console.error('[状态检查API] 执行失败:', error)

      return c.json(
        {
          success: false,
          error: 'Status check failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  })

  routeApp.post('/repair-status', async (c) => {
    try {
      console.log('[状态修复API] 开始执行状态修复操作')

      const result = await repairMeterReadingStatusPageClosureData()

      console.log(`[状态修复API] 完成 - ${result.message}`)

      return c.json(result)
    } catch (error) {
      await logMeterReadingRepairFailure(error)

      return c.json(
        {
          success: false,
          error: 'Status repair failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
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
