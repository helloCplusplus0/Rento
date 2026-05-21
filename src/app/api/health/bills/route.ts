/**
 * 账单系统健康检查API
 * GET /api/health/bills
 */

import { ErrorLogger, ErrorSeverity, ErrorType } from '@/lib/error-logger'
import { billSystemHealthChecker } from '@/lib/health-checker'
import {
  getHealthHttpStatus,
  getObservabilityMetadata,
} from '@/lib/observability'

const logger = ErrorLogger.getInstance()

export async function GET() {
  const startTime = Date.now()

  try {
    logger.logInfo('开始账单系统健康检查', {
      module: 'health-api',
      function: 'GET /api/health/bills',
    })

    const health = await billSystemHealthChecker.checkBillSystemHealth()
    const responseTime = Date.now() - startTime

    logger.logInfo('账单系统健康检查完成', {
      module: 'health-api',
      status: health.status,
      responseTime,
    })

    const observability = getObservabilityMetadata()

    return Response.json(
      {
        ...health,
        responseTime,
        entryRole: 'auxiliary',
        primaryEndpoint: '/api/health',
        observability,
      },
      {
        status: getHealthHttpStatus(health.status),
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error) {
    const responseTime = Date.now() - startTime
    const observability = getObservabilityMetadata()

    await logger.logError(
      ErrorType.BILL_GENERATION,
      ErrorSeverity.HIGH,
      '账单系统健康检查失败',
      {
        module: 'health-api',
        function: 'GET /api/health/bills',
        responseTime,
      },
      error instanceof Error ? error : undefined
    )

    return Response.json(
      {
        name: 'bill_system_health_check',
        status: 'unhealthy',
        error: 'Bill system health check failed',
        details: error instanceof Error ? error.message : String(error),
        lastCheck: new Date(),
        responseTime,
        entryRole: 'auxiliary',
        primaryEndpoint: '/api/health',
        observability,
      },
      {
        status: 500,
      }
    )
  }
}
