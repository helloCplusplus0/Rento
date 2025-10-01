import { prisma } from '@/lib/prisma'

import type { ConsistencyIssue } from './data-consistency-checker'
import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'
import { transactionManager, TransactionType } from './transaction-manager'

/**
 * 数据修复器
 * 提供自动修复数据一致性问题的功能
 */

// 修复选项
export interface RepairOptions {
  dryRun?: boolean // 仅模拟，不实际修复
  maxRepairs?: number // 最大修复数量
  skipCritical?: boolean // 跳过关键问题
  forceRepair?: boolean // 强制修复
}

// 修复结果
export interface RepairResult {
  totalIssues: number
  repairedIssues: number
  skippedIssues: number
  failedIssues: number
  errors: Array<{
    issueId?: string
    error: string
  }>
  executionTime: number
}

// 单个修复结果
interface SingleRepairResult {
  success: boolean
  message?: string
  error?: string
}

/**
 * 数据修复器
 */
export class DataRepairer {
  /**
   * 执行数据修复
   */
  async repairDataInconsistencies(
    issues: ConsistencyIssue[],
    options: RepairOptions = {}
  ): Promise<RepairResult> {
    console.log(`[数据修复] 开始修复 ${issues.length} 个数据问题`)
    const startTime = Date.now()

    const result: RepairResult = {
      totalIssues: issues.length,
      repairedIssues: 0,
      skippedIssues: 0,
      failedIssues: 0,
      errors: [],
      executionTime: 0,
    }

    // 按优先级排序问题
    const sortedIssues = this.prioritizeIssues(issues)

    // 应用修复限制
    const issuesToRepair = options.maxRepairs
      ? sortedIssues.slice(0, options.maxRepairs)
      : sortedIssues

    for (const issue of issuesToRepair) {
      try {
        // 跳过关键问题（如果设置）
        if (options.skipCritical && issue.severity === 'CRITICAL') {
          result.skippedIssues++
          console.log(`[数据修复] 跳过关键问题: ${issue.description}`)
          continue
        }

        // 执行修复
        const repairResult = await this.repairSingleIssue(issue, options)

        if (repairResult.success) {
          result.repairedIssues++
          console.log(`[数据修复] 修复成功: ${issue.description}`)
        } else {
          result.skippedIssues++
          console.log(
            `[数据修复] 跳过修复: ${issue.description} - ${repairResult.message}`
          )
        }
      } catch (error) {
        result.failedIssues++
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error'
        result.errors.push({
          issueId: issue.id,
          error: errorMsg,
        })

        // 使用统一的错误日志记录
        const logger = ErrorLogger.getInstance()
        await logger.logError(
          ErrorType.DATA_CONSISTENCY,
          ErrorSeverity.HIGH,
          `数据修复失败: ${issue.description}`,
          {
            module: 'DataRepairer',
            function: 'repairDataInconsistencies',
            issueId: issue.id,
            issueType: issue.type,
            issueSeverity: issue.severity,
            errorMessage: errorMsg,
          },
          error instanceof Error ? error : undefined
        )
      }
    }

    result.executionTime = Date.now() - startTime

    console.log(
      `[数据修复] 修复完成: 成功 ${result.repairedIssues}, 跳过 ${result.skippedIssues}, 失败 ${result.failedIssues} (耗时: ${result.executionTime}ms)`
    )

    return result
  }

  /**
   * 修复单个问题
   */
  private async repairSingleIssue(
    issue: ConsistencyIssue,
    options: RepairOptions
  ): Promise<SingleRepairResult> {
    if (options.dryRun) {
      return {
        success: true,
        message: '模拟修复成功',
      }
    }

    const transactionResult = await transactionManager.executeTransaction(
      async (tx) => {
        switch (issue.suggestedFix) {
          case 'recalculateBillAmounts':
            return await this.recalculateBillAmounts(tx, issue.entityId)

          case 'updateBillStatus':
            return await this.updateBillStatus(tx, issue.entityId)

          case 'resetReadingStatus':
            return await this.resetReadingStatus(tx, issue.entityId)

          case 'updateReadingStatus':
            return await this.updateReadingStatus(tx, issue.entityId)

          case 'updateRoomStatus':
            return await this.updateRoomStatus(
              tx,
              issue.entityId,
              issue.metadata
            )

          case 'repairBillDetails':
            return await this.repairBillDetails(tx, issue.entityId)

          case 'recalculateDetailAmounts':
            return await this.recalculateDetailAmounts(tx, issue.entityId)

          default:
            throw new Error(`未知的修复类型: ${issue.suggestedFix}`)
        }
      },
      {
        type: TransactionType.DATA_REPAIR,
        description: `修复数据问题: ${issue.type}`,
        metadata: { issueId: issue.id, entityType: issue.entityType },
      }
    )

    if (transactionResult.success) {
      return {
        success: true,
        message: '修复成功',
      }
    } else {
      return {
        success: false,
        error: transactionResult.error,
      }
    }
  }

  /**
   * 重新计算账单金额
   */
  private async recalculateBillAmounts(tx: any, billId: string): Promise<void> {
    console.log(`[数据修复] 重新计算账单金额: ${billId}`)

    const bill = await tx.bill.findUnique({
      where: { id: billId },
      select: { amount: true, receivedAmount: true },
    })

    if (!bill) {
      throw new Error(`账单不存在: ${billId}`)
    }

    const pendingAmount = Number(bill.amount) - Number(bill.receivedAmount)

    await tx.bill.update({
      where: { id: billId },
      data: { pendingAmount },
    })
  }

  /**
   * 更新账单状态
   */
  private async updateBillStatus(tx: any, billId: string): Promise<void> {
    console.log(`[数据修复] 更新账单状态: ${billId}`)

    const bill = await tx.bill.findUnique({
      where: { id: billId },
      select: { pendingAmount: true },
    })

    if (!bill) {
      throw new Error(`账单不存在: ${billId}`)
    }

    const newStatus = Number(bill.pendingAmount) <= 0.01 ? 'PAID' : 'PENDING'

    await tx.bill.update({
      where: { id: billId },
      data: { status: newStatus },
    })
  }

  /**
   * 重置抄表记录状态
   */
  private async resetReadingStatus(tx: any, readingId: string): Promise<void> {
    console.log(`[数据修复] 重置抄表记录状态: ${readingId}`)

    await tx.meterReading.update({
      where: { id: readingId },
      data: {
        status: 'PENDING',
        isBilled: false,
      },
    })
  }

  /**
   * 更新抄表记录状态
   */
  private async updateReadingStatus(tx: any, readingId: string): Promise<void> {
    console.log(`[数据修复] 更新抄表记录状态: ${readingId}`)

    await tx.meterReading.update({
      where: { id: readingId },
      data: {
        status: 'BILLED',
        isBilled: true,
      },
    })
  }

  /**
   * 更新房间状态
   */
  private async updateRoomStatus(
    tx: any,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    console.log(`[数据修复] 更新房间状态: ${entityId}`)

    let roomId: string
    let newStatus: string

    if (metadata?.roomId) {
      // 从合同更新房间状态
      roomId = metadata.roomId
      newStatus = 'OCCUPIED'
    } else {
      // 直接更新房间状态
      roomId = entityId

      // 检查房间是否有活跃合同
      const activeContracts = await tx.contract.count({
        where: {
          roomId,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      })

      newStatus = activeContracts > 0 ? 'OCCUPIED' : 'VACANT'
    }

    await tx.room.update({
      where: { id: roomId },
      data: { status: newStatus },
    })
  }

  /**
   * 修复账单明细
   */
  private async repairBillDetails(tx: any, billId: string): Promise<void> {
    console.log(`[数据修复] 修复账单明细: ${billId}`)

    const bill = await tx.bill.findUnique({
      where: { id: billId },
      include: {
        contract: true,
        billDetails: true,
      },
    })

    if (!bill) {
      throw new Error(`账单不存在: ${billId}`)
    }

    // 如果已有明细，先删除
    if (bill.billDetails.length > 0) {
      await tx.billDetail.deleteMany({
        where: { billId },
      })
    }

    // 查找相关的抄表记录
    const meterReadings = await tx.meterReading.findMany({
      where: {
        contractId: bill.contractId,
        status: 'BILLED',
        isBilled: true,
        billDetails: { none: {} }, // 没有关联账单明细的记录
      },
      include: {
        meter: true,
      },
      orderBy: { readingDate: 'desc' },
      take: 10, // 限制数量，避免过多数据
    })

    if (meterReadings.length === 0) {
      // 如果没有找到抄表记录，重新计算账单金额为0
      await tx.bill.update({
        where: { id: billId },
        data: {
          amount: 0,
          pendingAmount: 0,
          remarks:
            (bill.remarks || '') +
            '\n[系统修复] 未找到相关抄表记录，金额已重置为0',
        },
      })
      return
    }

    // 创建账单明细
    let totalAmount = 0
    for (const reading of meterReadings) {
      const usage = Number(reading.usage) || 0
      const unitPrice = Number(reading.unitPrice) || 0
      const amount = usage * unitPrice

      await tx.billDetail.create({
        data: {
          billId,
          meterReadingId: reading.id,
          meterType: reading.meter.type,
          meterName: reading.meter.displayName || `${reading.meter.type}表`,
          usage,
          unitPrice,
          amount,
          unit: reading.meter.unit || '度',
          previousReading: Number(reading.previousReading) || 0,
          currentReading: Number(reading.currentReading) || 0,
          readingDate: reading.readingDate,
          priceSource: 'METER_CONFIG',
        },
      })

      totalAmount += amount
    }

    // 更新账单总金额
    const receivedAmount = Number(bill.receivedAmount) || 0
    const pendingAmount = totalAmount - receivedAmount

    await tx.bill.update({
      where: { id: billId },
      data: {
        amount: totalAmount,
        pendingAmount,
        status: pendingAmount <= 0.01 ? 'PAID' : 'PENDING',
        remarks:
          (bill.remarks || '') +
          `\n[系统修复] 已重新生成账单明细，共${meterReadings.length}项`,
      },
    })
  }

  /**
   * 重新计算明细金额
   */
  private async recalculateDetailAmounts(
    tx: any,
    detailId: string
  ): Promise<void> {
    console.log(`[数据修复] 重新计算明细金额: ${detailId}`)

    const detail = await tx.billDetail.findUnique({
      where: { id: detailId },
      select: { usage: true, unitPrice: true },
    })

    if (!detail) {
      throw new Error(`账单明细不存在: ${detailId}`)
    }

    const correctAmount = Number(detail.usage) * Number(detail.unitPrice)

    await tx.billDetail.update({
      where: { id: detailId },
      data: { amount: correctAmount },
    })
  }

  /**
   * 按优先级排序问题
   */
  private prioritizeIssues(issues: ConsistencyIssue[]): ConsistencyIssue[] {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

    return issues.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff

      // 相同严重级别按类型排序
      return a.type.localeCompare(b.type)
    })
  }
}

// 导出单例实例
export const dataRepairer = new DataRepairer()
