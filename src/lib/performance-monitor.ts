import { NextRequest, NextResponse } from 'next/server'

import { errorTracker } from './error-tracker'
import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'
import {
  getMaxPerformanceMetrics,
  getSlowRequestThresholdMs,
} from './observability'

export interface PerformanceMetrics {
  path: string
  method: string
  duration: number
  statusCode: number
  timestamp: Date
  userAgent?: string
  ip?: string
  userId?: string
  memoryUsage?: {
    heapUsed: number
    heapTotal: number
  }
}

export interface PerformanceStats {
  totalRequests: number
  averageResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  slowRequests: number
  errorRate: number
  slowRequestThresholdMs: number
  sampleSize: number
  requestsByPath: Record<string, number>
  requestsByStatus: Record<number, number>
}

/**
 * 性能监控系统
 * 记录和分析API请求的性能指标
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics: number
  private slowRequestThreshold: number
  private logger = ErrorLogger.getInstance()

  constructor() {
    this.maxMetrics = getMaxPerformanceMetrics()
    this.slowRequestThreshold = getSlowRequestThresholdMs()
  }

  /**
   * 记录请求性能指标
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric)

    // 保持最近N条记录
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // 慢请求告警
    if (metric.duration > this.slowRequestThreshold) {
      this.handleSlowRequest(metric)
    }

    // 错误请求记录
    if (metric.statusCode >= 500) {
      this.handleErrorRequest(metric)
    }
  }

  /**
   * 创建性能监控中间件
   */
  createMiddleware() {
    return async (request: NextRequest, response: NextResponse) => {
      const startTime = Date.now()
      const startMemory = process.memoryUsage()

      // 获取请求信息
      const path = new URL(request.url).pathname
      const method = request.method
      const userAgent = request.headers.get('user-agent') || undefined
      const ip = this.getClientIP(request)

      try {
        // 继续处理请求
        const result = response

        // 记录性能指标
        const endTime = Date.now()
        const endMemory = process.memoryUsage()

        const metric: PerformanceMetrics = {
          path,
          method,
          duration: endTime - startTime,
          statusCode: result.status,
          timestamp: new Date(),
          userAgent,
          ip,
          memoryUsage: {
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal,
          },
        }

        this.recordMetric(metric)

        return result
      } catch (error) {
        // 记录错误请求
        const metric: PerformanceMetrics = {
          path,
          method,
          duration: Date.now() - startTime,
          statusCode: 500,
          timestamp: new Date(),
          userAgent,
          ip,
        }

        this.recordMetric(metric)
        throw error
      }
    }
  }

  /**
   * 获取性能统计
   */
  getStats(timeRange?: { start: Date; end: Date }): PerformanceStats {
    let filteredMetrics = this.metrics

    // 时间范围过滤
    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    if (filteredMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        slowRequestThresholdMs: this.slowRequestThreshold,
        sampleSize: 0,
        requestsByPath: {},
        requestsByStatus: {},
      }
    }

    const durations = filteredMetrics.map((m) => m.duration)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const maxDuration = Math.max(...durations)
    const minDuration = Math.min(...durations)
    const slowRequests = filteredMetrics.filter(
      (m) => m.duration > this.slowRequestThreshold
    ).length
    const errorRequests = filteredMetrics.filter(
      (m) => m.statusCode >= 500
    ).length

    // 按路径统计
    const requestsByPath: Record<string, number> = {}
    filteredMetrics.forEach((m) => {
      requestsByPath[m.path] = (requestsByPath[m.path] || 0) + 1
    })

    // 按状态码统计
    const requestsByStatus: Record<number, number> = {}
    filteredMetrics.forEach((m) => {
      requestsByStatus[m.statusCode] = (requestsByStatus[m.statusCode] || 0) + 1
    })

    return {
      totalRequests: filteredMetrics.length,
      averageResponseTime: Math.round(avgDuration),
      maxResponseTime: maxDuration,
      minResponseTime: minDuration,
      slowRequests,
      errorRate: Math.round((errorRequests / filteredMetrics.length) * 100),
      slowRequestThresholdMs: this.slowRequestThreshold,
      sampleSize: filteredMetrics.length,
      requestsByPath,
      requestsByStatus,
    }
  }

  /**
   * 返回当前阶段用于问题定位的最小性能指标集合。
   */
  getSnapshot() {
    const stats = this.getStats()

    return {
      totalRequests: stats.totalRequests,
      averageResponseTimeMs: stats.averageResponseTime,
      maxResponseTimeMs: stats.maxResponseTime,
      slowRequests: stats.slowRequests,
      slowRequestThresholdMs: stats.slowRequestThresholdMs,
      errorRatePercent: stats.errorRate,
      sampleSize: stats.sampleSize,
      errorRateDefinition: '5xx requests / total requests in current process sample',
    }
  }

  /**
   * 获取最近的慢请求
   */
  getSlowRequests(limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter((m) => m.duration > this.slowRequestThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * 获取错误请求
   */
  getErrorRequests(limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter((m) => m.statusCode >= 400)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * 获取热门路径
   */
  getPopularPaths(
    limit: number = 10
  ): Array<{ path: string; count: number; avgDuration: number }> {
    const pathStats = new Map<
      string,
      { count: number; totalDuration: number }
    >()

    this.metrics.forEach((metric) => {
      const existing = pathStats.get(metric.path) || {
        count: 0,
        totalDuration: 0,
      }
      pathStats.set(metric.path, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + metric.duration,
      })
    })

    return Array.from(pathStats.entries())
      .map(([path, stats]) => ({
        path,
        count: stats.count,
        avgDuration: Math.round(stats.totalDuration / stats.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * 清理旧指标
   */
  cleanup(olderThan: Date): number {
    const initialLength = this.metrics.length
    this.metrics = this.metrics.filter((m) => m.timestamp > olderThan)
    return initialLength - this.metrics.length
  }

  /**
   * 处理慢请求
   */
  private async handleSlowRequest(metric: PerformanceMetrics): Promise<void> {
    console.warn(
      `Slow request detected: ${metric.method} ${metric.path} - ${metric.duration}ms`
    )

    // ErrorLogger 是当前阶段的统一错误日志主线；error-tracker 仅保留为文件型兼容日志。
    await this.logger.logWarning(
      `慢请求检测: ${metric.method} ${metric.path}`,
      {
        module: 'performance-monitor',
        function: 'handleSlowRequest',
        duration: metric.duration,
        threshold: this.slowRequestThreshold,
        path: metric.path,
        method: metric.method,
        statusCode: metric.statusCode,
        userAgent: metric.userAgent,
        ip: metric.ip,
      }
    )

    await errorTracker.logWarning(`慢请求兼容日志: ${metric.method} ${metric.path}`, {
      duration: metric.duration,
      threshold: this.slowRequestThreshold,
      path: metric.path,
      method: metric.method,
      statusCode: metric.statusCode,
    })
  }

  /**
   * 处理错误请求
   */
  private async handleErrorRequest(metric: PerformanceMetrics): Promise<void> {
    await this.logger.logError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      `HTTP错误: ${metric.statusCode} ${metric.method} ${metric.path}`,
      {
        module: 'performance-monitor',
        function: 'handleErrorRequest',
        path: metric.path,
        method: metric.method,
        statusCode: metric.statusCode,
        duration: metric.duration,
        userAgent: metric.userAgent,
        ip: metric.ip,
        memoryUsage: metric.memoryUsage,
      }
    )

    await errorTracker.logError({
      id: `perf-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: metric.timestamp,
      level: 'error',
      message: `HTTP错误: ${metric.statusCode} ${metric.method} ${metric.path}`,
      context: {
        path: metric.path,
        method: metric.method,
        statusCode: metric.statusCode,
        duration: metric.duration,
        userAgent: metric.userAgent,
        ip: metric.ip,
        memoryUsage: metric.memoryUsage,
      },
    })
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIP(request: NextRequest): string | undefined {
    // 尝试从各种头部获取真实IP
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }

    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    if (cfConnectingIP) {
      return cfConnectingIP
    }

    // 从请求对象获取IP（在某些环境中可能不可用）
    return undefined
  }
}

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor()

/**
 * Next.js中间件包装器
 * 这是显式接入的兼容能力；当前阶段的主采集入口是 withApiErrorHandler。
 */
export function withPerformanceMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: { path: string; method: string }
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    const startMemory = process.memoryUsage()

    try {
      const result = await handler(...args)

      // 记录成功请求
      const metric: PerformanceMetrics = {
        path: context.path,
        method: context.method,
        duration: Date.now() - startTime,
        statusCode: 200,
        timestamp: new Date(),
        memoryUsage: {
          heapUsed: process.memoryUsage().heapUsed - startMemory.heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
        },
      }

      performanceMonitor.recordMetric(metric)
      return result
    } catch (error) {
      // 记录错误请求
      const metric: PerformanceMetrics = {
        path: context.path,
        method: context.method,
        duration: Date.now() - startTime,
        statusCode: 500,
        timestamp: new Date(),
        memoryUsage: {
          heapUsed: process.memoryUsage().heapUsed - startMemory.heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
        },
      }

      performanceMonitor.recordMetric(metric)
      throw error
    }
  }
}
