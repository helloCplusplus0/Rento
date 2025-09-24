/**
 * 结构化错误日志系统
 * 提供统一的错误记录、分类和管理功能
 */

/**
 * 错误类型枚举
 */
export enum ErrorType {
  BILL_GENERATION = 'BILL_GENERATION',
  DATA_CONSISTENCY = 'DATA_CONSISTENCY',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

/**
 * 错误严重程度枚举
 */
export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',  // 系统无法正常工作
  HIGH = 'HIGH',          // 核心功能受影响
  MEDIUM = 'MEDIUM',      // 部分功能受影响
  LOW = 'LOW'             // 轻微影响
}

/**
 * 结构化错误记录接口
 */
export interface ErrorRecord {
  id: string
  timestamp: Date
  type: ErrorType
  severity: ErrorSeverity
  message: string
  context: {
    module: string
    function: string
    userId?: string
    contractId?: string
    billId?: string
    [key: string]: any
  }
  stack?: string
  metadata?: Record<string, any>
}

/**
 * 日志级别枚举
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

/**
 * 错误日志管理器
 * 单例模式，提供全局统一的错误日志记录
 */
export class ErrorLogger {
  private static instance: ErrorLogger
  private errorStore: ErrorRecord[] = []
  private maxStoreSize = 1000 // 最大存储错误数量
  private alertCallbacks: ((error: ErrorRecord) => void)[] = []

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * 记录错误
   */
  async logError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    context: any,
    error?: Error
  ): Promise<void> {
    const errorRecord: ErrorRecord = {
      id: this.generateId(),
      timestamp: new Date(),
      type,
      severity,
      message,
      context: {
        module: context.module || 'unknown',
        function: context.function || 'unknown',
        ...context
      },
      stack: error?.stack,
      metadata: this.extractMetadata(error)
    }

    // 存储错误记录
    this.storeError(errorRecord)

    // 控制台输出
    this.logToConsole(errorRecord)

    // 关键错误触发告警
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
      this.triggerAlert(errorRecord)
    }
  }

  /**
   * 记录警告
   */
  async logWarning(message: string, context: any): Promise<void> {
    await this.logError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.MEDIUM,
      message,
      context
    )
  }

  /**
   * 记录信息
   */
  logInfo(message: string, context: any): void {
    const logEntry = {
      level: LogLevel.INFO,
      timestamp: new Date(),
      message,
      context
    }

    console.log(`[${logEntry.level}] ${logEntry.timestamp.toISOString()} - ${message}`, context)
  }

  /**
   * 记录调试信息
   */
  logDebug(message: string, context: any): void {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = {
        level: LogLevel.DEBUG,
        timestamp: new Date(),
        message,
        context
      }

      console.debug(`[${logEntry.level}] ${logEntry.timestamp.toISOString()} - ${message}`, context)
    }
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    total: number
    bySeverity: Record<ErrorSeverity, number>
    byType: Record<ErrorType, number>
    recent24h: number
  } {
    const now = Date.now()
    const last24h = now - 24 * 60 * 60 * 1000

    const bySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = this.errorStore.filter(e => e.severity === severity).length
      return acc
    }, {} as Record<ErrorSeverity, number>)

    const byType = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = this.errorStore.filter(e => e.type === type).length
      return acc
    }, {} as Record<ErrorType, number>)

    const recent24h = this.errorStore.filter(e => 
      e.timestamp.getTime() > last24h
    ).length

    return {
      total: this.errorStore.length,
      bySeverity,
      byType,
      recent24h
    }
  }

  /**
   * 获取最近的错误记录
   */
  getRecentErrors(limit = 50): ErrorRecord[] {
    return this.errorStore
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * 清理旧的错误记录
   */
  cleanup(): void {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000 // 保留7天
    this.errorStore = this.errorStore.filter(e => 
      e.timestamp.getTime() > cutoff
    )
  }

  /**
   * 注册告警回调
   */
  onAlert(callback: (error: ErrorRecord) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * 存储错误记录
   */
  private storeError(errorRecord: ErrorRecord): void {
    this.errorStore.push(errorRecord)

    // 限制存储大小
    if (this.errorStore.length > this.maxStoreSize) {
      this.errorStore = this.errorStore.slice(-this.maxStoreSize)
    }
  }

  /**
   * 控制台输出
   */
  private logToConsole(errorRecord: ErrorRecord): void {
    const prefix = `[${errorRecord.severity}] ${errorRecord.timestamp.toISOString()}`
    const message = `${prefix} - ${errorRecord.type}: ${errorRecord.message}`

    switch (errorRecord.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(message, {
          context: errorRecord.context,
          stack: errorRecord.stack
        })
        break
      case ErrorSeverity.MEDIUM:
        console.warn(message, errorRecord.context)
        break
      case ErrorSeverity.LOW:
        console.log(message, errorRecord.context)
        break
    }
  }

  /**
   * 触发告警
   */
  private triggerAlert(errorRecord: ErrorRecord): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(errorRecord)
      } catch (error) {
        // 避免循环调用，直接使用console.error记录告警回调失败
        // 这是error-logger内部的错误，不应该再次调用自身
        console.error('告警回调执行失败:', error)
      }
    })
  }

  /**
   * 提取错误元数据
   */
  private extractMetadata(error?: Error): Record<string, any> | undefined {
    if (!error) return undefined

    return {
      name: error.name,
      message: error.message,
      cause: error.cause,
      // 可以添加更多元数据提取逻辑
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 便捷的错误记录函数
 */
export const logger = ErrorLogger.getInstance()

/**
 * 错误装饰器 - 自动捕获和记录函数错误
 */
export function withErrorLogging(
  type: ErrorType,
  severity: ErrorSeverity,
  module: string
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        await logger.logError(
          type,
          severity,
          `函数 ${propertyName} 执行失败: ${errorMessage}`,
          {
            module,
            function: propertyName,
            args: args.length > 0 ? 'provided' : 'none'
          },
          error instanceof Error ? error : undefined
        )
        throw error
      }
    }

    return descriptor
  }
}