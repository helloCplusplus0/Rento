import { Hono } from 'hono'

import {
  deriveOverallStatusFromSignals,
  getHealthHttpStatus,
  getObservabilityMetadata,
} from '../../src/lib/observability'
import { prisma } from '../../src/lib/prisma'
import type { MinixServerEnv } from '../lib/env'

export function createHealthRoutes(env: MinixServerEnv) {
  const healthRoutes = new Hono()

  healthRoutes.get('/health', async (c) => {
    const startedAt = Date.now()
    const database = await checkDatabase()
    const memoryCheck = checkMemory()
    const status = deriveOverallStatusFromSignals([
      database.status,
      memoryCheck.status,
    ])
    const httpStatus = getHealthHttpStatus(status) as 200 | 503
    const memory = process.memoryUsage()
    const checks = [database, memoryCheck]

    return c.json(
      {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '0.1.0',
        entryRole: 'primary',
        service: env.runtimeName,
        api: {
          basePath: env.api.basePath,
          protectedByDefault: env.api.protectedByDefault,
          publicPaths: env.api.publicPaths,
        },
        runtime: {
          distDir: env.distDir,
          host: env.host,
          mode: env.nodeEnv,
          port: env.port,
          staticHosting: env.isProduction ? 'dist' : 'vite-dev-server',
        },
        envContract: {
          sessionSecret: {
            configured: env.sessionSecret.configured,
            source: env.sessionSecret.source,
          },
          requestGovernance: {
            allowedOrigins: env.requestGovernance.allowedOrigins,
            corsEnabled: env.requestGovernance.corsEnabled,
            maxRequestSize: env.requestGovernance.maxRequestSize,
            timeoutMs: env.requestGovernance.timeoutMs,
          },
        },
        checks: {
          database,
          memory: memoryCheck,
        },
        metrics: {
          memory: {
            used: Math.round(memory.heapUsed / 1024 / 1024),
            total: Math.round(memory.heapTotal / 1024 / 1024),
            external: Math.round(memory.external / 1024 / 1024),
            percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100),
          },
          database: {
            responseTime: database.responseTimeMs || 0,
            status: database.status,
          },
          responseTimeMs: Date.now() - startedAt,
        },
        summary: {
          totalChecks: checks.length,
          failingChecks: checks.filter((check) => check.status === 'fail').length,
          warningChecks: checks.filter((check) => check.status === 'warn').length,
        },
        observability: getObservabilityMetadata(),
      },
      httpStatus
    )
  })

  return healthRoutes
}

function checkMemory() {
  const memoryUsage = process.memoryUsage()
  const heapUsedMb = Math.round(memoryUsage.heapUsed / 1024 / 1024)
  const heapTotalMb = Math.round(memoryUsage.heapTotal / 1024 / 1024)
  const warnThresholdMb = Number(process.env.MEM_WARN_MB || 512)
  const failThresholdMb = Number(process.env.MEM_FAIL_MB || 1024)

  if (heapUsedMb > failThresholdMb) {
    return {
      status: 'fail' as const,
      message: 'Memory usage is too high.',
      details: {
        heapUsedMb,
        heapTotalMb,
        warnThresholdMb,
        failThresholdMb,
      },
    }
  }

  if (heapUsedMb > warnThresholdMb) {
    return {
      status: 'warn' as const,
      message: 'Memory usage is elevated.',
      details: {
        heapUsedMb,
        heapTotalMb,
        warnThresholdMb,
        failThresholdMb,
      },
    }
  }

  return {
    status: 'pass' as const,
    message: 'Memory usage is healthy.',
    details: {
      heapUsedMb,
      heapTotalMb,
      warnThresholdMb,
      failThresholdMb,
    },
  }
}

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
