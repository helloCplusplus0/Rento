import { prisma } from '@/lib/prisma'
import { calculateRentBill, calculateUtilityBill } from '@/lib/bill-calculations'
import { getSettings } from '@/hooks/useSettings'
import { ErrorLogger, ErrorType, ErrorSeverity, withErrorLogging } from '@/lib/error-logger'
import { fallbackManager } from '@/lib/fallback-manager'

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
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',     // 合同签订触发
  PERIODIC_RENT = 'PERIODIC_RENT',         // 周期性租金触发
  UTILITY_READING = 'UTILITY_READING',     // 水电抄表触发
  CONTRACT_RENEWAL = 'CONTRACT_RENEWAL',   // 合同续签触发
  MANUAL_CREATE = 'MANUAL_CREATE'          // 手动创建
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
  advanceDays?: number  // 提前生成天数
}

/**
 * 账单生成上下文
 */
export interface BillGenerationContext {
  contractId: string
  triggerType: BillTriggerType
  triggerData?: any  // 触发相关的数据（如抄表数据）
  generateDate?: Date
  dueDate?: Date
}

/**
 * 合同签订时自动生成账单
 * 
 * 生成规则：
 * 1. 押金账单 - 合同生效时一次性收取
 * 2. 租金账单 - 根据支付周期生成（月付/季付/年付）
 * 3. 其他费用 - 清洁费、钥匙押金等一次性费用
 */
export async function generateBillsOnContractSigned(contractId: string) {
  const logger = ErrorLogger.getInstance()
  
  try {
    logger.logInfo('开始生成合同账单', { 
      contractId, 
      module: 'auto-bill-generator',
      function: 'generateBillsOnContractSigned'
    })
    // 获取合同详情
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        room: { include: { building: true } },
        renter: true
      }
    })

    if (!contract) {
      throw new Error(`合同不存在: ${contractId}`)
    }

    const bills = []
    const now = new Date()

    // 1. 生成押金账单（一次性）
    if (Number(contract.deposit) > 0) {
      const depositBill = await prisma.bill.create({
        data: {
          billNumber: generateBillNumber('DEPOSIT', contract.contractNumber),
          type: 'DEPOSIT',
          amount: contract.deposit,
          receivedAmount: 0,
          pendingAmount: contract.deposit,
          dueDate: contract.startDate,
          period: `${contract.startDate.toISOString().slice(0, 10)} 至 ${contract.endDate.toISOString().slice(0, 10)}`,
          status: 'PENDING',
          contractId: contract.id,
          remarks: `押金账单 - 自动生成于合同签订`
        }
      })
      bills.push(depositBill)
    }

    // 2. 生成其他一次性费用账单
    if (contract.keyDeposit && Number(contract.keyDeposit) > 0) {
      const keyDepositBill = await prisma.bill.create({
        data: {
          billNumber: generateBillNumber('OTHER', contract.contractNumber),
          type: 'OTHER',
          amount: contract.keyDeposit,
          receivedAmount: 0,
          pendingAmount: contract.keyDeposit,
          dueDate: contract.startDate,
          period: `${contract.startDate.toISOString().slice(0, 10)} 至 ${contract.endDate.toISOString().slice(0, 10)}`,
          status: 'PENDING',
          contractId: contract.id,
          remarks: `钥匙押金 - 自动生成于合同签订`
        }
      })
      bills.push(keyDepositBill)
    }

    if (contract.cleaningFee && Number(contract.cleaningFee) > 0) {
      const cleaningBill = await prisma.bill.create({
        data: {
          billNumber: generateBillNumber('OTHER', contract.contractNumber),
          type: 'OTHER',
          amount: contract.cleaningFee,
          receivedAmount: 0,
          pendingAmount: contract.cleaningFee,
          dueDate: contract.startDate,
          period: `${contract.startDate.toISOString().slice(0, 10)} 至 ${contract.endDate.toISOString().slice(0, 10)}`,
          status: 'PENDING',
          contractId: contract.id,
          remarks: `清洁费 - 自动生成于合同签订`
        }
      })
      bills.push(cleaningBill)
    }

    // 3. 生成首期租金账单
    const firstRentBill = await generatePeriodicRentBill(contract, contract.startDate)
    if (firstRentBill) {
      bills.push(firstRentBill)
    }

    console.log(`合同 ${contract.contractNumber} 自动生成 ${bills.length} 个账单`)
    return bills

  } catch (error) {
    console.error('合同签订自动生成账单失败:', error)
    throw error
  }
}

/**
 * 生成周期性租金账单
 * 
 * 根据合同的支付周期自动生成租金账单：
 * - 月付：每月生成一个账单
 * - 季付：每季度生成一个账单  
 * - 年付：每年生成一个账单
 */
export async function generatePeriodicRentBill(contract: any, billDate: Date) {
  try {
    // 解析支付周期（从 paymentMethod 字段中提取）
    const paymentCycle = parsePaymentCycle(contract.paymentMethod || '月付')
    
    // 计算账单周期
    const { periodStart, periodEnd, dueDate } = calculateBillPeriod(billDate, paymentCycle)
    
    // 计算租金金额
    const rentAmount = calculateRentAmount(contract.monthlyRent, paymentCycle)

    const rentBill = await prisma.bill.create({
      data: {
        billNumber: generateBillNumber('RENT', contract.contractNumber),
        type: 'RENT',
        amount: rentAmount,
        receivedAmount: 0,
        pendingAmount: rentAmount,
        dueDate: dueDate,
        period: `${periodStart.toISOString().slice(0, 10)} 至 ${periodEnd.toISOString().slice(0, 10)}`,
        status: 'PENDING',
        contractId: contract.id,
        remarks: `${paymentCycle}租金账单 - 自动生成`
      }
    })

    return rentBill

  } catch (error) {
    console.error('生成周期性租金账单失败:', error)
    throw error
  }
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
      electricityPrice?: number  // 仪表配置的电费单价
      waterPrice?: number       // 仪表配置的水费单价
      gasPrice?: number         // 仪表配置的燃气单价
    }
  }
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { room: { include: { building: true } }, renter: true }
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
    const periodStart = new Date(readingDate.getFullYear(), readingDate.getMonth(), 1)
    const periodEnd = new Date(readingDate.getFullYear(), readingDate.getMonth() + 1, 0)
    const dueDate = new Date(periodEnd.getTime() + 10 * 24 * 60 * 60 * 1000) // 月末后10天到期

    // 构建详细的账单明细信息
    const utilityDetails = {
      period: `${periodStart.toISOString().slice(0, 10)} 至 ${periodEnd.toISOString().slice(0, 10)}`,
      breakdown: {
        electricity: {
           usage: readingData.electricityUsage,
           unitPrice: utilityResult.electricityPrice,
           amount: utilityResult.electricityCost,
           priceSource: readingData.meterPrices?.electricityPrice ? 'METER_CONFIG' : 'GLOBAL_SETTING'
         },
         water: {
           usage: readingData.waterUsage,
           unitPrice: utilityResult.waterPrice,
           amount: utilityResult.waterCost,
           priceSource: readingData.meterPrices?.waterPrice ? 'METER_CONFIG' : 'GLOBAL_SETTING'
         },
         gas: readingData.gasUsage ? {
           usage: readingData.gasUsage,
           unitPrice: utilityResult.gasPrice || 0,
           amount: utilityResult.gasCost || 0,
           priceSource: readingData.meterPrices?.gasPrice ? 'METER_CONFIG' : 'GLOBAL_SETTING'
         } : null
      },
      meterReadingIds: readingData.meterReadingIds || [],
      generationStrategy: readingData.aggregationStrategy || 'SINGLE',
      generatedAt: new Date().toISOString()
    }

    // 生成账单备注
    const remarkParts = []
    if (readingData.electricityUsage > 0) {
      remarkParts.push(`电费${utilityResult.electricityCost}元(${readingData.electricityUsage}度)`)
    }
    if (readingData.waterUsage > 0) {
      remarkParts.push(`水费${utilityResult.waterCost}元(${readingData.waterUsage}吨)`)
    }
    if (readingData.gasUsage && readingData.gasUsage > 0) {
      remarkParts.push(`燃气费${utilityResult.gasCost}元(${readingData.gasUsage}立方米)`)
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
               electricity: readingData.meterPrices?.electricityPrice ? 'METER_CONFIG' : 'GLOBAL_SETTING',
               water: readingData.meterPrices?.waterPrice ? 'METER_CONFIG' : 'GLOBAL_SETTING',
               gas: readingData.meterPrices?.gasPrice ? 'METER_CONFIG' : 'GLOBAL_SETTING'
             }
           }
        })
      }
    })

    // 如果有关联的抄表记录，更新其账单关联状态
    if (readingData.meterReadingIds && readingData.meterReadingIds.length > 0) {
      await prisma.meterReading.updateMany({
        where: {
          id: { in: readingData.meterReadingIds }
        },
        data: {
          isBilled: true,
          status: 'BILLED'
        }
      })
    }

    console.log(`合同 ${contract.contractNumber} 自动生成水电费账单: ${utilityResult.totalCost}元，价格来源: ${JSON.stringify(readingData.meterPrices)}`)
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
  const typePrefix = {
    'RENT': 'R',
    'DEPOSIT': 'D', 
    'UTILITIES': 'U',
    'OTHER': 'O'
  }[type] || 'B'
  
  return `BILL${contractNumber.slice(-3)}${typePrefix}${timestamp}`
}

/**
 * 解析支付周期
 */
function parsePaymentCycle(paymentMethod: string): 'MONTHLY' | 'QUARTERLY' | 'YEARLY' {
  if (paymentMethod.includes('季') || paymentMethod.includes('3个月')) {
    return 'QUARTERLY'
  }
  if (paymentMethod.includes('年') || paymentMethod.includes('12个月')) {
    return 'YEARLY'
  }
  return 'MONTHLY' // 默认月付
}

/**
 * 计算账单周期和到期日期
 */
function calculateBillPeriod(startDate: Date, paymentCycle: string) {
  const periodStart = new Date(startDate)
  let periodEnd: Date
  let dueDate: Date

  switch (paymentCycle) {
    case 'QUARTERLY':
      periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 3, 0)
      dueDate = new Date(periodStart.getFullYear(), periodStart.getMonth(), 15) // 每季度15日到期
      break
    case 'YEARLY':
      periodEnd = new Date(periodStart.getFullYear() + 1, periodStart.getMonth(), 0)
      dueDate = new Date(periodStart.getFullYear(), periodStart.getMonth(), 15) // 每年15日到期
      break
    default: // MONTHLY
      periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0)
      dueDate = new Date(periodStart.getFullYear(), periodStart.getMonth(), 15) // 每月15日到期
  }

  return { periodStart, periodEnd, dueDate }
}

/**
 * 根据支付周期计算租金金额
 */
function calculateRentAmount(monthlyRent: number, paymentCycle: string): number {
  switch (paymentCycle) {
    case 'QUARTERLY':
      return monthlyRent * 3
    case 'YEARLY':
      return monthlyRent * 12
    default: // MONTHLY
      return monthlyRent
  }
}

/**
 * 检查是否需要生成下期账单
 * 
 * 用于定时任务，检查即将到期的合同是否需要生成下期租金账单
 */
export async function checkAndGenerateUpcomingBills() {
  try {
    const settings = getSettings()
    const advanceDays = settings.reminderDays || 7 // 提前天数

    // 查找活跃合同
    const activeContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date() // 未到期的合同
        }
      },
      include: {
        room: { include: { building: true } },
        renter: true,
        bills: {
          where: {
            type: 'RENT',
            status: { in: ['PENDING', 'PAID'] }
          },
          orderBy: { dueDate: 'desc' },
          take: 1
        }
      }
    })

    const generatedBills = []

    for (const contract of activeContracts) {
      // 检查是否需要生成下期租金账单
      const lastRentBill = contract.bills[0]
      if (lastRentBill && contract.paymentMethod) {
        const nextBillDate = calculateNextBillDate(lastRentBill.dueDate, contract.paymentMethod)
        const shouldGenerate = shouldGenerateNextBill(nextBillDate, advanceDays)
        
        if (shouldGenerate) {
          const nextBill = await generatePeriodicRentBill(contract, nextBillDate)
          generatedBills.push(nextBill)
        }
      }
    }

    console.log(`定时任务生成了 ${generatedBills.length} 个即将到期的账单`)
    return generatedBills

  } catch (error) {
    console.error('检查并生成即将到期账单失败:', error)
    throw error
  }
}

/**
 * 计算下次账单日期
 */
function calculateNextBillDate(lastDueDate: Date, paymentMethod: string): Date {
  const paymentCycle = parsePaymentCycle(paymentMethod)
  const nextDate = new Date(lastDueDate)

  switch (paymentCycle) {
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    default: // MONTHLY
      nextDate.setMonth(nextDate.getMonth() + 1)
  }

  return nextDate
}

/**
 * 判断是否应该生成下期账单
 */
function shouldGenerateNextBill(nextBillDate: Date, advanceDays: number): boolean {
  const today = new Date()
  const generateDate = new Date(nextBillDate.getTime() - advanceDays * 24 * 60 * 60 * 1000)
  
  return today >= generateDate
}