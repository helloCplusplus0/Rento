import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'
import { prisma } from './prisma'

/**
 * 合同激活服务
 * 负责处理PENDING状态合同的自动激活
 */
export class ContractActivationService {
  private logger: ErrorLogger

  constructor() {
    this.logger = ErrorLogger.getInstance()
  }

  /**
   * 激活到期的PENDING合同
   * 检查所有PENDING状态且开始日期已到的合同，将其激活为ACTIVE状态
   */
  async activatePendingContracts(): Promise<{
    activated: number
    errors: Array<{ contractId: string; error: string }>
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // 设置为当天开始时间

    this.logger.logInfo('开始检查待激活合同', {
      module: 'contract-activation',
      function: 'activatePendingContracts',
      date: today.toISOString(),
    })

    const result = {
      activated: 0,
      errors: [] as Array<{ contractId: string; error: string }>,
    }

    try {
      // 查找需要激活的合同
      const pendingContracts = await prisma.contract.findMany({
        where: {
          status: 'PENDING',
          startDate: {
            lte: today, // 开始日期小于等于今天
          },
        },
        include: {
          room: true,
          renter: true,
        },
      })

      this.logger.logInfo(`找到 ${pendingContracts.length} 个待激活合同`, {
        module: 'contract-activation',
        function: 'activatePendingContracts',
        count: pendingContracts.length,
      })

      // 逐个激活合同
      for (const contract of pendingContracts) {
        try {
          await this.activateContract(contract.id)
          result.activated++
          this.logger.logInfo(`合同激活成功`, {
            module: 'contract-activation',
            function: 'activatePendingContracts',
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            roomId: contract.roomId,
          })
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '未知错误'
          result.errors.push({
            contractId: contract.id,
            error: errorMessage,
          })
          await this.logger.logError(
            ErrorType.SYSTEM_ERROR,
            ErrorSeverity.HIGH,
            `合同激活失败: ${errorMessage}`,
            {
              module: 'contract-activation',
              function: 'activatePendingContracts',
              contractId: contract.id,
              contractNumber: contract.contractNumber,
            },
            error instanceof Error ? error : undefined
          )
        }
      }

      this.logger.logInfo('合同激活任务完成', {
        module: 'contract-activation',
        function: 'activatePendingContracts',
        total: pendingContracts.length,
        activated: result.activated,
        errors: result.errors.length,
      })

      return result
    } catch (error) {
      await this.logger.logError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.CRITICAL,
        '合同激活任务执行失败',
        {
          module: 'contract-activation',
          function: 'activatePendingContracts',
        },
        error instanceof Error ? error : undefined
      )
      throw error
    }
  }

  /**
   * 激活单个合同
   * 将PENDING状态的合同激活为ACTIVE，并更新房间状态
   */
  async activateContract(contractId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 获取合同信息
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
        include: { room: true },
      })

      if (!contract) {
        throw new Error(`合同不存在: ${contractId}`)
      }

      if (contract.status !== 'PENDING') {
        throw new Error(`合同状态不是PENDING: ${contract.status}`)
      }

      // 检查房间是否可用
      if (contract.room.status !== 'VACANT') {
        throw new Error(`房间不可用，当前状态: ${contract.room.status}`)
      }

      // 激活合同
      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'ACTIVE' },
      })

      // 更新房间状态
      await tx.room.update({
        where: { id: contract.roomId },
        data: {
          status: 'OCCUPIED',
          currentRenter: contract.renterId,
        },
      })
    })
  }

  /**
   * 手动激活合同（用于前端操作）
   */
  async manualActivateContract(contractId: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      await this.activateContract(contractId)
      return {
        success: true,
        message: '合同激活成功',
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活失败'
      await this.logger.logError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.MEDIUM,
        `手动激活合同失败: ${errorMessage}`,
        {
          module: 'contract-activation',
          function: 'manualActivateContract',
          contractId,
        },
        error instanceof Error ? error : undefined
      )
      return {
        success: false,
        message: errorMessage,
      }
    }
  }
}

// 导出单例实例
export const contractActivationService = new ContractActivationService()
