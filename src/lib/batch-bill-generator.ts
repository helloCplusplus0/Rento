import { generateUtilityBillOnReading } from './auto-bill-generator'
import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'
import { prisma } from './prisma'
import { transactionManager, TransactionType } from './transaction-manager'

/**
 * 批量账单生成结果接口
 */
export interface BatchBillGenerationResult {
  success: number
  failed: number
  skipped: number
  errors: Array<{
    readingId: string
    error: string
  }>
  duration: number
  totalProcessed: number
}

/**
 * 批量账单生成选项
 */
export interface BatchGenerationOptions {
  batchSize?: number // 批处理大小，默认50
  maxConcurrent?: number // 最大并发数，默认5
  skipExisting?: boolean // 跳过已有账单的抄表记录，默认true
  dryRun?: boolean // 仅预览不实际生成，默认false
  onProgress?: (progress: {
    processed: number
    total: number
    current: string
  }) => void
}

/**
 * 批量账单生成器
 * 优化批量抄表的账单生成性能
 */
export class BatchBillGenerator {
  private readonly DEFAULT_BATCH_SIZE = 50
  private readonly DEFAULT_MAX_CONCURRENT = 5
  private readonly logger = ErrorLogger.getInstance()

  /**
   * 批量生成水电费账单
   */
  async generateUtilityBillsBatch(
    readingIds: string[],
    options: BatchGenerationOptions = {}
  ): Promise<BatchBillGenerationResult> {
    const startTime = Date.now()
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      maxConcurrent = this.DEFAULT_MAX_CONCURRENT,
      skipExisting = true,
      dryRun = false,
      onProgress,
    } = options

    const result: BatchBillGenerationResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      duration: 0,
      totalProcessed: 0,
    }

    try {
      // 记录开始日志
      await this.logger.logInfo('批量账单生成开始', {
        module: 'BatchBillGenerator',
        function: 'generateUtilityBillsBatch',
        totalReadings: readingIds.length,
        batchSize,
        maxConcurrent,
        dryRun,
      })

      // 预处理：过滤已有账单的抄表记录
      let validReadingIds = readingIds
      if (skipExisting) {
        validReadingIds = await this.filterExistingBills(readingIds)
        result.skipped = readingIds.length - validReadingIds.length
      }

      if (validReadingIds.length === 0) {
        await this.logger.logInfo('无需处理的抄表记录', {
          module: 'BatchBillGenerator',
          totalReadings: readingIds.length,
          skipped: result.skipped,
        })
        result.duration = Date.now() - startTime
        return result
      }

      // 分批处理
      const batches = this.chunkArray(validReadingIds, batchSize)
      let processedCount = 0

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]

        try {
          // 报告进度
          if (onProgress) {
            onProgress({
              processed: processedCount,
              total: validReadingIds.length,
              current: `处理批次 ${i + 1}/${batches.length}`,
            })
          }

          // 并发处理批次内的账单生成
          const batchResult = await this.processBatch(
            batch,
            maxConcurrent,
            dryRun
          )

          // 累计结果
          result.success += batchResult.success
          result.failed += batchResult.failed
          result.errors.push(...batchResult.errors)

          processedCount += batch.length
          result.totalProcessed = processedCount

          // 批次间短暂延迟，避免数据库压力过大
          if (i < batches.length - 1) {
            await this.delay(100)
          }
        } catch (error) {
          // 整个批次失败
          result.failed += batch.length
          result.errors.push(
            ...batch.map((readingId) => ({
              readingId,
              error: `批次处理失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }))
          )

          await this.logger.logError(
            ErrorType.BILL_GENERATION,
            ErrorSeverity.HIGH,
            `批次 ${i + 1} 处理失败`,
            {
              module: 'BatchBillGenerator',
              function: 'generateUtilityBillsBatch',
              batchIndex: i,
              batchSize: batch.length,
            },
            error instanceof Error ? error : undefined
          )
        }
      }

      // 最终进度报告
      if (onProgress) {
        onProgress({
          processed: processedCount,
          total: validReadingIds.length,
          current: '处理完成',
        })
      }
    } catch (error) {
      await this.logger.logError(
        ErrorType.BILL_GENERATION,
        ErrorSeverity.CRITICAL,
        '批量账单生成失败',
        {
          module: 'BatchBillGenerator',
          function: 'generateUtilityBillsBatch',
          totalReadings: readingIds.length,
        },
        error instanceof Error ? error : undefined
      )

      result.failed = readingIds.length
      result.errors.push({
        readingId: 'ALL',
        error: `批量处理失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }

    result.duration = Date.now() - startTime

    // 记录完成日志
    await this.logger.logInfo('批量账单生成完成', {
      module: 'BatchBillGenerator',
      function: 'generateUtilityBillsBatch',
      result: {
        success: result.success,
        failed: result.failed,
        skipped: result.skipped,
        duration: result.duration,
      },
    })

    return result
  }

  /**
   * 处理单个批次
   */
  private async processBatch(
    readingIds: string[],
    maxConcurrent: number,
    dryRun: boolean
  ): Promise<{
    success: number
    failed: number
    errors: Array<{ readingId: string; error: string }>
  }> {
    const result: {
      success: number
      failed: number
      errors: Array<{ readingId: string; error: string }>
    } = { success: 0, failed: 0, errors: [] }

    // 限制并发数
    const semaphore: (string | null)[] = new Array(maxConcurrent).fill(null)
    const promises = readingIds.map(async (readingId) => {
      // 等待可用的并发槽位
      const slotIndex = await new Promise<number>((resolve) => {
        const tryAcquire = () => {
          const index = semaphore.findIndex((slot) => slot === null)
          if (index !== -1) {
            semaphore[index] = readingId
            resolve(index)
          } else {
            setTimeout(tryAcquire, 10)
          }
        }
        tryAcquire()
      })

      try {
        if (dryRun) {
          // 预览模式：仅验证数据
          await this.validateReading(readingId)
        } else {
          // 实际生成账单
          await this.generateSingleBill(readingId)
        }
        result.success++
      } catch (error) {
        result.failed++
        result.errors.push({
          readingId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        // 释放并发槽位
        semaphore[slotIndex] = null
      }
    })

    await Promise.all(promises)
    return result
  }

  /**
   * 生成单个账单（使用事务保护）
   */
  private async generateSingleBill(readingId: string): Promise<void> {
    const transactionResult = await transactionManager.executeTransaction(
      async (tx) => {
        // 获取抄表记录
        const reading = await tx.meterReading.findUnique({
          where: { id: readingId },
          include: {
            meter: {
              include: { room: { include: { building: true } } },
            },
            contract: {
              include: { renter: true },
            },
          },
        })

        if (!reading) {
          throw new Error(`抄表记录不存在: ${readingId}`)
        }

        if (reading.status === 'BILLED') {
          throw new Error(`抄表记录已生成账单: ${readingId}`)
        }

        if (!reading.contractId) {
          throw new Error(`抄表记录缺少合同信息: ${readingId}`)
        }

        // 构造抄表数据格式
        const readingData = {
          electricityUsage:
            reading.meter.meterType === 'ELECTRICITY'
              ? Number(reading.usage)
              : 0,
          waterUsage:
            reading.meter.meterType === 'COLD_WATER' ||
            reading.meter.meterType === 'HOT_WATER'
              ? Number(reading.usage)
              : 0,
          gasUsage:
            reading.meter.meterType === 'GAS' ? Number(reading.usage) : 0,
          readingDate: reading.readingDate,
          meterReadingIds: [readingId],
          aggregationStrategy: 'SINGLE' as const,
          meterPrices: {
            electricityPrice:
              reading.meter.meterType === 'ELECTRICITY'
                ? Number(reading.meter.unitPrice)
                : undefined,
            waterPrice:
              reading.meter.meterType === 'COLD_WATER' ||
              reading.meter.meterType === 'HOT_WATER'
                ? Number(reading.meter.unitPrice)
                : undefined,
            gasPrice:
              reading.meter.meterType === 'GAS'
                ? Number(reading.meter.unitPrice)
                : undefined,
          },
        }

        // 调用现有的账单生成逻辑
        return await generateUtilityBillOnReading(
          reading.contractId,
          readingData
        )
      },
      {
        type: TransactionType.BILL_GENERATION,
        description: `批量生成账单 - 抄表记录: ${readingId}`,
        metadata: { readingId, source: 'batch_generation' },
      }
    )

    if (!transactionResult.success) {
      throw new Error(transactionResult.error || '账单生成失败')
    }
  }

  /**
   * 验证抄表记录（预览模式）
   */
  private async validateReading(readingId: string): Promise<void> {
    const reading = await prisma.meterReading.findUnique({
      where: { id: readingId },
      include: {
        meter: true,
        contract: true,
      },
    })

    if (!reading) {
      throw new Error(`抄表记录不存在: ${readingId}`)
    }

    if (reading.status === 'BILLED') {
      throw new Error(`抄表记录已生成账单: ${readingId}`)
    }

    if (!reading.contract) {
      throw new Error(`抄表记录缺少合同信息: ${readingId}`)
    }

    if (Number(reading.usage) <= 0) {
      throw new Error(`抄表记录用量异常: ${readingId}`)
    }
  }

  /**
   * 过滤已有账单的抄表记录
   */
  private async filterExistingBills(readingIds: string[]): Promise<string[]> {
    const existingBills = await prisma.bill.findMany({
      where: {
        meterReadingId: { in: readingIds },
      },
      select: { meterReadingId: true },
    })

    const existingReadingIds = new Set(
      existingBills.map((bill) => bill.meterReadingId).filter(Boolean)
    )

    return readingIds.filter((id) => !existingReadingIds.has(id))
  }

  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * 导出单例实例
 */
export const batchBillGenerator = new BatchBillGenerator()

/**
 * 便捷函数：批量生成水电费账单
 */
export async function generateBillsBatch(
  readingIds: string[],
  options?: BatchGenerationOptions
): Promise<BatchBillGenerationResult> {
  return batchBillGenerator.generateUtilityBillsBatch(readingIds, options)
}
