/**
 * 系统健康监控器
 * 提供系统健康状态检查和监控功能
 */

import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'
import { prisma } from './prisma'

/**
 * 健康检查状态枚举
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * 健康检查项目接口
 */
export interface HealthCheck {
  name: string
  status: HealthStatus
  lastCheck: Date
  responseTime: number
  details?: Record<string, any>
  error?: string
}

/**
 * 系统健康状态接口
 */
export interface SystemHealth {
  overall: HealthStatus
  checks: HealthCheck[]
  uptime: number
  version: string
  timestamp: Date
}

/**
 * 系统健康检查器
 */
export class SystemHealthChecker {
  private logger = ErrorLogger.getInstance()
  private startTime = Date.now()

  /**
   * 检查系统整体健康状态
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabaseConnection(),
      this.checkBillSystemHealth(),
      this.checkDataConsistency(),
      this.checkErrorRate(),
      this.checkPerformance(),
    ])

    const overallStatus = this.determineOverallStatus(checks)

    return {
      overall: overallStatus,
      checks,
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date(),
    }
  }

  /**
   * 检查数据库连接
   */
  private async checkDatabaseConnection(): Promise<HealthCheck> {
    const startTime = Date.now()

    try {
      await prisma.$queryRaw`SELECT 1`

      return {
        name: 'database_connection',
        status: HealthStatus.HEALTHY,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          provider: 'sqlite',
          connected: true,
        },
      }
    } catch (error) {
      await this.logger.logError(
        ErrorType.DATABASE_ERROR,
        ErrorSeverity.CRITICAL,
        '数据库连接检查失败',
        { module: 'health-checker', function: 'checkDatabaseConnection' },
        error instanceof Error ? error : undefined
      )

      return {
        name: 'database_connection',
        status: HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 检查账单系统健康状态
   */
  private async checkBillSystemHealth(): Promise<HealthCheck> {
    const startTime = Date.now()

    try {
      // 检查最近24小时的账单生成情况
      const recentBills = await prisma.bill.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      })

      // 检查失败的账单生成 - 移除FAILED状态检查，因为数据库中没有此状态
      // 改为检查其他异常情况
      const problemBills = await prisma.bill.count({
        where: {
          OR: [
            {
              // 检查金额异常的账单
              amount: { lte: 0 },
            },
            {
              // 检查水电费账单但没有明细的情况
              type: 'UTILITIES',
              billDetails: { none: {} },
            },
          ],
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      })

      const successRate =
        recentBills > 0 ? (recentBills - problemBills) / recentBills : 1
      let status = HealthStatus.HEALTHY

      if (successRate < 0.9) {
        status = HealthStatus.DEGRADED
      }
      if (successRate < 0.7) {
        status = HealthStatus.UNHEALTHY
      }

      return {
        name: 'bill_system',
        status,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          recentBillCount: recentBills,
          problemBillCount: problemBills,
          successRate: Math.round(successRate * 100) / 100,
        },
      }
    } catch (error) {
      return {
        name: 'bill_system',
        status: HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 检查数据一致性
   */
  private async checkDataConsistency(): Promise<HealthCheck> {
    const startTime = Date.now()

    try {
      // 检查账单和明细的一致性
      const billsWithoutDetails = await prisma.bill.count({
        where: {
          type: 'UTILITIES',
          billDetails: { none: {} },
        },
      })

      // 检查抄表状态一致性
      const inconsistentReadings = await prisma.meterReading.count({
        where: {
          OR: [
            {
              status: 'BILLED',
              isBilled: false,
            },
            {
              status: 'PENDING',
              isBilled: true,
            },
          ],
        },
      })

      const totalIssues = billsWithoutDetails + inconsistentReadings
      let status = HealthStatus.HEALTHY

      if (totalIssues > 0 && totalIssues <= 5) {
        status = HealthStatus.DEGRADED
      }
      if (totalIssues > 5) {
        status = HealthStatus.UNHEALTHY
      }

      return {
        name: 'data_consistency',
        status,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          billsWithoutDetails,
          inconsistentReadings,
          totalIssues,
        },
      }
    } catch (error) {
      return {
        name: 'data_consistency',
        status: HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 检查错误率
   */
  private async checkErrorRate(): Promise<HealthCheck> {
    const startTime = Date.now()

    try {
      const errorStats = this.logger.getErrorStats()
      const errorRate = errorStats.recent24h / Math.max(1, errorStats.total)

      let status = HealthStatus.HEALTHY

      if (errorRate > 0.05) {
        // 5%错误率
        status = HealthStatus.DEGRADED
      }
      if (errorRate > 0.1) {
        // 10%错误率
        status = HealthStatus.UNHEALTHY
      }

      return {
        name: 'error_rate',
        status,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          totalErrors: errorStats.total,
          recent24hErrors: errorStats.recent24h,
          errorRate: Math.round(errorRate * 10000) / 100, // 百分比
          bySeverity: errorStats.bySeverity,
        },
      }
    } catch (error) {
      return {
        name: 'error_rate',
        status: HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 检查性能指标
   */
  private async checkPerformance(): Promise<HealthCheck> {
    const startTime = Date.now()

    try {
      // 检查数据库查询性能
      const queryStart = Date.now()
      await prisma.bill.findFirst()
      const queryTime = Date.now() - queryStart

      // 检查内存使用情况
      const memoryUsage = process.memoryUsage()
      const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)

      let status = HealthStatus.HEALTHY

      if (queryTime > 1000 || memoryUsageMB > 512) {
        status = HealthStatus.DEGRADED
      }
      if (queryTime > 3000 || memoryUsageMB > 1024) {
        status = HealthStatus.UNHEALTHY
      }

      return {
        name: 'performance',
        status,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          queryResponseTime: queryTime,
          memoryUsageMB,
          uptime: Date.now() - this.startTime,
        },
      }
    } catch (error) {
      return {
        name: 'performance',
        status: HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 确定整体健康状态
   */
  private determineOverallStatus(checks: HealthCheck[]): HealthStatus {
    const unhealthyCount = checks.filter(
      (c) => c.status === HealthStatus.UNHEALTHY
    ).length
    const degradedCount = checks.filter(
      (c) => c.status === HealthStatus.DEGRADED
    ).length

    if (unhealthyCount > 0) {
      return HealthStatus.UNHEALTHY
    }
    if (degradedCount > 1) {
      return HealthStatus.DEGRADED
    }
    if (degradedCount === 1) {
      return HealthStatus.DEGRADED
    }

    return HealthStatus.HEALTHY
  }
}

/**
 * 账单系统专用健康检查器
 */
export class BillSystemHealthChecker {
  private logger = ErrorLogger.getInstance()

  /**
   * 检查账单系统健康状态
   */
  async checkBillSystemHealth(): Promise<HealthCheck> {
    const startTime = Date.now()

    try {
      const checks = await Promise.all([
        this.checkRecentBillGeneration(),
        this.checkBillDataIntegrity(),
        this.checkMeterReadingStatus(),
        this.checkBillProcessingQueue(),
      ])

      const overallStatus = this.determineOverallStatus(checks)

      return {
        name: 'bill_system_detailed',
        status: overallStatus,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          checks: checks.reduce(
            (acc, check) => {
              acc[check.name] = {
                status: check.status,
                details: check.details,
                error: check.error,
              }
              return acc
            },
            {} as Record<string, any>
          ),
        },
      }
    } catch (error) {
      return {
        name: 'bill_system_detailed',
        status: HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 检查最近账单生成情况
   */
  private async checkRecentBillGeneration(): Promise<HealthCheck> {
    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const recentBills = await prisma.bill.count({
        where: { createdAt: { gte: last24h } },
      })

      const recentUtilityBills = await prisma.bill.count({
        where: {
          type: 'UTILITIES',
          createdAt: { gte: last24h },
        },
      })

      return {
        name: 'recent_bill_generation',
        status: recentBills > 0 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        lastCheck: new Date(),
        responseTime: 0,
        details: {
          totalRecentBills: recentBills,
          recentUtilityBills,
          lastBillTime: await this.getLastBillTime(),
        },
      }
    } catch (error) {
      return {
        name: 'recent_bill_generation',
        status: HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: 0,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 检查账单数据完整性
   */
  private async checkBillDataIntegrity(): Promise<HealthCheck> {
    try {
      const utilityBillsWithoutDetails = await prisma.bill.count({
        where: {
          type: 'UTILITIES',
          billDetails: { none: {} },
        },
      })

      const billsWithInconsistentAmounts = await prisma.bill.count({
        where: {
          amount: { not: { equals: prisma.bill.fields.pendingAmount } },
        },
      })

      const totalIssues =
        utilityBillsWithoutDetails + billsWithInconsistentAmounts

      return {
        name: 'bill_data_integrity',
        status:
          totalIssues === 0
            ? HealthStatus.HEALTHY
            : totalIssues <= 3
              ? HealthStatus.DEGRADED
              : HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: 0,
        details: {
          utilityBillsWithoutDetails,
          billsWithInconsistentAmounts,
          totalIssues,
        },
      }
    } catch (error) {
      return {
        name: 'bill_data_integrity',
        status: HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: 0,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 检查抄表记录状态
   */
  private async checkMeterReadingStatus(): Promise<HealthCheck> {
    try {
      const pendingReadings = await prisma.meterReading.count({
        where: { status: 'PENDING' },
      })

      const inconsistentReadings = await prisma.meterReading.count({
        where: {
          OR: [
            { status: 'BILLED', isBilled: false },
            { status: 'PENDING', isBilled: true },
          ],
        },
      })

      return {
        name: 'meter_reading_status',
        status:
          inconsistentReadings === 0
            ? HealthStatus.HEALTHY
            : inconsistentReadings <= 2
              ? HealthStatus.DEGRADED
              : HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: 0,
        details: {
          pendingReadings,
          inconsistentReadings,
        },
      }
    } catch (error) {
      return {
        name: 'meter_reading_status',
        status: HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: 0,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 检查账单处理队列
   */
  private async checkBillProcessingQueue(): Promise<HealthCheck> {
    try {
      // 检查是否有长时间未处理的抄表记录
      const oldPendingReadings = await prisma.meterReading.count({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
          },
        },
      })

      return {
        name: 'bill_processing_queue',
        status:
          oldPendingReadings === 0
            ? HealthStatus.HEALTHY
            : oldPendingReadings <= 5
              ? HealthStatus.DEGRADED
              : HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: 0,
        details: {
          oldPendingReadings,
          queueBacklog: oldPendingReadings > 0,
        },
      }
    } catch (error) {
      return {
        name: 'bill_processing_queue',
        status: HealthStatus.UNHEALTHY,
        lastCheck: new Date(),
        responseTime: 0,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 获取最后一个账单的时间
   */
  private async getLastBillTime(): Promise<string | null> {
    try {
      const lastBill = await prisma.bill.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })

      return lastBill ? lastBill.createdAt.toISOString() : null
    } catch {
      return null
    }
  }

  /**
   * 确定整体状态
   */
  private determineOverallStatus(checks: HealthCheck[]): HealthStatus {
    const unhealthyCount = checks.filter(
      (c) => c.status === HealthStatus.UNHEALTHY
    ).length
    const degradedCount = checks.filter(
      (c) => c.status === HealthStatus.DEGRADED
    ).length

    if (unhealthyCount > 0) {
      return HealthStatus.UNHEALTHY
    }
    if (degradedCount > 1) {
      return HealthStatus.DEGRADED
    }

    return HealthStatus.HEALTHY
  }
}

/**
 * 全局健康检查器实例
 */
export const systemHealthChecker = new SystemHealthChecker()
export const billSystemHealthChecker = new BillSystemHealthChecker()
