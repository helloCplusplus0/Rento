import { Hono } from 'hono'

import { deriveOverallStatusFromSignals, getHealthHttpStatus } from '../../src/lib/observability'
import { prisma } from '../../src/lib/prisma'

const healthRoutes = new Hono()

healthRoutes.get('/health', async (c) => {
  const startedAt = Date.now()
  const database = await checkDatabase()
  const status = deriveOverallStatusFromSignals([database.status])
  const httpStatus = getHealthHttpStatus(status) as 200 | 503
  const memory = process.memoryUsage()

  return c.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'rento-minix-runtime',
      checks: {
        database,
      },
      metrics: {
        memory: {
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
          rssMb: Math.round(memory.rss / 1024 / 1024),
        },
        responseTimeMs: Date.now() - startedAt,
      },
    },
    httpStatus
  )
})

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    return {
      status: 'warn' as const,
      message: 'DATABASE_URL is not configured. Database probe skipped for the runtime shell.',
    }
  }

  const startedAt = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`

    return {
      status: 'pass' as const,
      message: 'Database connection is healthy.',
      responseTimeMs: Date.now() - startedAt,
    }
  } catch (error) {
    return {
      status: 'fail' as const,
      message: error instanceof Error ? error.message : 'Unknown database error.',
      responseTimeMs: Date.now() - startedAt,
    }
  }
}

export { healthRoutes }
