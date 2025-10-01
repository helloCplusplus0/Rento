import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'

/**
 * 统一事务管理器
 * 提供标准化的事务执行、错误处理和重试机制
 */

// 事务配置选项
export interface TransactionOptions {
  maxWait?: number
  timeout?: number
  isolationLevel?: Prisma.TransactionIsolationLevel
  retryAttempts?: number
  retryDelay?: number
}

// 事务结果
export interface TransactionResult<T> {
  success: boolean
  data?: T
  error?: string
  executionTime: number
  retryCount: number
}

// 事务操作类型
export enum TransactionType {
  BILL_GENERATION = 'BILL_GENERATION',
  CONTRACT_CREATION = 'CONTRACT_CREATION',
  METER_READING_BATCH = 'METER_READING_BATCH',
  DATA_REPAIR = 'DATA_REPAIR',
  CASCADE_DELETE = 'CASCADE_DELETE',
  BULK_UPDATE = 'BULK_UPDATE',
}

// 事务上下文
export interface TransactionContext {
  type: TransactionType
  description: string
  startTime: Date
  metadata?: Record<string, any>
}

// Prisma事务客户端类型
export type PrismaTransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

// 事务错误类型
export enum TransactionErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUSINESS_RULE_ERROR = 'BUSINESS_RULE_ERROR',
  CONSTRAINT_ERROR = 'CONSTRAINT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  DEADLOCK_ERROR = 'DEADLOCK_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// 事务错误
export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly type: TransactionErrorType,
    public readonly context?: TransactionContext
  ) {
    super(message)
    this.name = 'TransactionError'
  }
}

/**
 * 统一事务管理器
 */
export class TransactionManager {
  private static instance: TransactionManager

  // 默认事务配置
  private defaultOptions: Required<TransactionOptions> = {
    maxWait: 5000, // 最大等待时间 5秒
    timeout: 10000, // 事务超时时间 10秒
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    retryAttempts: 3, // 重试次数
    retryDelay: 1000, // 重试延迟 1秒
  }

  // 获取单例实例
  static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager()
    }
    return TransactionManager.instance
  }

  /**
   * 执行事务操作
   */
  async executeTransaction<T>(
    operation: (tx: PrismaTransactionClient) => Promise<T>,
    context: Partial<TransactionContext> = {},
    options: Partial<TransactionOptions> = {}
  ): Promise<TransactionResult<T>> {
    const finalOptions = { ...this.defaultOptions, ...options }
    const transactionContext: TransactionContext = {
      type: context.type || TransactionType.BULK_UPDATE,
      description: context.description || 'Unknown transaction',
      startTime: new Date(),
      metadata: context.metadata,
    }

    let retryCount = 0
    const startTime = Date.now()

    while (retryCount <= finalOptions.retryAttempts) {
      try {
        console.log(
          `[事务管理器] 开始执行事务: ${transactionContext.description} (尝试 ${retryCount + 1}/${finalOptions.retryAttempts + 1})`
        )

        const result = await prisma.$transaction(operation, {
          maxWait: finalOptions.maxWait,
          timeout: finalOptions.timeout,
          isolationLevel: finalOptions.isolationLevel,
        })

        const executionTime = Date.now() - startTime
        console.log(
          `[事务管理器] 事务执行成功: ${transactionContext.description} (耗时: ${executionTime}ms)`
        )

        return {
          success: true,
          data: result,
          executionTime,
          retryCount,
        }
      } catch (error) {
        const errorType = this.classifyError(error as Error)
        const shouldRetry = this.shouldRetryError(
          errorType,
          retryCount,
          finalOptions.retryAttempts
        )

        // 使用统一的错误日志记录
        const logger = ErrorLogger.getInstance()
        await logger.logError(
          ErrorType.DATABASE_ERROR,
          ErrorSeverity.HIGH,
          `事务执行失败: ${transactionContext.description}`,
          {
            module: 'TransactionManager',
            function: 'executeTransaction',
            errorType,
            retryCount,
            shouldRetry,
            transactionType: transactionContext.type,
            metadata: transactionContext.metadata,
          },
          error instanceof Error ? error : undefined
        )

        if (shouldRetry) {
          retryCount++
          await this.delay(finalOptions.retryDelay * retryCount) // 指数退避
          continue
        }

        const executionTime = Date.now() - startTime
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unknown transaction error',
          executionTime,
          retryCount,
        }
      }
    }

    // 不应该到达这里
    const executionTime = Date.now() - startTime
    return {
      success: false,
      error: 'Maximum retry attempts exceeded',
      executionTime,
      retryCount,
    }
  }

  /**
   * 错误分类
   */
  private classifyError(error: Error): TransactionErrorType {
    const message = error.message.toLowerCase()

    if (
      message.includes('unique constraint') ||
      message.includes('foreign key constraint')
    ) {
      return TransactionErrorType.CONSTRAINT_ERROR
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return TransactionErrorType.TIMEOUT_ERROR
    }

    if (message.includes('deadlock')) {
      return TransactionErrorType.DEADLOCK_ERROR
    }

    if (message.includes('connection') || message.includes('connect')) {
      return TransactionErrorType.CONNECTION_ERROR
    }

    if (error.name === 'ValidationError') {
      return TransactionErrorType.VALIDATION_ERROR
    }

    if (error.name === 'BusinessRuleError') {
      return TransactionErrorType.BUSINESS_RULE_ERROR
    }

    return TransactionErrorType.UNKNOWN_ERROR
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetryError(
    errorType: TransactionErrorType,
    currentRetryCount: number,
    maxRetries: number
  ): boolean {
    if (currentRetryCount >= maxRetries) {
      return false
    }

    // 可重试的错误类型
    const retryableErrors = [
      TransactionErrorType.TIMEOUT_ERROR,
      TransactionErrorType.DEADLOCK_ERROR,
      TransactionErrorType.CONNECTION_ERROR,
    ]

    return retryableErrors.includes(errorType)
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// 导出单例实例
export const transactionManager = TransactionManager.getInstance()

/**
 * 业务规则错误
 */
export class BusinessRuleError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'BusinessRuleError'
  }
}

/**
 * 数据验证错误
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
