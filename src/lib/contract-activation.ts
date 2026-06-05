import { contractLifecycleService } from './domain/contracts'

/**
 * 合同激活服务
 * 负责处理 PENDING 状态合同的自动激活。
 *
 * compat wrapper:
 * phase09-02 起正式事务边界已迁入 src/lib/domain/contracts，
 * 当前文件仅为历史调用点保留薄包装，避免继续维护第二套业务真相。
 */
export class ContractActivationService {
  /**
   * 激活到期的PENDING合同
   * 检查所有PENDING状态且开始日期已到的合同，将其激活为ACTIVE状态
   */
  async activatePendingContracts(): Promise<{
    activated: number
    errors: Array<{ contractId: string; error: string }>
  }> {
    return contractLifecycleService.activatePendingContracts()
  }

  /**
   * 激活单个合同
   * 将PENDING状态的合同激活为ACTIVE，并更新房间状态
   */
  async activateContract(contractId: string): Promise<void> {
    const result = await contractLifecycleService.manualActivateContract(contractId)

    if (!result.success) {
      throw new Error(result.message)
    }
  }

  /**
   * 手动激活合同（用于前端操作）
   */
  async manualActivateContract(contractId: string): Promise<{
    success: boolean
    message: string
  }> {
    return contractLifecycleService.manualActivateContract(contractId)
  }
}

// 导出单例实例
export const contractActivationService = new ContractActivationService()
