import {
  generateLegacyUtilityBillCompat,
  isMeterReadingDomainValidationError,
  listContractUtilityBillHistory,
} from '@/lib/domain/meters'

import type { AuthAppEnv } from '../lib/auth-context'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
import { Hono } from 'hono'

const LEGACY_COMPAT = {
  currentState: 'compat-wrapper',
  targetStrategy: 'compat-wrapper',
  legacyPaths: ['src/app/api/utility-readings/route.ts'] as const,
  reason:
    'phase14-06 起 utility 历史兼容读写统一收口到 `server/routes/utility-readings.ts`；旧 Next 入口仅保留 compat proxy 与回滚基线。',
  exitCondition:
    '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 `src/app/api/utility-readings/route.ts` compat proxy 可直接移除。',
} as const

export function createUtilityReadingRoutes(_env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.post('/', async (c) => {
    try {
      const body = await c.req.json()
      const { contractId, electricityUsage, waterUsage, readingDate } = body

      if (
        !contractId ||
        electricityUsage === undefined ||
        waterUsage === undefined ||
        !readingDate
      ) {
        return c.json(
          {
            error: '缺少必填字段: contractId, electricityUsage, waterUsage, readingDate',
          },
          400
        )
      }

      if (
        typeof electricityUsage !== 'number' ||
        typeof waterUsage !== 'number'
      ) {
        return c.json({ error: '用量数据必须为数字类型' }, 400)
      }

      if (electricityUsage < 0 || waterUsage < 0) {
        return c.json({ error: '用量数据不能为负数' }, 400)
      }

      const result = await generateLegacyUtilityBillCompat({
        contractId,
        electricityUsage,
        waterUsage,
        gasUsage: body.gasUsage,
        readingDate,
        previousReading: body.previousReading,
        currentReading: body.currentReading,
        remarks: body.remarks,
      })

      return c.json({
        success: true,
        message: '抄表成功，已自动生成水电费账单',
        reading: result.reading,
        bill: result.bill,
        compatMode: true,
        migrationHost: 'server/routes/utility-readings.ts',
        compatBoundary: LEGACY_COMPAT,
      })
    } catch (error) {
      if (isMeterReadingDomainValidationError(error)) {
        return c.json(
          {
            error: error.message,
            code: error.code,
            details: error.details,
            compatMode: true,
            migrationHost: 'server/routes/utility-readings.ts',
            compatBoundary: LEGACY_COMPAT,
          },
          400
        )
      }

      console.error('水电抄表失败:', error)

      return c.json(
        {
          error: '水电抄表失败',
          details: error instanceof Error ? error.message : '未知错误',
        },
        500
      )
    }
  })

  routeApp.get('/', async (c) => {
    try {
      const contractId = c.req.query('contractId')

      if (!contractId) {
        return c.json({ error: '合同ID不能为空' }, 400)
      }

      const readings = await listContractUtilityBillHistory(contractId)

      return c.json({
        success: true,
        contractId,
        readings,
        compatMode: true,
        migrationHost: 'server/routes/utility-readings.ts',
        compatBoundary: LEGACY_COMPAT,
      })
    } catch (error) {
      console.error('获取抄表历史失败:', error)

      return c.json(
        {
          error: '获取抄表历史失败',
          details: error instanceof Error ? error.message : '未知错误',
        },
        500
      )
    }
  })

  return routeApp
}
