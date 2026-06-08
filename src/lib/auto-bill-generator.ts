import {
  calculateUtilityBill,
} from '@/lib/bill-calculations'
import { buildContractRentBillPlan } from '@/lib/contract-payment-cycle'
import {
  generateBaseBillsForContract,
  repairMissingRentBillsForContract,
} from '@/lib/domain/billing'
import {
  ErrorLogger,
  ErrorSeverity,
  ErrorType,
  withErrorLogging,
} from '@/lib/error-logger'
import { fallbackManager } from '@/lib/fallback-manager'
import {
  revalidateMutationPaths,
  type MutationRevalidationRuntime,
} from '@/lib/mutation-revalidation'
import { prisma } from '@/lib/prisma'
import { getSettings } from '@/hooks/useSettings'

/**
 * 账单自动生成系统
 *
 * 设计原则：
 * 1. 自动触发为主（90%+）- 合同签订、周期性、抄表等触发
 * 2. 手动创建为辅（<10%）- 临时费用、特殊情况的补充
 * 3. 规则驱动 - 基于合同条款和系统配置自动计算
 * 4. 可追溯性 - 记录生成来源和计算依据
 */

/**
 * 账单生成触发器类型
 */
export enum BillTriggerType {
  CONTRACT_SIGNED = 'CONTRACT_SIGNED', // 合同签订触发
  PERIODIC_RENT = 'PERIODIC_RENT', // 周期性租金触发
  UTILITY_READING = 'UTILITY_READING', // 水电抄表触发
  CONTRACT_RENEWAL = 'CONTRACT_RENEWAL', // 合同续签触发
  MANUAL_CREATE = 'MANUAL_CREATE', // 手动创建
}

interface BillGenerationRuntimeOptions {
  executionRuntime?: MutationRevalidationRuntime
  runtimeName?: string
}

/**
 * 账单生成规则配置
 */
export interface BillGenerationRule {
  triggerType: BillTriggerType
  billType: 'RENT' | 'DEPOSIT' | 'UTILITIES' | 'OTHER'
  autoGenerate: boolean
  calculateMethod: 'FIXED' | 'CALCULATED' | 'USAGE_BASED'
  paymentCycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME'
  advanceDays?: number // 提前生成天数
}

/**
 * 账单生成上下文
 */
export interface BillGenerationContext {
  contractId: string
  triggerType: BillTriggerType
  triggerData?: any // 触发相关的数据（如抄表数据）
  generateDate?: Date
  dueDate?: Date
}

/**
 * 合同签订时自动生成所有账单
 *
 * 新的生成规则（基于合同预生成所有明确账单）：
 * 1. 押金账单 - 合同生效时一次性收取
 * 2. 租金账单 - 根据支付周期和合同期限生成所有租金账单
 *    - 月付：生成合同期内所有月份的租金账单
 *    - 季付：生成合同期内所有季度的租金账单
 *    - 半年付：生成合同期内所有半年的租金账单
 *    - 年付：生成合同期内所有年度的租金账单
 * 3. 其他费用 - 卫生费、钥匙押金等一次性费用
 */
export async function generateBillsOnContractSigned(
  contractId: string,
  runtimeOptions: BillGenerationRuntimeOptions = {}
) {
  const logger = ErrorLogger.getInstance()
  const startTime = Date.now()

  try {
    logger.logInfo('开始生成合同账单', {
      contractId,
      module: 'auto-bill-generator',
      function: 'generateBillsOnContractSigned',
    })

    console.log(`[账单生成] 开始处理合同: ${contractId}`)

    // 获取合同详情
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        room: { include: { building: true } },
        renter: true,
      },
    })

    if (!contract) {
      throw new Error(`合同不存在: ${contractId}`)
    }

    console.log(`[账单生成] 合同查询完成，耗时: ${Date.now() - startTime}ms`)

    console.log(
      `[账单生成] 开始通过共享领域服务生成基础账单，支付方式: ${contract.paymentMethod}`
    )
    const bills = await generateBaseBillsForContract(contractId)
    console.log(`[账单生成] 基础账单生成完成，共${bills.length}个`)

    const totalTime = Date.now() - startTime
    console.log(
      `[账单生成] 完成，共生成${bills.length}个账单，总耗时: ${totalTime}ms`
    )

    logger.logInfo('合同账单生成完成', {
      contractId,
      billCount: bills.length,
      duration: totalTime,
      module: 'auto-bill-generator',
    })

    await revalidateMutationPaths({
      scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
      detailPaths: [`/contracts/${contractId}`],
      executionRuntime: runtimeOptions.executionRuntime,
      runtimeName: runtimeOptions.runtimeName,
    })

    return bills
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`[账单生成] 失败，耗时: ${errorTime}ms，错误:`, error)

    await logger.logError(
      ErrorType.BILL_GENERATION,
      ErrorSeverity.HIGH,
      `合同 ${contractId} 账单生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
      {
        module: 'auto-bill-generator',
        function: 'generateBillsOnContractSigned',
        contractId,
        duration: errorTime,
      },
      error instanceof Error ? error : undefined
    )

    // 触发回退机制
    try {
      return await fallbackManager.handleError(
        error instanceof Error ? error : new Error(String(error)),
        { contractId }
      )
    } catch (fallbackError) {
      console.error(`[账单生成] 回退机制也失败:`, fallbackError)
      throw error // 抛出原始错误
    }
  }
}

/**
 * 基于共享支付周期计划计算应有的 RENT 账单方案
 */
function buildExpectedRentBillPlan(contract: any) {
  const rentBillPlan = buildContractRentBillPlan(
    contract.startDate,
    contract.endDate,
    contract.monthlyRent,
    contract.paymentMethod
  )

  console.log(
    `[账单周期] 计算完成，支付周期: ${rentBillPlan.paymentCycle}, 生成${rentBillPlan.periods.length}个周期`
  )

  return rentBillPlan
}

/**
 * 水电抄表后自动生成账单 (增强版)
 *
 * 根据抄表数据和系统设置的单价自动计算生成水电费账单
 * 支持多仪表聚合和详细明细记录
 */
export async function generateUtilityBillOnReading(
  contractId: string,
  readingData: {
    electricityUsage: number
    waterUsage: number
    gasUsage?: number
    readingDate: Date
    previousReading?: any
    currentReading?: any
    meterReadingIds?: string[] // 关联的抄表记录ID列表
    aggregationStrategy?: 'SINGLE' | 'AGGREGATE' // 生成策略
    meterPrices?: {
      electricityPrice?: number // 仪表配置的电费单价
      waterPrice?: number // 仪表配置的水费单价
      gasPrice?: number // 仪表配置的燃气单价
    }
  }
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { room: { include: { building: true } }, renter: true },
    })

    if (!contract) {
      throw new Error(`合同不存在: ${contractId}`)
    }

    // 计算水电费
    const utilityResult = await calculateUtilityBill(
      readingData.electricityUsage,
      readingData.waterUsage,
      readingData.gasUsage || 0,
      readingData.meterPrices // 传入仪表单价信息
    )

    // 计算账单周期（通常是抄表周期，如一个月）
    const readingDate = readingData.readingDate
    const periodStart = new Date(
      readingDate.getFullYear(),
      readingDate.getMonth(),
      1
    )
    const periodEnd = new Date(
      readingDate.getFullYear(),
      readingDate.getMonth() + 1,
      0
    )
    const dueDate = new Date(periodEnd.getTime() + 10 * 24 * 60 * 60 * 1000) // 月末后10天到期

    // 构建详细的账单明细信息
    const utilityDetails = {
      period: `${periodStart.toISOString().slice(0, 10)} 至 ${periodEnd.toISOString().slice(0, 10)}`,
      breakdown: {
        electricity: {
          usage: readingData.electricityUsage,
          unitPrice: utilityResult.electricityPrice,
          amount: utilityResult.electricityCost,
          priceSource: readingData.meterPrices?.electricityPrice
            ? 'METER_CONFIG'
            : 'GLOBAL_SETTING',
        },
        water: {
          usage: readingData.waterUsage,
          unitPrice: utilityResult.waterPrice,
          amount: utilityResult.waterCost,
          priceSource: readingData.meterPrices?.waterPrice
            ? 'METER_CONFIG'
            : 'GLOBAL_SETTING',
        },
        gas: readingData.gasUsage
          ? {
              usage: readingData.gasUsage,
              unitPrice: utilityResult.gasPrice || 0,
              amount: utilityResult.gasCost || 0,
              priceSource: readingData.meterPrices?.gasPrice
                ? 'METER_CONFIG'
                : 'GLOBAL_SETTING',
            }
          : null,
      },
      meterReadingIds: readingData.meterReadingIds || [],
      generationStrategy: readingData.aggregationStrategy || 'SINGLE',
      generatedAt: new Date().toISOString(),
    }

    // 生成账单备注
    const remarkParts = []
    if (readingData.electricityUsage > 0) {
      remarkParts.push(
        `电费${utilityResult.electricityCost}元(${readingData.electricityUsage}度)`
      )
    }
    if (readingData.waterUsage > 0) {
      remarkParts.push(
        `水费${utilityResult.waterCost}元(${readingData.waterUsage}吨)`
      )
    }
    if (readingData.gasUsage && readingData.gasUsage > 0) {
      remarkParts.push(
        `燃气费${utilityResult.gasCost}元(${readingData.gasUsage}立方米)`
      )
    }

    const utilityBill = await prisma.bill.create({
      data: {
        billNumber: generateBillNumber('UTILITIES', contract.contractNumber),
        type: 'UTILITIES',
        amount: utilityResult.totalCost,
        receivedAmount: 0,
        pendingAmount: utilityResult.totalCost,
        dueDate: dueDate,
        period: utilityDetails.period,
        status: 'PENDING',
        contractId: contract.id,
        remarks: `水电费账单 - ${remarkParts.join('，')}`,
        metadata: JSON.stringify({
          triggerType: 'UTILITY_READING',
          generatedAt: new Date().toISOString(),
          utilityDetails: utilityDetails,
          calculationBasis: {
            electricityPrice: utilityResult.electricityPrice,
            waterPrice: utilityResult.waterPrice,
            gasPrice: utilityResult.gasPrice,
            priceSource: {
              electricity: readingData.meterPrices?.electricityPrice
                ? 'METER_CONFIG'
                : 'GLOBAL_SETTING',
              water: readingData.meterPrices?.waterPrice
                ? 'METER_CONFIG'
                : 'GLOBAL_SETTING',
              gas: readingData.meterPrices?.gasPrice
                ? 'METER_CONFIG'
                : 'GLOBAL_SETTING',
            },
          },
        }),
      },
    })

    // 如果有关联的抄表记录，更新其账单关联状态
    if (readingData.meterReadingIds && readingData.meterReadingIds.length > 0) {
      await prisma.meterReading.updateMany({
        where: {
          id: { in: readingData.meterReadingIds },
        },
        data: {
          isBilled: true,
          status: 'BILLED',
        },
      })
    }

    console.log(
      `合同 ${contract.contractNumber} 自动生成水电费账单: ${utilityResult.totalCost}元，价格来源: ${JSON.stringify(readingData.meterPrices)}`
    )

    await revalidateMutationPaths({
      scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters', 'meters'],
      detailPaths: [`/contracts/${contractId}`],
    })

    return utilityBill
  } catch (error) {
    console.error('水电抄表自动生成账单失败:', error)
    throw error
  }
}

/**
 * 生成唯一的账单编号
 */
function generateBillNumber(type: string, contractNumber: string): string {
  const timestamp = Date.now().toString().slice(-6)
  const typePrefix =
    {
      RENT: 'R',
      DEPOSIT: 'D',
      UTILITIES: 'U',
      OTHER: 'O',
    }[type] || 'B'

  return `BILL${contractNumber.slice(-3)}${typePrefix}${timestamp}`
}

/**
 * 检查是否需要生成下期账单
 *
 * 注意：在新的设计中，所有租金账单都在合同创建时预生成
 * 此函数主要用于兼容性和特殊情况处理
 */
export async function checkAndGenerateUpcomingBills() {
  try {
    console.log('📅 检查即将到期账单（新设计中主要用于兼容性）')

    // 在新设计中，租金账单已经在合同创建时全部生成
    // 这里主要检查是否有遗漏的账单需要补充生成
    const activeContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(), // 未到期的合同
        },
      },
      include: {
        room: { include: { building: true } },
        renter: true,
        bills: {
          where: {
            type: 'RENT',
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    })

    const generatedBills = []

    for (const contract of activeContracts) {
      // 检查是否有缺失的租金账单需要补充
      const missingBills = await checkMissingRentBills(contract)
      if (missingBills.length > 0) {
        console.log(
          `合同 ${contract.contractNumber} 发现 ${missingBills.length} 个缺失的租金账单，正在补充生成`
        )
        generatedBills.push(...missingBills)
      }
    }

    console.log(`定时任务补充生成了 ${generatedBills.length} 个缺失的账单`)
    return generatedBills
  } catch (error) {
    console.error('检查并生成即将到期账单失败:', error)
    throw error
  }
}

/**
 * 检查合同是否有缺失的租金账单
 */
export async function checkMissingRentBills(contract: any): Promise<any[]> {
  if (!contract?.id) {
    throw new Error('缺少合同ID，无法补齐缺失租金账单')
  }

  buildExpectedRentBillPlan(contract)
  return repairMissingRentBillsForContract(contract.id)
}
