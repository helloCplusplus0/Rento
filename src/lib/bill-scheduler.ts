/**
 * 账单调度器 - 自动生成周期性租金账单
 * 
 * 功能：
 * 1. 定时检查需要生成的下期租金账单
 * 2. 在账单支付完成后触发下期账单生成
 * 3. 支持手动触发和自动调度
 */

import { checkAndGenerateUpcomingBills } from './auto-bill-generator'
import { ErrorLogger, ErrorType, ErrorSeverity } from './error-logger'
import { getSettings } from '@/hooks/useSettings'

export class BillScheduler {
  private static instance: BillScheduler
  private schedulerTimer: NodeJS.Timeout | null = null
  private isRunning = false
  private logger = ErrorLogger.getInstance()

  private constructor() {}

  static getInstance(): BillScheduler {
    if (!BillScheduler.instance) {
      BillScheduler.instance = new BillScheduler()
    }
    return BillScheduler.instance
  }

  /**
   * 启动账单调度器
   * 默认每天检查一次
   */
  start(intervalHours: number = 24): void {
    if (this.isRunning) {
      console.log('📅 账单调度器已在运行中')
      return
    }

    this.isRunning = true
    const intervalMs = intervalHours * 60 * 60 * 1000

    // 立即执行一次
    this.executeScheduledCheck()

    // 设置定时器
    this.schedulerTimer = setInterval(() => {
      this.executeScheduledCheck()
    }, intervalMs)

    console.log(`📅 账单调度器已启动，检查间隔：${intervalHours}小时`)
    
    this.logger.logInfo('账单调度器启动', {
      module: 'bill-scheduler',
      intervalHours,
      nextCheck: new Date(Date.now() + intervalMs)
    })
  }

  /**
   * 停止账单调度器
   */
  stop(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer)
      this.schedulerTimer = null
    }
    this.isRunning = false
    console.log('📅 账单调度器已停止')
    
    this.logger.logInfo('账单调度器停止', {
      module: 'bill-scheduler'
    })
  }

  /**
   * 手动触发账单检查和生成
   */
  async triggerManualCheck(): Promise<{ success: boolean; billsGenerated: number; error?: string }> {
    try {
      this.logger.logInfo('手动触发账单检查', {
        module: 'bill-scheduler',
        trigger: 'manual'
      })

      const generatedBills = await checkAndGenerateUpcomingBills()
      
      this.logger.logInfo('手动账单检查完成', {
        module: 'bill-scheduler',
        billsGenerated: generatedBills.length
      })

      return {
        success: true,
        billsGenerated: generatedBills.length
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      await this.logger.logError(
        ErrorType.BILL_GENERATION,
        ErrorSeverity.HIGH,
        `手动账单检查失败: ${errorMessage}`,
        { module: 'bill-scheduler', trigger: 'manual' },
        error instanceof Error ? error : undefined
      )

      return {
        success: false,
        billsGenerated: 0,
        error: errorMessage
      }
    }
  }

  /**
   * 在账单支付完成后触发检查
   * 用于支付完成后立即检查是否需要生成下期账单
   */
  async onBillPaid(contractId: string, billId: string): Promise<void> {
    try {
      this.logger.logInfo('账单支付完成，触发下期账单检查', {
        module: 'bill-scheduler',
        contractId,
        billId,
        trigger: 'payment_completed'
      })

      // 检查该合同是否需要生成下期账单
      const generatedBills = await this.checkContractUpcomingBills(contractId)
      
      if (generatedBills.length > 0) {
        this.logger.logInfo('支付完成后生成下期账单', {
          module: 'bill-scheduler',
          contractId,
          billsGenerated: generatedBills.length
        })
      }
    } catch (error) {
      await this.logger.logError(
        ErrorType.BILL_GENERATION,
        ErrorSeverity.MEDIUM,
        `支付完成后账单检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { module: 'bill-scheduler', contractId, billId },
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 检查特定合同的即将到期账单
   * 
   * 注意：在新设计中，所有租金账单都在合同创建时预生成
   * 此函数主要用于检查是否有缺失的账单需要补充
   */
  private async checkContractUpcomingBills(contractId: string): Promise<any[]> {
    const { prisma } = await import('@/lib/prisma')
    
    try {
      // 获取合同信息和所有租金账单
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          room: { include: { building: true } },
          renter: true,
          bills: {
            where: {
              type: 'RENT'
            },
            orderBy: { dueDate: 'asc' }
          }
        }
      })

      if (!contract || contract.status !== 'ACTIVE') {
        return []
      }

      // 在新设计中，检查是否有缺失的租金账单
      const { checkMissingRentBills } = await import('./auto-bill-generator')
      const missingBills = await checkMissingRentBills(contract)
      
      if (missingBills.length > 0) {
        this.logger.logInfo('发现缺失的租金账单', {
          module: 'bill-scheduler',
          contractId,
          missingBillCount: missingBills.length
        })
      }

      return missingBills
    } catch (error) {
      console.error('检查合同即将到期账单失败:', error)
      return []
    }
  }

  /**
   * 执行定时检查
   */
  private async executeScheduledCheck(): Promise<void> {
    try {
      console.log('📅 开始执行定时账单检查...')
      
      const startTime = Date.now()
      const generatedBills = await checkAndGenerateUpcomingBills()
      const duration = Date.now() - startTime

      console.log(`📅 定时账单检查完成，生成 ${generatedBills.length} 个账单，耗时 ${duration}ms`)
      
      this.logger.logInfo('定时账单检查完成', {
        module: 'bill-scheduler',
        billsGenerated: generatedBills.length,
        duration,
        trigger: 'scheduled'
      })
    } catch (error) {
      console.error('📅 定时账单检查失败:', error)
      
      await this.logger.logError(
        ErrorType.BILL_GENERATION,
        ErrorSeverity.HIGH,
        `定时账单检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { module: 'bill-scheduler', trigger: 'scheduled' },
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 获取调度器状态
   */
  getStatus(): {
    isRunning: boolean
    nextCheck?: Date
  } {
    return {
      isRunning: this.isRunning,
      nextCheck: this.schedulerTimer ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined
    }
  }
}

// 导出单例实例
export const billScheduler = BillScheduler.getInstance()