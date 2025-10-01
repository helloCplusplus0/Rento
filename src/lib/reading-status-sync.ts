import { prisma } from '@/lib/prisma'

import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'

/**
 * 抄表状态同步工具库
 * 提供数据一致性检查和自动修复功能
 */

interface ValidationResult {
  orphanedReadings: any[]
  inconsistentReadings: any[]
  totalInconsistencies: number
}

interface RepairResult {
  repairedOrphaned: number
  repairedInconsistent: number
  errors: string[]
}

/**
 * 验证抄表记录和账单的一致性
 */
export async function validateReadingBillConsistency(): Promise<ValidationResult> {
  console.log('[一致性检查] 开始验证抄表记录和账单的一致性')

  try {
    // 1. 查找状态为BILLED但没有关联账单的抄表记录
    const orphanedReadings = await prisma.meterReading.findMany({
      where: {
        status: 'BILLED',
        isBilled: true,
        billDetails: { none: {} }, // 没有关联的账单明细
      },
      include: {
        meter: true,
        contract: {
          include: {
            room: { include: { building: true } },
            renter: true,
          },
        },
      },
    })

    // 2. 查找有账单明细但状态不是BILLED的抄表记录
    const inconsistentReadings = await prisma.meterReading.findMany({
      where: {
        OR: [
          { status: { not: 'BILLED' }, billDetails: { some: {} } },
          { isBilled: false, billDetails: { some: {} } },
        ],
      },
      include: {
        meter: true,
        billDetails: {
          include: { bill: true },
        },
        contract: {
          include: {
            room: { include: { building: true } },
            renter: true,
          },
        },
      },
    })

    const result = {
      orphanedReadings,
      inconsistentReadings,
      totalInconsistencies:
        orphanedReadings.length + inconsistentReadings.length,
    }

    console.log(
      `[一致性检查] 完成 - 孤立记录: ${orphanedReadings.length}个, 不一致记录: ${inconsistentReadings.length}个`
    )

    return result
  } catch (error) {
    console.error('[一致性检查] 验证失败:', error)
    throw error
  }
}

/**
 * 自动修复状态不一致的抄表记录
 */
export async function repairReadingStatusInconsistencies(): Promise<RepairResult> {
  console.log('[状态修复] 开始修复抄表状态不一致问题')

  const validation = await validateReadingBillConsistency()
  const repairResults: RepairResult = {
    repairedOrphaned: 0,
    repairedInconsistent: 0,
    errors: [],
  }

  // 修复孤立的BILLED状态记录（有状态但无账单）
  for (const reading of validation.orphanedReadings) {
    try {
      await prisma.meterReading.update({
        where: { id: reading.id },
        data: {
          status: 'PENDING',
          isBilled: false,
        },
      })
      repairResults.repairedOrphaned++
      console.log(
        `[状态修复] 重置孤立记录状态: ${reading.id} (${reading.meter.displayName})`
      )
    } catch (error) {
      const errorMsg = `修复孤立记录${reading.id}失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      repairResults.errors.push(errorMsg)
      console.error(`[状态修复] ${errorMsg}`)
    }
  }

  // 修复不一致的状态记录（有账单但状态错误）
  for (const reading of validation.inconsistentReadings) {
    try {
      await prisma.meterReading.update({
        where: { id: reading.id },
        data: {
          status: 'BILLED',
          isBilled: true,
        },
      })
      repairResults.repairedInconsistent++
      console.log(
        `[状态修复] 更新不一致记录状态: ${reading.id} (${reading.meter.displayName})`
      )
    } catch (error) {
      const errorMsg = `修复不一致记录${reading.id}失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      repairResults.errors.push(errorMsg)

      // 使用统一的错误日志记录
      const logger = ErrorLogger.getInstance()
      await logger.logError(
        ErrorType.DATA_CONSISTENCY,
        ErrorSeverity.MEDIUM,
        `抄表状态修复失败: ${errorMsg}`,
        {
          module: 'ReadingStatusSync',
          function: 'repairReadingStatusInconsistencies',
          readingId: reading.id,
          meterName: reading.meter?.displayName,
        },
        error instanceof Error ? error : undefined
      )
    }
  }

  console.log(
    `[状态修复] 完成 - 孤立记录修复: ${repairResults.repairedOrphaned}个, 不一致记录修复: ${repairResults.repairedInconsistent}个, 错误: ${repairResults.errors.length}个`
  )

  return repairResults
}

/**
 * 获取抄表状态统计信息
 */
export async function getReadingStatusStats() {
  console.log('[状态统计] 获取抄表状态统计信息')

  try {
    // 按状态统计
    const statusStats = await prisma.meterReading.groupBy({
      by: ['status'],
      _count: { status: true },
      orderBy: { status: 'asc' },
    })

    // 按isBilled统计
    const billedStats = await prisma.meterReading.groupBy({
      by: ['isBilled'],
      _count: { isBilled: true },
    })

    // 总数统计
    const totalReadings = await prisma.meterReading.count()
    const totalBilled = await prisma.meterReading.count({
      where: { isBilled: true },
    })

    // 最近7天的状态变更
    const recentChanges = await prisma.meterReading.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    })

    const result = {
      statusDistribution: statusStats.map((stat) => ({
        status: stat.status,
        count: stat._count.status,
      })),
      billedDistribution: billedStats.map((stat) => ({
        isBilled: stat.isBilled,
        count: stat._count.isBilled,
      })),
      summary: {
        totalReadings,
        totalBilled,
        billedPercentage:
          totalReadings > 0
            ? Math.round((totalBilled / totalReadings) * 100)
            : 0,
        recentChanges,
      },
    }

    console.log(
      `[状态统计] 完成 - 总记录: ${totalReadings}个, 已生成账单: ${totalBilled}个 (${result.summary.billedPercentage}%)`
    )

    return result
  } catch (error) {
    console.error('[状态统计] 获取统计信息失败:', error)
    throw error
  }
}

/**
 * 检查特定抄表记录的状态一致性
 */
export async function checkSingleReadingConsistency(readingId: string) {
  console.log(`[单记录检查] 检查抄表记录 ${readingId} 的状态一致性`)

  try {
    const reading = await prisma.meterReading.findUnique({
      where: { id: readingId },
      include: {
        billDetails: {
          include: { bill: true },
        },
        meter: true,
      },
    })

    if (!reading) {
      throw new Error(`抄表记录 ${readingId} 不存在`)
    }

    const hasBillDetails = reading.billDetails.length > 0
    const isMarkedAsBilled = reading.isBilled && reading.status === 'BILLED'

    const result = {
      readingId,
      meterName: reading.meter.displayName,
      currentStatus: reading.status,
      isBilled: reading.isBilled,
      hasBillDetails,
      isConsistent: hasBillDetails === isMarkedAsBilled,
      billCount: reading.billDetails.length,
      updatedAt: reading.updatedAt,
      issues: [] as string[],
    }

    // 检查一致性问题
    if (hasBillDetails && !isMarkedAsBilled) {
      result.issues.push('有账单明细但状态未标记为BILLED')
    }

    if (!hasBillDetails && isMarkedAsBilled) {
      result.issues.push('状态标记为BILLED但没有账单明细')
    }

    if (reading.billDetails.length > 1) {
      result.issues.push(`存在多个账单明细 (${reading.billDetails.length}个)`)
    }

    console.log(
      `[单记录检查] 完成 - ${reading.meter.displayName}: ${result.isConsistent ? '一致' : '不一致'} (${result.issues.length}个问题)`
    )

    return result
  } catch (error) {
    // 使用统一的错误日志记录
    const logger = ErrorLogger.getInstance()
    await logger.logError(
      ErrorType.DATA_CONSISTENCY,
      ErrorSeverity.HIGH,
      `单记录状态检查失败: 检查记录 ${readingId} 失败`,
      {
        module: 'ReadingStatusSync',
        function: 'checkSingleReadingConsistency',
        readingId,
      },
      error instanceof Error ? error : undefined
    )
    throw error
  }
}

/**
 * 批量检查多个抄表记录的状态一致性
 */
export async function batchCheckReadingConsistency(readingIds: string[]) {
  console.log(`[批量检查] 检查 ${readingIds.length} 个抄表记录的状态一致性`)

  const results = []
  const errors = []

  for (const readingId of readingIds) {
    try {
      const result = await checkSingleReadingConsistency(readingId)
      results.push(result)
    } catch (error) {
      errors.push({
        readingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const summary = {
    total: readingIds.length,
    consistent: results.filter((r) => r.isConsistent).length,
    inconsistent: results.filter((r) => !r.isConsistent).length,
    errors: errors.length,
  }

  console.log(
    `[批量检查] 完成 - 一致: ${summary.consistent}个, 不一致: ${summary.inconsistent}个, 错误: ${summary.errors}个`
  )

  return {
    results,
    errors,
    summary,
  }
}
