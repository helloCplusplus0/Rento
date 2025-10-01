/**
 * 智能回退管理系统
 * 提供多层次的错误恢复和回退策略
 */

import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'

/**
 * 回退策略接口
 */
export interface FallbackStrategy {
  name: string
  condition: (error: Error) => boolean
  handler: (context: FallbackContext) => Promise<any>
  priority: number
  maxRetries?: number
}

/**
 * 回退上下文接口
 */
export interface FallbackContext {
  error: Error
  originalFunction?: () => Promise<any>
  retryCount?: number
  retryDelay?: number
  [key: string]: any
}

/**
 * 回退配置接口
 */
export interface FallbackConfig {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
  timeout?: number
}

/**
 * 回退结果接口
 */
export interface FallbackResult {
  success: boolean
  result?: any
  error?: Error
  strategy?: string
  retryCount: number
}

/**
 * 智能回退管理器
 */
export class FallbackManager {
  private static instance: FallbackManager
  private strategies: Map<ErrorType, FallbackStrategy[]> = new Map()
  private logger = ErrorLogger.getInstance()
  private defaultConfig: FallbackConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    timeout: 30000,
  }

  private constructor() {
    this.initializeDefaultStrategies()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): FallbackManager {
    if (!FallbackManager.instance) {
      FallbackManager.instance = new FallbackManager()
    }
    return FallbackManager.instance
  }

  /**
   * 注册回退策略
   */
  registerStrategy(errorType: ErrorType, strategy: FallbackStrategy): void {
    if (!this.strategies.has(errorType)) {
      this.strategies.set(errorType, [])
    }

    const strategies = this.strategies.get(errorType)!
    strategies.push(strategy)

    // 按优先级排序
    strategies.sort((a, b) => a.priority - b.priority)

    this.logger.logInfo(`注册回退策略: ${strategy.name}`, {
      module: 'fallback-manager',
      errorType,
      priority: strategy.priority,
    })
  }

  /**
   * 处理错误并执行回退策略
   */
  async handleError(error: Error, context: any = {}): Promise<FallbackResult> {
    const errorType = this.classifyError(error)
    const strategies = this.strategies.get(errorType) || []

    this.logger.logInfo(`开始执行回退策略`, {
      module: 'fallback-manager',
      errorType,
      strategiesCount: strategies.length,
      error: error.message,
    })

    let retryCount = 0

    for (const strategy of strategies) {
      if (strategy.condition(error)) {
        try {
          const fallbackContext: FallbackContext = {
            ...context,
            error,
            retryCount,
            retryDelay: this.calculateRetryDelay(retryCount),
          }

          this.logger.logInfo(`执行回退策略: ${strategy.name}`, {
            module: 'fallback-manager',
            strategy: strategy.name,
            retryCount,
          })

          const result = await this.executeWithTimeout(
            () => strategy.handler(fallbackContext),
            this.defaultConfig.timeout
          )

          // 记录成功的回退
          this.logger.logInfo(`回退策略执行成功: ${strategy.name}`, {
            module: 'fallback-manager',
            strategy: strategy.name,
            retryCount,
          })

          return {
            success: true,
            result,
            strategy: strategy.name,
            retryCount,
          }
        } catch (fallbackError) {
          retryCount++

          // 记录回退失败
          await this.logger.logError(
            ErrorType.SYSTEM_ERROR,
            ErrorSeverity.MEDIUM,
            `回退策略执行失败: ${strategy.name}`,
            {
              module: 'fallback-manager',
              strategy: strategy.name,
              originalError: error.message,
              fallbackError:
                fallbackError instanceof Error
                  ? fallbackError.message
                  : String(fallbackError),
              retryCount,
            },
            fallbackError instanceof Error ? fallbackError : undefined
          )

          // 检查是否应该重试
          const maxRetries =
            strategy.maxRetries || this.defaultConfig.maxRetries
          if (retryCount < maxRetries && this.shouldRetry(fallbackError)) {
            await this.delay(this.calculateRetryDelay(retryCount))
            continue
          }
        }
      }
    }

    // 所有回退策略都失败
    const finalError = new Error(`所有回退策略都失败: ${error.message}`)

    await this.logger.logError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      '所有回退策略都失败',
      {
        module: 'fallback-manager',
        originalError: error.message,
        strategiesAttempted: strategies.length,
        retryCount,
      },
      finalError
    )

    return {
      success: false,
      error: finalError,
      retryCount,
    }
  }

  /**
   * 初始化默认回退策略
   */
  private initializeDefaultStrategies(): void {
    // 数据库超时重试策略
    this.registerStrategy(ErrorType.DATABASE_ERROR, {
      name: 'database_retry',
      condition: (error) =>
        error.message.includes('timeout') ||
        error.message.includes('connection') ||
        error.message.includes('ECONNRESET'),
      handler: async (context) => {
        await this.delay(context.retryDelay || 1000)
        if (context.originalFunction) {
          return await context.originalFunction()
        }
        throw new Error('无原始函数可重试')
      },
      priority: 1,
      maxRetries: 3,
    })

    // 账单生成聚合失败回退到单独生成
    this.registerStrategy(ErrorType.BILL_GENERATION, {
      name: 'single_bill_fallback',
      condition: (error) =>
        error.message.includes('aggregation') || error.message.includes('聚合'),
      handler: async (context) => {
        // 动态导入避免循环依赖
        const { generateAggregatedUtilityBill } = await import(
          './bill-aggregation'
        )
        return await generateAggregatedUtilityBill(context.readingData, {
          ...context.options,
          strategy: 'SINGLE',
        })
      },
      priority: 2,
    })

    // 数据一致性问题自动修复
    this.registerStrategy(ErrorType.DATA_CONSISTENCY, {
      name: 'auto_repair',
      condition: (error) =>
        error.message.includes('consistency') ||
        error.message.includes('一致性'),
      handler: async (context) => {
        const { repairReadingStatusInconsistencies } = await import(
          './reading-status-sync'
        )
        return await repairReadingStatusInconsistencies()
      },
      priority: 1,
    })

    // 最终回退策略 - 记录错误并通知管理员
    this.registerStrategy(ErrorType.SYSTEM_ERROR, {
      name: 'manual_intervention',
      condition: () => true, // 匹配所有错误
      handler: async (context) => {
        await this.logger.logError(
          ErrorType.SYSTEM_ERROR,
          ErrorSeverity.CRITICAL,
          '需要手动干预',
          {
            module: 'fallback-manager',
            originalError: context.error.message,
            context: JSON.stringify(context, null, 2),
          },
          context.error
        )

        // 这里可以集成通知系统
        // await this.notifyAdministrator(context)

        throw new Error('需要手动干预')
      },
      priority: 999,
    })
  }

  /**
   * 错误分类
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase()

    if (
      message.includes('database') ||
      message.includes('prisma') ||
      message.includes('connection')
    ) {
      return ErrorType.DATABASE_ERROR
    }

    if (message.includes('bill') || message.includes('账单')) {
      return ErrorType.BILL_GENERATION
    }

    if (message.includes('consistency') || message.includes('一致性')) {
      return ErrorType.DATA_CONSISTENCY
    }

    if (message.includes('validation') || message.includes('验证')) {
      return ErrorType.VALIDATION_ERROR
    }

    return ErrorType.SYSTEM_ERROR
  }

  /**
   * 计算重试延迟
   */
  private calculateRetryDelay(retryCount: number): number {
    return (
      this.defaultConfig.retryDelay *
      Math.pow(this.defaultConfig.backoffMultiplier, retryCount)
    )
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: unknown): boolean {
    if (!(error instanceof Error)) return false

    const message = error.message.toLowerCase()

    // 不应该重试的错误类型
    const nonRetryableErrors = [
      'validation',
      'unauthorized',
      'forbidden',
      'not found',
      'bad request',
    ]

    return !nonRetryableErrors.some((pattern) => message.includes(pattern))
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout?: number
  ): Promise<T> {
    if (!timeout) {
      return await fn()
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`操作超时: ${timeout}ms`))
      }, timeout)

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer))
    })
  }

  /**
   * 获取回退统计信息
   */
  getStats(): {
    totalStrategies: number
    strategiesByType: Record<ErrorType, number>
  } {
    const totalStrategies = Array.from(this.strategies.values()).reduce(
      (sum, strategies) => sum + strategies.length,
      0
    )

    const strategiesByType = Object.values(ErrorType).reduce(
      (acc, type) => {
        acc[type] = this.strategies.get(type)?.length || 0
        return acc
      },
      {} as Record<ErrorType, number>
    )

    return {
      totalStrategies,
      strategiesByType,
    }
  }
}

/**
 * 全局回退管理器实例
 */
export const fallbackManager = FallbackManager.getInstance()

/**
 * 带回退的函数装饰器
 */
export function withFallback(errorType: ErrorType) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args)
      } catch (error) {
        const result = await fallbackManager.handleError(
          error instanceof Error ? error : new Error(String(error)),
          {
            originalFunction: () => method.apply(this, args),
            args,
          }
        )

        if (result.success) {
          return result.result
        } else {
          throw result.error
        }
      }
    }

    return descriptor
  }
}
