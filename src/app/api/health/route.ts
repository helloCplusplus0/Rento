import { NextResponse } from 'next/server'

import {
  type HealthCheckSignal,
  type ObservabilityMetadata,
  type OverallHealthStatus,
  deriveOverallStatusFromSignals,
  getObservabilityMetadata,
  getHealthHttpStatus,
} from '@/lib/observability'
import { performanceMonitor } from '@/lib/performance-monitor'
import { prisma } from '@/lib/prisma'

export interface HealthResponse {
  status: OverallHealthStatus
  timestamp: string
  uptime: number
  version: string
  entryRole: 'primary'
  checks: {
    database: HealthCheck
    memory: HealthCheck
    disk?: HealthCheck
  }
  metrics: {
    memory: MemoryMetrics
    database: DatabaseMetrics
    performance: ReturnType<typeof performanceMonitor.getSnapshot>
  }
  summary: {
    totalChecks: number
    failingChecks: number
    warningChecks: number
  }
  observability: ObservabilityMetadata
}

interface HealthCheck {
  status: HealthCheckSignal
  responseTime?: number
  message?: string
  details?: Record<string, any>
}

interface MemoryMetrics {
  used: number
  total: number
  external: number
  percentage: number
}

interface DatabaseMetrics {
  connectionCount?: number
  responseTime: number
  status: HealthCheckSignal
}

/**
 * 健康检查端点
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now()

  try {
    // 数据库健康检查
    const dbCheck = await checkDatabase()

    // 内存健康检查
    const memoryCheck = await checkMemory()

    // 磁盘健康检查（可选）
    const diskCheck = await checkDisk()

    // 收集指标
    const memoryMetrics = getMemoryMetrics()
    const databaseMetrics = {
      responseTime: dbCheck.responseTime || 0,
      status: dbCheck.status,
    }

    // 确定整体健康状态
    const overallStatus = determineOverallStatus([
      dbCheck,
      memoryCheck,
      diskCheck,
    ])

    const performanceMetrics = performanceMonitor.getSnapshot()
    const observability = getObservabilityMetadata()
    const checks = [dbCheck, memoryCheck, diskCheck].filter(
      (check): check is HealthCheck => check !== null
    )

    const healthStatus: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      entryRole: 'primary',
      checks: {
        database: dbCheck,
        memory: memoryCheck,
        ...(diskCheck && { disk: diskCheck }),
      },
      metrics: {
        memory: memoryMetrics,
        database: databaseMetrics,
        performance: performanceMetrics,
      },
      summary: {
        totalChecks: checks.length,
        failingChecks: checks.filter((check) => check.status === 'fail').length,
        warningChecks: checks.filter((check) => check.status === 'warn').length,
      },
      observability,
    }

    return NextResponse.json(healthStatus, {
      status: getHealthHttpStatus(overallStatus),
    })
  } catch (error) {
    const performanceMetrics = performanceMonitor.getSnapshot()
    const observability = getObservabilityMetadata()

    const errorStatus: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      entryRole: 'primary',
      checks: {
        database: { status: 'fail', message: 'Health check failed' },
        memory: { status: 'fail', message: 'Health check failed' },
      },
      metrics: {
        memory: getMemoryMetrics(),
        database: { responseTime: Date.now() - startTime, status: 'fail' },
        performance: performanceMetrics,
      },
      summary: {
        totalChecks: 2,
        failingChecks: 2,
        warningChecks: 0,
      },
      observability,
    }

    return NextResponse.json(errorStatus, { status: 503 })
  }
}

/**
 * 数据库健康检查
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now()

  try {
    // 执行简单查询测试连接
    await prisma.$queryRaw`SELECT 1 as test`

    const responseTime = Date.now() - startTime

    // 检查响应时间
    if (responseTime > 5000) {
      return {
        status: 'warn',
        responseTime,
        message: '数据库响应较慢',
        details: { threshold: '5000ms', actual: `${responseTime}ms` },
      }
    } else if (responseTime > 1000) {
      return {
        status: 'warn',
        responseTime,
        message: '数据库响应时间偏高',
        details: { threshold: '1000ms', actual: `${responseTime}ms` },
      }
    }

    return {
      status: 'pass',
      responseTime,
      message: '数据库连接正常',
    }
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      message: '数据库连接失败',
      details: {
        error: error instanceof Error ? error.message : '未知错误',
      },
    }
  }
}

/**
 * 内存健康检查
 */
async function checkMemory(): Promise<HealthCheck> {
  try {
    const memoryUsage = process.memoryUsage()
    const totalMemory = memoryUsage.heapTotal
    const usedMemory = memoryUsage.heapUsed

    const usedMB = Math.round(usedMemory / 1024 / 1024)
    const totalMB = Math.round(totalMemory / 1024 / 1024)
    const memoryPercentage = (usedMemory / totalMemory) * 100

    // 采用绝对阈值（与系统内存无关）
    const warnMB = Number(process.env.MEM_WARN_MB || 512)
    const failMB = Number(process.env.MEM_FAIL_MB || 1024)

    if (usedMB > failMB) {
      return {
        status: 'fail',
        message: '内存使用过高',
        details: {
          used: `${usedMB}MB`,
          total: `${totalMB}MB`,
          percentage: `${memoryPercentage.toFixed(1)}%`,
          thresholds: { warnMB, failMB },
        },
      }
    } else if (usedMB > warnMB) {
      return {
        status: 'warn',
        message: '内存使用偏高',
        details: {
          used: `${usedMB}MB`,
          total: `${totalMB}MB`,
          percentage: `${memoryPercentage.toFixed(1)}%`,
          thresholds: { warnMB, failMB },
        },
      }
    }

    return {
      status: 'pass',
      message: '内存使用正常',
      details: {
        used: `${usedMB}MB`,
        total: `${totalMB}MB`,
        percentage: `${memoryPercentage.toFixed(1)}%`,
        thresholds: { warnMB, failMB },
      },
    }
  } catch (error) {
    return {
      status: 'fail',
      message: '内存检查失败',
      details: {
        error: error instanceof Error ? error.message : '未知错误',
      },
    }
  }
}

/**
 * 磁盘健康检查（简化版）
 */
async function checkDisk(): Promise<HealthCheck | null> {
  try {
    // 在容器环境中，磁盘检查可能不太准确
    // 这里提供一个基础实现
    const fs = await import('fs/promises')
    const path = await import('path')

    // 检查日志目录是否可写
    const logDir = process.env.LOG_DIR || './logs'
    const resolvedLogDir = path.resolve(process.cwd(), logDir)
    const testFile = path.join(resolvedLogDir, `.health-check-${Date.now()}`)

    // 本地 npm run start 运行态下，日志目录可能尚未由容器挂载或部署脚本预创建。
    // 健康检查应验证“目录可创建且可写”，而不是因为目录尚不存在就直接判定服务不可用。
    await fs.mkdir(resolvedLogDir, { recursive: true })

    await fs.writeFile(testFile, 'health check')
    await fs.unlink(testFile)

    return {
      status: 'pass',
      message: '磁盘访问正常',
    }
  } catch (error) {
    return {
      status: 'fail',
      message: '磁盘访问失败',
      details: {
        error: error instanceof Error ? error.message : '未知错误',
      },
    }
  }
}

/**
 * 获取内存指标
 */
function getMemoryMetrics(): MemoryMetrics {
  const memoryUsage = process.memoryUsage()

  return {
    used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
    percentage: Math.round(
      (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    ),
  }
}

/**
 * 确定整体健康状态
 */
function determineOverallStatus(
  checks: (HealthCheck | null)[]
): OverallHealthStatus {
  const signals = checks
    .filter((check): check is HealthCheck => check !== null)
    .map((check) => check.status)

  return deriveOverallStatusFromSignals(signals)
}
