import { calculateUtilityBill } from '@/lib/bill-calculations'
import { prisma } from '@/lib/prisma'

/**
 * 账单聚合策略枚举
 */
export enum AggregationStrategy {
  SINGLE = 'SINGLE', // 单仪表账单
  AGGREGATED = 'AGGREGATED', // 聚合账单
}

/**
 * 抄表数据接口
 */
export interface MeterReadingData {
  meterId: string
  meterReadingId: string
  meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  meterName: string
  usage: number
  unitPrice: number
  amount: number
  unit: string
  previousReading?: number
  currentReading: number
  readingDate: Date
  priceSource: 'METER_CONFIG' | 'GLOBAL_SETTING'
}

/**
 * 聚合账单生成选项
 */
export interface AggregationOptions {
  strategy: AggregationStrategy
  period: string
  contractId: string
  contractNumber: string
}

/**
 * 智能账单聚合生成器
 * 根据策略生成单仪表账单或聚合账单
 */
export async function generateAggregatedUtilityBill(
  readingDataList: MeterReadingData[],
  options: AggregationOptions
) {
  if (options.strategy === AggregationStrategy.SINGLE) {
    // 单仪表模式：为每个仪表生成独立账单
    return await generateSingleMeterBills(readingDataList, options)
  } else {
    // 聚合模式：生成一个聚合账单
    return await generateAggregatedBill(readingDataList, options)
  }
}

/**
 * 生成单仪表账单 (保持向后兼容)
 */
async function generateSingleMeterBills(
  readingDataList: MeterReadingData[],
  options: AggregationOptions
) {
  const bills = []

  for (const readingData of readingDataList) {
    const bill = await prisma.bill.create({
      data: {
        billNumber: generateBillNumber('UTILITIES', options.contractNumber),
        type: 'UTILITIES',
        amount: readingData.amount,
        receivedAmount: 0,
        pendingAmount: readingData.amount,
        dueDate: calculateDueDate(readingData.readingDate),
        period: options.period,
        status: 'PENDING',
        contractId: options.contractId,

        meterReadingId: readingData.meterReadingId, // 向后兼容
        remarks: generateSingleMeterRemarks(readingData),
        metadata: JSON.stringify({
          triggerType: 'UTILITY_READING',
          generatedAt: new Date().toISOString(),
          meterType: readingData.meterType,
          usage: readingData.usage,
          unitPrice: readingData.unitPrice,
          priceSource: readingData.priceSource,
        }),
      },
    })

    bills.push(bill)
  }

  return bills
}

/**
 * 生成聚合账单
 */
async function generateAggregatedBill(
  readingDataList: MeterReadingData[],
  options: AggregationOptions
) {
  console.log(`[账单] 开始生成聚合账单，包含${readingDataList.length}个仪表`)

  return await prisma.$transaction(async (tx) => {
    // 1. 计算总金额
    const totalAmount = readingDataList.reduce(
      (sum, data) => sum + data.amount,
      0
    )
    console.log(`[账单] 计算总金额: ${totalAmount}元`)

    // 2. 创建聚合账单
    const bill = await tx.bill.create({
      data: {
        billNumber: generateBillNumber('UTILITIES', options.contractNumber),
        type: 'UTILITIES',
        amount: totalAmount,
        receivedAmount: 0,
        pendingAmount: totalAmount,
        dueDate: calculateDueDate(readingDataList[0].readingDate),
        period: options.period,
        status: 'PENDING',
        contractId: options.contractId,
        remarks: generateAggregatedRemarks(readingDataList),
        metadata: JSON.stringify({
          triggerType: 'UTILITY_READING',
          generatedAt: new Date().toISOString(),
          aggregationStrategy: 'AGGREGATED',
          meterCount: readingDataList.length,
          totalUsage: readingDataList.reduce(
            (sum, data) => sum + data.usage,
            0
          ),
          breakdown: readingDataList.map((data) => ({
            meterType: data.meterType,
            meterName: data.meterName,
            usage: data.usage,
            unitPrice: data.unitPrice,
            amount: data.amount,
            priceSource: data.priceSource,
          })),
        }),
      },
    })

    console.log(`[账单] 创建聚合账单: ${bill.billNumber}`)

    // 3. 创建账单明细
    for (const readingData of readingDataList) {
      await tx.billDetail.create({
        data: {
          billId: bill.id,
          meterReadingId: readingData.meterReadingId,
          meterType: readingData.meterType,
          meterName: readingData.meterName,
          usage: readingData.usage,
          unitPrice: readingData.unitPrice,
          amount: readingData.amount,
          unit: readingData.unit,
          previousReading: readingData.previousReading || 0,
          currentReading: readingData.currentReading,
          readingDate: readingData.readingDate,
          priceSource: readingData.priceSource,
        },
      })
      console.log(
        `[账单] 创建明细: ${readingData.meterName} ${readingData.usage}${readingData.unit}`
      )
    }

    // 4. 更新抄表记录状态
    const meterReadingIds = readingDataList.map((data) => data.meterReadingId)
    const updateResult = await tx.meterReading.updateMany({
      where: {
        id: { in: meterReadingIds },
      },
      data: {
        isBilled: true,
        status: 'BILLED',
      },
    })

    console.log(`[账单] 更新${updateResult.count}个抄表记录状态为BILLED`)

    return bill
  })
}

/**
 * 按合同分组抄表数据
 */
export function groupReadingsByContract(
  readings: any[]
): Map<string, MeterReadingData[]> {
  const grouped = new Map<string, MeterReadingData[]>()

  console.log(`[聚合] 开始分组 ${readings.length} 个抄表记录`)

  for (const reading of readings) {
    // 增强数据验证
    if (!reading.contractId) {
      console.warn(`[聚合] 跳过无合同ID的抄表记录: ${reading.id}`)
      continue
    }

    if (!reading.meter) {
      console.warn(`[聚合] 跳过无仪表信息的抄表记录: ${reading.id}`)
      continue
    }

    // 确保必要字段存在
    const readingData: MeterReadingData = {
      meterId: reading.meterId,
      meterReadingId: reading.id,
      meterType: reading.meter.meterType || reading.meterType,
      meterName:
        reading.meter.displayName ||
        reading.meter.name ||
        `${reading.meterType}表`,
      usage: Number(reading.usage) || 0,
      unitPrice:
        Number(reading.unitPrice) || Number(reading.meter.unitPrice) || 0,
      amount: Number(reading.amount) || 0,
      unit: reading.meter.unit || '度',
      previousReading: reading.previousReading
        ? Number(reading.previousReading)
        : 0,
      currentReading: Number(reading.currentReading) || 0,
      readingDate: new Date(reading.readingDate || new Date()),
      priceSource: reading.meter.unitPrice ? 'METER_CONFIG' : 'GLOBAL_SETTING',
    }

    // 数据完整性验证 - 如果金额为0但有用量和单价，重新计算
    if (
      readingData.amount === 0 &&
      readingData.usage > 0 &&
      readingData.unitPrice > 0
    ) {
      readingData.amount = readingData.usage * readingData.unitPrice
      console.log(
        `[聚合] 重新计算金额: ${readingData.meterName} ${readingData.usage} × ${readingData.unitPrice} = ${readingData.amount}`
      )
    }

    if (!grouped.has(reading.contractId)) {
      grouped.set(reading.contractId, [])
    }

    grouped.get(reading.contractId)!.push(readingData)
    console.log(
      `[聚合] 添加到合同 ${reading.contractId}: ${readingData.meterName} ${readingData.usage}${readingData.unit} = ${readingData.amount}元`
    )
  }

  console.log(`[聚合] 分组完成，共 ${grouped.size} 个合同`)
  for (const [contractId, contractReadings] of grouped) {
    console.log(
      `[聚合] - 合同 ${contractId}: ${contractReadings.length} 个仪表`
    )
  }

  return grouped
}

/**
 * 智能选择聚合策略
 */
export function selectAggregationStrategy(
  readingDataList: MeterReadingData[],
  userPreference?: string
): AggregationStrategy {
  console.log(
    `[策略] 选择聚合策略: 仪表数量=${readingDataList.length}, 用户偏好=${userPreference}`
  )

  // 数据验证
  if (!readingDataList || readingDataList.length === 0) {
    console.warn(`[策略] 无有效抄表数据，使用单独策略`)
    return AggregationStrategy.SINGLE
  }

  // 用户明确指定策略 - 严格匹配
  if (
    userPreference === 'AGGREGATED' ||
    userPreference === AggregationStrategy.AGGREGATED
  ) {
    console.log(`[策略] 用户指定聚合策略: AGGREGATED`)
    return AggregationStrategy.AGGREGATED
  }

  if (
    userPreference === 'SINGLE' ||
    userPreference === AggregationStrategy.SINGLE
  ) {
    console.log(`[策略] 用户指定单独策略: SINGLE`)
    return AggregationStrategy.SINGLE
  }

  // 智能判断：多个仪表默认聚合，单个仪表默认单独
  const strategy =
    readingDataList.length > 1
      ? AggregationStrategy.AGGREGATED
      : AggregationStrategy.SINGLE

  console.log(
    `[策略] 智能选择策略: ${strategy} (基于${readingDataList.length}个仪表)`
  )
  return strategy
}

/**
 * 生成账单编号
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
 * 计算到期日期
 */
function calculateDueDate(readingDate: Date): Date {
  const dueDate = new Date(readingDate)
  dueDate.setDate(dueDate.getDate() + 10) // 抄表后10天到期
  return dueDate
}

/**
 * 生成单仪表账单备注
 */
function generateSingleMeterRemarks(readingData: MeterReadingData): string {
  const meterTypeName =
    {
      ELECTRICITY: '电费',
      COLD_WATER: '冷水费',
      HOT_WATER: '热水费',
      GAS: '燃气费',
    }[readingData.meterType] || '水电费'

  return `${meterTypeName}账单 - ${meterTypeName}${readingData.amount}元(${readingData.usage}${readingData.unit})`
}

/**
 * 生成聚合账单备注
 */
function generateAggregatedRemarks(
  readingDataList: MeterReadingData[]
): string {
  const remarkParts = []

  for (const data of readingDataList) {
    const meterTypeName =
      {
        ELECTRICITY: '电费',
        COLD_WATER: '冷水费',
        HOT_WATER: '热水费',
        GAS: '燃气费',
      }[data.meterType] || '水电费'

    remarkParts.push(
      `${meterTypeName}${data.amount}元(${data.usage}${data.unit})`
    )
  }

  return `水电费账单 - ${remarkParts.join('，')}`
}

/**
 * 生成账期描述
 */
export function generatePeriod(readingDate: Date): string {
  const year = readingDate.getFullYear()
  const month = readingDate.getMonth()

  const periodStart = new Date(year, month, 1)
  const periodEnd = new Date(year, month + 1, 0)

  return `${periodStart.toISOString().slice(0, 10)} 至 ${periodEnd.toISOString().slice(0, 10)}`
}
