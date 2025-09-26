import { NextRequest, NextResponse } from 'next/server'
import { ErrorLogger, ErrorType, ErrorSeverity } from './error-logger'

/**
 * API响应优化配置接口
 */
export interface ApiOptimizerConfig {
  /** 是否启用响应压缩 */
  enableCompression: boolean
  /** 是否移除null值 */
  removeNullValues: boolean
  /** 是否移除空字符串 */
  removeEmptyStrings: boolean
  /** 是否移除undefined值 */
  removeUndefinedValues: boolean
  /** 最大响应大小（字节），超过则警告 */
  maxResponseSize: number
  /** 是否启用响应时间监控 */
  enableTimingMonitor: boolean
}

/**
 * API性能监控数据接口
 */
export interface ApiPerformanceMetrics {
  endpoint: string
  method: string
  responseTime: number
  responseSize: number
  statusCode: number
  timestamp: Date
  cacheHit?: boolean
  optimizationApplied?: boolean
}

/**
 * API响应优化器
 * 
 * 提供API响应的优化功能，包括：
 * - 数据压缩和清理
 * - 响应时间监控
 * - 性能指标收集
 * - 缓存策略集成
 */
export class ApiOptimizer {
  private static instance: ApiOptimizer
  private logger = ErrorLogger.getInstance()
  private performanceMetrics: ApiPerformanceMetrics[] = []
  private maxMetricsSize = 1000

  private defaultConfig: ApiOptimizerConfig = {
    enableCompression: true,
    removeNullValues: true,
    removeEmptyStrings: true,
    removeUndefinedValues: true,
    maxResponseSize: 1024 * 1024, // 1MB
    enableTimingMonitor: true
  }

  private constructor() {}

  static getInstance(): ApiOptimizer {
    if (!ApiOptimizer.instance) {
      ApiOptimizer.instance = new ApiOptimizer()
    }
    return ApiOptimizer.instance
  }

  /**
   * 优化API响应数据
   * 移除不必要的字段和值，减少传输大小
   */
  optimizeResponse<T>(data: T, config?: Partial<ApiOptimizerConfig>): T {
    const finalConfig = { ...this.defaultConfig, ...config }

    if (!finalConfig.enableCompression) {
      return data
    }

    return this.optimizeValue(data, finalConfig) as T
  }

  /**
   * 递归优化数据值
   */
  private optimizeValue(value: any, config: ApiOptimizerConfig): any {
    if (value === null && config.removeNullValues) {
      return undefined
    }

    if (value === '' && config.removeEmptyStrings) {
      return undefined
    }

    if (value === undefined && config.removeUndefinedValues) {
      return undefined
    }

    if (Array.isArray(value)) {
      return value
        .map(item => this.optimizeValue(item, config))
        .filter(item => item !== undefined)
    }

    if (value && typeof value === 'object' && value.constructor === Object) {
      const optimized: any = {}
      
      for (const [key, val] of Object.entries(value)) {
        const optimizedVal = this.optimizeValue(val, config)
        if (optimizedVal !== undefined) {
          optimized[key] = optimizedVal
        }
      }

      return optimized
    }

    return value
  }

  /**
   * 创建优化的API响应
   */
  createOptimizedResponse<T>(
    data: T,
    options: {
      status?: number
      headers?: Record<string, string>
      config?: Partial<ApiOptimizerConfig>
      cacheHit?: boolean
    } = {}
  ): NextResponse {
    const { status = 200, headers = {}, config, cacheHit = false } = options

    // 优化数据
    const optimizedData = this.optimizeResponse(data, config)

    // 计算响应大小
    const responseString = JSON.stringify(optimizedData)
    const responseSize = new Blob([responseString]).size

    // 检查响应大小
    const finalConfig = { ...this.defaultConfig, ...config }
    if (responseSize > finalConfig.maxResponseSize) {
      this.logger.logWarning('Large API response detected', {
        responseSize,
        maxSize: finalConfig.maxResponseSize,
        endpoint: 'unknown'
      })
    }

    // 设置响应头
    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Response-Size': responseSize.toString(),
      'X-Optimized': 'true',
      ...headers
    }

    if (cacheHit) {
      responseHeaders['X-Cache'] = 'HIT'
    }

    return NextResponse.json(optimizedData, {
      status,
      headers: responseHeaders
    })
  }

  /**
   * API性能监控中间件
   */
  withPerformanceMonitoring<T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>,
    endpoint: string
  ) {
    return async (...args: T): Promise<NextResponse> => {
      const startTime = Date.now()
      const request = args[0] as NextRequest
      
      try {
        const response = await handler(...args)
        const endTime = Date.now()
        const responseTime = endTime - startTime

        // 记录性能指标
        if (this.defaultConfig.enableTimingMonitor) {
          this.recordPerformanceMetrics({
            endpoint,
            method: request.method,
            responseTime,
            responseSize: this.getResponseSize(response),
            statusCode: response.status,
            timestamp: new Date(),
            cacheHit: response.headers.get('X-Cache') === 'HIT',
            optimizationApplied: response.headers.get('X-Optimized') === 'true'
          })
        }

        // 添加性能头
        response.headers.set('X-Response-Time', `${responseTime}ms`)

        return response
      } catch (error) {
        const endTime = Date.now()
        const responseTime = endTime - startTime

        // 记录错误性能指标
        this.recordPerformanceMetrics({
          endpoint,
          method: request.method,
          responseTime,
          responseSize: 0,
          statusCode: 500,
          timestamp: new Date(),
          cacheHit: false,
          optimizationApplied: false
        })

        throw error
      }
    }
  }

  /**
   * 记录性能指标
   */
  private recordPerformanceMetrics(metrics: ApiPerformanceMetrics): void {
    this.performanceMetrics.push(metrics)

    // 限制指标数量
    if (this.performanceMetrics.length > this.maxMetricsSize) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsSize)
    }

    // 记录慢查询
    if (metrics.responseTime > 1000) {
      this.logger.logWarning('Slow API response detected', {
        endpoint: metrics.endpoint,
        responseTime: metrics.responseTime,
        method: metrics.method
      })
    }
  }

  /**
   * 获取响应大小
   */
  private getResponseSize(response: NextResponse): number {
    const sizeHeader = response.headers.get('X-Response-Size')
    return sizeHeader ? parseInt(sizeHeader, 10) : 0
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): {
    totalRequests: number
    averageResponseTime: number
    slowRequests: number
    cacheHitRate: number
    optimizationRate: number
    endpointStats: Record<string, {
      count: number
      averageTime: number
      averageSize: number
    }>
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        cacheHitRate: 0,
        optimizationRate: 0,
        endpointStats: {}
      }
    }

    const totalRequests = this.performanceMetrics.length
    const averageResponseTime = this.performanceMetrics.reduce(
      (sum, metric) => sum + metric.responseTime, 0
    ) / totalRequests

    const slowRequests = this.performanceMetrics.filter(
      metric => metric.responseTime > 1000
    ).length

    const cacheHits = this.performanceMetrics.filter(
      metric => metric.cacheHit
    ).length

    const optimizedResponses = this.performanceMetrics.filter(
      metric => metric.optimizationApplied
    ).length

    // 按端点统计
    const endpointStats: Record<string, {
      count: number
      averageTime: number
      averageSize: number
    }> = {}

    this.performanceMetrics.forEach(metric => {
      if (!endpointStats[metric.endpoint]) {
        endpointStats[metric.endpoint] = {
          count: 0,
          averageTime: 0,
          averageSize: 0
        }
      }

      const stats = endpointStats[metric.endpoint]
      stats.count++
      stats.averageTime = (stats.averageTime * (stats.count - 1) + metric.responseTime) / stats.count
      stats.averageSize = (stats.averageSize * (stats.count - 1) + metric.responseSize) / stats.count
    })

    return {
      totalRequests,
      averageResponseTime,
      slowRequests,
      cacheHitRate: cacheHits / totalRequests,
      optimizationRate: optimizedResponses / totalRequests,
      endpointStats
    }
  }

  /**
   * 清理性能指标
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics = []
  }

  /**
   * 获取最近的性能指标
   */
  getRecentMetrics(limit: number = 50): ApiPerformanceMetrics[] {
    return this.performanceMetrics
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
}

/**
 * API缓存中间件
 * 为API端点提供缓存功能
 */
export function withApiCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    ttl?: number
    keyGenerator?: (req: NextRequest) => string
    skipCache?: (req: NextRequest) => boolean
  } = {}
) {
  const { ttl = 5 * 60 * 1000, keyGenerator, skipCache } = options
  const cache = new Map<string, { data: any; timestamp: number }>()

  return async (req: NextRequest): Promise<NextResponse> => {
    // 检查是否跳过缓存
    if (skipCache && skipCache(req)) {
      return handler(req)
    }

    // 生成缓存键
    const cacheKey = keyGenerator ? keyGenerator(req) : req.url

    // 检查缓存
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < ttl) {
      return ApiOptimizer.getInstance().createOptimizedResponse(cached.data, {
        cacheHit: true
      })
    }

    // 执行处理器
    const response = await handler(req)
    const data = await response.json()

    // 存储到缓存
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return ApiOptimizer.getInstance().createOptimizedResponse(data, {
      status: response.status
    })
  }
}

/**
 * 批量API优化中间件
 * 为多个API端点提供统一的优化
 */
export function withBatchOptimization(
  handlers: Record<string, (req: NextRequest) => Promise<NextResponse>>,
  config?: Partial<ApiOptimizerConfig>
) {
  const optimizer = ApiOptimizer.getInstance()

  const optimizedHandlers: Record<string, (req: NextRequest) => Promise<NextResponse>> = {}

  Object.entries(handlers).forEach(([endpoint, handler]) => {
    optimizedHandlers[endpoint] = optimizer.withPerformanceMonitoring(
      async (req: NextRequest) => {
        const response = await handler(req)
        const data = await response.json()
        
        return optimizer.createOptimizedResponse(data, {
          status: response.status,
          config
        })
      },
      endpoint
    )
  })

  return optimizedHandlers
}

// 导出单例实例
export const apiOptimizer = ApiOptimizer.getInstance()
export default apiOptimizer