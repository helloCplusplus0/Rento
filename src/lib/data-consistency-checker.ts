import { prisma } from '@/lib/prisma'
import { ErrorLogger, ErrorType, ErrorSeverity } from './error-logger'

/**
 * 数据一致性检查器
 * 提供全面的数据一致性验证和问题检测
 */

// 一致性检查结果
export interface ConsistencyCheck {
  name: string
  passed: boolean
  issues: ConsistencyIssue[]
  executedAt: Date
}

// 一致性问题
export interface ConsistencyIssue {
  id?: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  entityType: string
  entityId: string
  description: string
  suggestedFix: string
  metadata?: Record<string, any>
}

// 一致性报告
export interface ConsistencyReport {
  timestamp: Date
  checks: ConsistencyCheck[]
  summary: {
    totalChecks: number
    passedChecks: number
    failedChecks: number
    criticalIssues: number
    highIssues: number
    mediumIssues: number
    lowIssues: number
  }
}

/**
 * 数据一致性检查器
 */
export class DataConsistencyChecker {
  
  /**
   * 执行全面的数据一致性检查
   */
  async performFullConsistencyCheck(): Promise<ConsistencyReport> {
    console.log('[一致性检查] 开始执行全面数据一致性检查')
    
    const report: ConsistencyReport = {
      timestamp: new Date(),
      checks: [],
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0
      }
    }
    
    try {
      // 1. 账单数据一致性检查
      const billConsistency = await this.checkBillConsistency()
      report.checks.push(billConsistency)
      
      // 2. 抄表状态一致性检查
      const readingConsistency = await this.checkReadingConsistency()
      report.checks.push(readingConsistency)
      
      // 3. 合同房间一致性检查
      const contractRoomConsistency = await this.checkContractRoomConsistency()
      report.checks.push(contractRoomConsistency)
      
      // 4. 账单明细一致性检查
      const billDetailConsistency = await this.checkBillDetailConsistency()
      report.checks.push(billDetailConsistency)
      
      // 5. 金额计算一致性检查
      const amountConsistency = await this.checkAmountConsistency()
      report.checks.push(amountConsistency)
      
      // 汇总结果
      this.summarizeReport(report)
      
      console.log(`[一致性检查] 检查完成: ${report.summary.passedChecks}/${report.summary.totalChecks} 通过`)
      
    } catch (error) {
      console.error('[一致性检查] 执行失败:', error)
      throw error
    }
    
    return report
  }
  
  /**
   * 账单数据一致性检查
   */
  private async checkBillConsistency(): Promise<ConsistencyCheck> {
    console.log('[一致性检查] 检查账单数据一致性')
    
    const issues: ConsistencyIssue[] = []
    
    try {
      // 检查账单金额一致性 (pendingAmount = amount - receivedAmount)
      const billsWithInconsistentAmounts = await prisma.$queryRaw<Array<{
        id: string
        billNumber: string
        amount: string
        receivedAmount: string
        pendingAmount: string
      }>>`
        SELECT id, billNumber, 
               CAST(amount as TEXT) as amount, 
               CAST(receivedAmount as TEXT) as receivedAmount, 
               CAST(pendingAmount as TEXT) as pendingAmount
        FROM bills 
        WHERE ABS(pendingAmount - (amount - receivedAmount)) > 0.01
        OR receivedAmount > amount
      `
      
      for (const bill of billsWithInconsistentAmounts) {
        issues.push({
          id: `bill_amount_${bill.id}`,
          type: 'AMOUNT_INCONSISTENCY',
          severity: 'HIGH',
          entityType: 'BILL',
          entityId: bill.id,
          description: `账单 ${bill.billNumber} 金额计算不一致: 应收${bill.amount}, 已收${bill.receivedAmount}, 待收${bill.pendingAmount}`,
          suggestedFix: 'recalculateBillAmounts',
          metadata: {
            amount: parseFloat(bill.amount),
            receivedAmount: parseFloat(bill.receivedAmount),
            pendingAmount: parseFloat(bill.pendingAmount),
            expectedPendingAmount: parseFloat(bill.amount) - parseFloat(bill.receivedAmount)
          }
        })
      }
      
      // 检查账单状态一致性
      const billsWithInconsistentStatus = await prisma.$queryRaw<Array<{
        id: string
        billNumber: string
        status: string
        amount: string
        receivedAmount: string
        pendingAmount: string
      }>>`
        SELECT id, billNumber, status, 
               CAST(amount as TEXT) as amount, 
               CAST(receivedAmount as TEXT) as receivedAmount, 
               CAST(pendingAmount as TEXT) as pendingAmount
        FROM bills 
        WHERE (status = 'PAID' AND pendingAmount > 0.01)
        OR (status = 'PENDING' AND pendingAmount <= 0.01 AND receivedAmount > 0)
      `
      
      for (const bill of billsWithInconsistentStatus) {
        const pendingAmount = parseFloat(bill.pendingAmount)
        const expectedStatus = pendingAmount <= 0.01 ? 'PAID' : 'PENDING'
        issues.push({
          id: `bill_status_${bill.id}`,
          type: 'STATUS_INCONSISTENCY',
          severity: 'MEDIUM',
          entityType: 'BILL',
          entityId: bill.id,
          description: `账单 ${bill.billNumber} 状态不匹配: 当前${bill.status}, 应为${expectedStatus}`,
          suggestedFix: 'updateBillStatus',
          metadata: {
            currentStatus: bill.status,
            expectedStatus,
            pendingAmount
          }
        })
      }
      
    } catch (error) {
      // 使用统一的错误日志记录
      const logger = ErrorLogger.getInstance()
      await logger.logError(
        ErrorType.DATA_CONSISTENCY,
        ErrorSeverity.CRITICAL,
        '账单一致性检查执行失败',
        {
          module: 'DataConsistencyChecker',
          function: 'checkBillConsistency'
        },
        error instanceof Error ? error : undefined
      )
      
      issues.push({
        type: 'CHECK_ERROR',
        severity: 'CRITICAL',
        entityType: 'SYSTEM',
        entityId: 'bill_consistency_check',
        description: `账单一致性检查执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedFix: 'manual_investigation'
      })
    }
    
    return {
      name: 'Bill Consistency Check',
      passed: issues.length === 0,
      issues,
      executedAt: new Date()
    }
  }
  
  /**
   * 抄表状态一致性检查
   */
  private async checkReadingConsistency(): Promise<ConsistencyCheck> {
    console.log('[一致性检查] 检查抄表状态一致性')
    
    const issues: ConsistencyIssue[] = []
    
    try {
      // 检查孤立的BILLED状态记录（有状态但无账单明细）
      const orphanedReadings = await prisma.meterReading.findMany({
        where: {
          status: 'BILLED',
          isBilled: true,
          billDetails: { none: {} }
        },
        include: { meter: true }
      })
      
      for (const reading of orphanedReadings) {
        issues.push({
          id: `reading_orphaned_${reading.id}`,
          type: 'ORPHANED_BILLED_STATUS',
          severity: 'MEDIUM',
          entityType: 'METER_READING',
          entityId: reading.id,
          description: `抄表记录 ${reading.meter.displayName} 状态为BILLED但无关联账单明细`,
          suggestedFix: 'resetReadingStatus'
        })
      }
      
      // 检查不一致的状态记录（有账单明细但状态错误）
      const inconsistentReadings = await prisma.meterReading.findMany({
        where: {
          OR: [
            { status: { not: 'BILLED' }, billDetails: { some: {} } },
            { isBilled: false, billDetails: { some: {} } }
          ]
        },
        include: { 
          meter: true,
          billDetails: { include: { bill: true } }
        }
      })
      
      for (const reading of inconsistentReadings) {
        issues.push({
          id: `reading_inconsistent_${reading.id}`,
          type: 'INCONSISTENT_READING_STATUS',
          severity: 'HIGH',
          entityType: 'METER_READING',
          entityId: reading.id,
          description: `抄表记录 ${reading.meter.displayName} 有账单明细但状态不是BILLED`,
          suggestedFix: 'updateReadingStatus',
          metadata: {
            currentStatus: reading.status,
            isBilled: reading.isBilled,
            billDetailsCount: reading.billDetails.length
          }
        })
      }
      
    } catch (error) {
      console.error('[一致性检查] 抄表状态检查失败:', error)
      issues.push({
        type: 'CHECK_ERROR',
        severity: 'CRITICAL',
        entityType: 'SYSTEM',
        entityId: 'reading_consistency_check',
        description: `抄表状态一致性检查执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedFix: 'manual_investigation'
      })
    }
    
    return {
      name: 'Reading Status Consistency Check',
      passed: issues.length === 0,
      issues,
      executedAt: new Date()
    }
  }
  
  /**
   * 合同房间一致性检查
   */
  private async checkContractRoomConsistency(): Promise<ConsistencyCheck> {
    console.log('[一致性检查] 检查合同房间一致性')
    
    const issues: ConsistencyIssue[] = []
    
    try {
      // 检查活跃合同对应的房间状态
      const activeContractsWithWrongRoomStatus = await prisma.contract.findMany({
        where: {
          status: { in: ['ACTIVE', 'PENDING'] },
          room: {
            status: { not: 'OCCUPIED' }
          }
        },
        include: {
          room: { include: { building: true } },
          renter: true
        }
      })
      
      for (const contract of activeContractsWithWrongRoomStatus) {
        issues.push({
          id: `contract_room_${contract.id}`,
          type: 'CONTRACT_ROOM_STATUS_MISMATCH',
          severity: 'HIGH',
          entityType: 'CONTRACT',
          entityId: contract.id,
          description: `活跃合同 ${contract.contractNumber} 对应房间 ${contract.room.building.name}-${contract.room.roomNumber} 状态不是OCCUPIED`,
          suggestedFix: 'updateRoomStatus',
          metadata: {
            contractStatus: contract.status,
            roomStatus: contract.room.status,
            roomId: contract.room.id
          }
        })
      }
      
      // 检查OCCUPIED房间是否有活跃合同
      const occupiedRoomsWithoutActiveContract = await prisma.room.findMany({
        where: {
          status: 'OCCUPIED',
          contracts: {
            none: {
              status: { in: ['ACTIVE', 'PENDING'] }
            }
          }
        },
        include: { building: true }
      })
      
      for (const room of occupiedRoomsWithoutActiveContract) {
        issues.push({
          id: `room_contract_${room.id}`,
          type: 'OCCUPIED_ROOM_WITHOUT_CONTRACT',
          severity: 'MEDIUM',
          entityType: 'ROOM',
          entityId: room.id,
          description: `房间 ${room.building.name}-${room.roomNumber} 状态为OCCUPIED但无活跃合同`,
          suggestedFix: 'updateRoomStatus',
          metadata: {
            roomStatus: room.status
          }
        })
      }
      
    } catch (error) {
      console.error('[一致性检查] 合同房间检查失败:', error)
      issues.push({
        type: 'CHECK_ERROR',
        severity: 'CRITICAL',
        entityType: 'SYSTEM',
        entityId: 'contract_room_consistency_check',
        description: `合同房间一致性检查执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedFix: 'manual_investigation'
      })
    }
    
    return {
      name: 'Contract Room Consistency Check',
      passed: issues.length === 0,
      issues,
      executedAt: new Date()
    }
  }
  
  /**
   * 账单明细一致性检查
   */
  private async checkBillDetailConsistency(): Promise<ConsistencyCheck> {
    console.log('[一致性检查] 检查账单明细一致性')
    
    const issues: ConsistencyIssue[] = []
    
    try {
      // 检查UTILITIES类型账单缺失明细
      const utilityBillsWithoutDetails = await prisma.bill.findMany({
        where: {
          type: 'UTILITIES',
          billDetails: { none: {} }
        },
        select: {
          id: true,
          billNumber: true,
          amount: true
        }
      })
      
      for (const bill of utilityBillsWithoutDetails) {
        issues.push({
          id: `bill_detail_missing_${bill.id}`,
          type: 'MISSING_BILL_DETAILS',
          severity: 'HIGH',
          entityType: 'BILL',
          entityId: bill.id,
          description: `水电费账单 ${bill.billNumber} 缺失明细数据`,
          suggestedFix: 'repairBillDetails'
        })
      }
      
      // 检查账单明细金额与账单总额不匹配
      const billsWithInconsistentDetailAmounts = await prisma.$queryRaw<Array<{
        id: string
        billNumber: string
        billAmount: string
        detailsTotal: string
      }>>`
        SELECT 
          b.id,
          b.billNumber,
          CAST(b.amount as TEXT) as billAmount,
          CAST(COALESCE(SUM(bd.amount), 0) as TEXT) as detailsTotal
        FROM bills b
        LEFT JOIN bill_details bd ON b.id = bd.billId
        WHERE b.type = 'UTILITIES'
        GROUP BY b.id, b.billNumber, b.amount
        HAVING ABS(b.amount - COALESCE(SUM(bd.amount), 0)) > 0.01
      `
      
      for (const bill of billsWithInconsistentDetailAmounts) {
        const billAmount = parseFloat(bill.billAmount)
        const detailsTotal = parseFloat(bill.detailsTotal)
        issues.push({
          id: `bill_detail_amount_${bill.id}`,
          type: 'BILL_DETAIL_AMOUNT_MISMATCH',
          severity: 'HIGH',
          entityType: 'BILL',
          entityId: bill.id,
          description: `账单 ${bill.billNumber} 总额(${billAmount})与明细合计(${detailsTotal})不匹配`,
          suggestedFix: 'recalculateBillAmounts',
          metadata: {
            billAmount,
            detailsTotal
          }
        })
      }
      
    } catch (error) {
      console.error('[一致性检查] 账单明细检查失败:', error)
      issues.push({
        type: 'CHECK_ERROR',
        severity: 'CRITICAL',
        entityType: 'SYSTEM',
        entityId: 'bill_detail_consistency_check',
        description: `账单明细一致性检查执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedFix: 'manual_investigation'
      })
    }
    
    return {
      name: 'Bill Detail Consistency Check',
      passed: issues.length === 0,
      issues,
      executedAt: new Date()
    }
  }
  
  /**
   * 金额计算一致性检查
   */
  private async checkAmountConsistency(): Promise<ConsistencyCheck> {
    console.log('[一致性检查] 检查金额计算一致性')
    
    const issues: ConsistencyIssue[] = []
    
    try {
      // 检查账单明细中的金额计算 (amount = usage * unitPrice)
      const detailsWithIncorrectAmounts = await prisma.$queryRaw<Array<{
        id: string
        billId: string
        meterName: string
        usage: string
        unitPrice: string
        amount: string
        expectedAmount: string
      }>>`
        SELECT 
          id,
          billId,
          meterName,
          CAST(usage as TEXT) as usage,
          CAST(unitPrice as TEXT) as unitPrice,
          CAST(amount as TEXT) as amount,
          CAST((usage * unitPrice) as TEXT) as expectedAmount
        FROM bill_details
        WHERE ABS(amount - (usage * unitPrice)) > 0.01
      `
      
      for (const detail of detailsWithIncorrectAmounts) {
        const usage = parseFloat(detail.usage)
        const unitPrice = parseFloat(detail.unitPrice)
        const amount = parseFloat(detail.amount)
        const expectedAmount = parseFloat(detail.expectedAmount)
        
        issues.push({
          id: `detail_amount_${detail.id}`,
          type: 'INCORRECT_DETAIL_AMOUNT_CALCULATION',
          severity: 'HIGH',
          entityType: 'BILL_DETAIL',
          entityId: detail.id,
          description: `账单明细 ${detail.meterName} 金额计算错误: ${usage} × ${unitPrice} ≠ ${amount}`,
          suggestedFix: 'recalculateDetailAmounts',
          metadata: {
            usage,
            unitPrice,
            currentAmount: amount,
            expectedAmount
          }
        })
      }
      
    } catch (error) {
      console.error('[一致性检查] 金额计算检查失败:', error)
      issues.push({
        type: 'CHECK_ERROR',
        severity: 'CRITICAL',
        entityType: 'SYSTEM',
        entityId: 'amount_consistency_check',
        description: `金额计算一致性检查执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedFix: 'manual_investigation'
      })
    }
    
    return {
      name: 'Amount Calculation Consistency Check',
      passed: issues.length === 0,
      issues,
      executedAt: new Date()
    }
  }
  
  /**
   * 汇总报告结果
   */
  private summarizeReport(report: ConsistencyReport): void {
    report.summary.totalChecks = report.checks.length
    report.summary.passedChecks = report.checks.filter(check => check.passed).length
    report.summary.failedChecks = report.summary.totalChecks - report.summary.passedChecks
    
    // 统计各级别问题数量
    for (const check of report.checks) {
      for (const issue of check.issues) {
        switch (issue.severity) {
          case 'CRITICAL':
            report.summary.criticalIssues++
            break
          case 'HIGH':
            report.summary.highIssues++
            break
          case 'MEDIUM':
            report.summary.mediumIssues++
            break
          case 'LOW':
            report.summary.lowIssues++
            break
        }
      }
    }
  }
}

// 导出单例实例
export const dataConsistencyChecker = new DataConsistencyChecker()