/**
 * 系统健康检查API
 * GET /api/health/system
 */

import { systemHealthChecker } from '@/lib/health-checker'
import { ErrorLogger, ErrorType, ErrorSeverity } from '@/lib/error-logger'

const logger = ErrorLogger.getInstance()

export async function GET() {
  const startTime = Date.now()
  
  try {
    logger.logInfo('开始系统健康检查', {
      module: 'health-api',
      function: 'GET /api/health/system'
    })

    const health = await systemHealthChecker.checkSystemHealth()
    const responseTime = Date.now() - startTime

    logger.logInfo('系统健康检查完成', {
      module: 'health-api',
      overallStatus: health.overall,
      responseTime,
      checksCount: health.checks.length
    })

    // 根据健康状态返回相应的HTTP状态码
    const httpStatus = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 200 : 503

    return Response.json({
      ...health,
      responseTime
    }, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime

    await logger.logError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      '系统健康检查失败',
      {
        module: 'health-api',
        function: 'GET /api/health/system',
        responseTime
      },
      error instanceof Error ? error : undefined
    )

    return Response.json({
      overall: 'unhealthy',
      error: 'Health check failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      responseTime
    }, {
      status: 500
    })
  }
}