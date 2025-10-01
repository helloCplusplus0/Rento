import { prisma } from '@/lib/prisma'

import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'

/**
 * 账单明细修复工具
 * 用于修复历史账单缺失的明细数据
 */

interface RepairResult {
  success: boolean
  repairedCount: number
  skippedCount: number
  errors: string[]
}

/**
 * 修复所有缺失明细的UTILITIES类型账单
 */
export async function repairAllUtilityBillDetails(): Promise<RepairResult> {
  console.log('[修复工具] 开始修复所有水电费账单明细')

  const result: RepairResult = {
    success: true,
    repairedCount: 0,
    skippedCount: 0,
    errors: [],
  }

  try {
    // 查找所有没有明细的UTILITIES类型账单
    const billsWithoutDetails = await prisma.bill.findMany({
      where: {
        type: 'UTILITIES',
        billDetails: { none: {} },
      },
      include: {
        contract: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(
      `[修复工具] 找到 ${billsWithoutDetails.length} 个需要修复的账单`
    )

    for (const bill of billsWithoutDetails) {
      try {
        const repaired = await repairSingleBillDetails(bill)
        if (repaired) {
          result.repairedCount++
          console.log(`[修复工具] 成功修复账单: ${bill.billNumber}`)
        } else {
          result.skippedCount++
          console.log(
            `[修复工具] 跳过账单: ${bill.billNumber} (无法找到相关抄表记录)`
          )
        }
      } catch (error) {
        const errorMsg = `修复账单 ${bill.billNumber} 失败: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
        console.error(`[修复工具] ${errorMsg}`)

        // 使用统一的错误日志记录
        const logger = ErrorLogger.getInstance()
        await logger.logError(
          ErrorType.BILL_GENERATION,
          ErrorSeverity.MEDIUM,
          `账单明细修复失败: ${errorMsg}`,
          {
            module: 'BillDetailRepair',
            function: 'repairAllUtilityBillDetails',
            billId: bill.id,
            billNumber: bill.billNumber,
          },
          error instanceof Error ? error : undefined
        )
      }
    }

    console.log(
      `[修复工具] 修复完成: 成功 ${result.repairedCount} 个, 跳过 ${result.skippedCount} 个, 错误 ${result.errors.length} 个`
    )
  } catch (error) {
    result.success = false
    const errorMsg = `修复过程失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    result.errors.push(errorMsg)

    // 使用统一的错误日志记录
    const logger = ErrorLogger.getInstance()
    await logger.logError(
      ErrorType.BILL_GENERATION,
      ErrorSeverity.HIGH,
      `账单明细修复过程失败: ${errorMsg}`,
      {
        module: 'BillDetailRepair',
        function: 'repairAllUtilityBillDetails',
      },
      error instanceof Error ? error : undefined
    )
  }

  return result
}

interface DetailFromReading {
  meterReadingId: string
  meterType: string
  meterName: string
  usage: number
  unitPrice: number
  amount: number
  unit: string
  previousReading: number | null
  currentReading: number
  readingDate: Date
  priceSource: string
}

/**
 * 修复单个账单的明细数据
 */
export async function repairSingleBillDetails(bill: any): Promise<boolean> {
  console.log(`[修复工具] 开始修复账单: ${bill.billNumber}`)

  // 1. 检查是否已有明细
  const existingDetails = await prisma.billDetail.count({
    where: { billId: bill.id },
  })

  if (existingDetails > 0) {
    console.log(`[修复工具] 账单 ${bill.billNumber} 已有明细，跳过修复`)
    return false
  }

  // 2. 尝试从metadata中获取明细信息
  let detailsFromMetadata: any[] = []
  if (bill.metadata) {
    try {
      const metadata =
        typeof bill.metadata === 'string'
          ? JSON.parse(bill.metadata)
          : bill.metadata
      if (metadata.breakdown && Array.isArray(metadata.breakdown)) {
        detailsFromMetadata = metadata.breakdown
        console.log(
          `[修复工具] 从metadata中找到 ${detailsFromMetadata.length} 条明细信息`
        )
      }
    } catch (error) {
      console.warn(
        `[修复工具] 解析账单 ${bill.billNumber} 的metadata失败:`,
        error
      )
    }
  }

  // 3. 尝试从相关抄表记录获取明细信息
  let detailsFromReadings: DetailFromReading[] = []
  const relatedReadings = await prisma.meterReading.findMany({
    where: {
      contractId: bill.contractId,
      createdAt: {
        gte: new Date(new Date(bill.createdAt).getTime() - 10 * 60 * 1000), // 账单创建前10分钟
        lte: new Date(new Date(bill.createdAt).getTime() + 10 * 60 * 1000), // 账单创建后10分钟
      },
    },
    include: { meter: true },
    orderBy: { createdAt: 'desc' },
  })

  if (relatedReadings.length > 0) {
    console.log(`[修复工具] 找到 ${relatedReadings.length} 个相关抄表记录`)
    detailsFromReadings = relatedReadings.map((reading) => ({
      meterReadingId: reading.id,
      meterType: reading.meter.meterType,
      meterName: reading.meter.displayName,
      usage: Number(reading.usage),
      unitPrice: Number(reading.unitPrice),
      amount: Number(reading.amount),
      unit: reading.meter.unit,
      previousReading: reading.previousReading
        ? Number(reading.previousReading)
        : null,
      currentReading: Number(reading.currentReading),
      readingDate: reading.readingDate,
      priceSource: 'METER_CONFIG',
    }))
  }

  // 4. 选择最佳的明细数据源
  let detailsToCreate: any[] = []

  if (detailsFromMetadata.length > 0 && detailsFromReadings.length > 0) {
    // 优先使用metadata中的数据，但补充抄表记录的关联信息
    detailsToCreate = detailsFromMetadata.map((metaDetail: any) => {
      const matchingReading = detailsFromReadings.find(
        (reading) =>
          reading.meterType === metaDetail.meterType &&
          Math.abs(reading.usage - metaDetail.usage) < 0.01
      )

      return {
        ...metaDetail,
        meterReadingId: matchingReading?.meterReadingId || null,
        readingDate: matchingReading?.readingDate || bill.createdAt,
        previousReading: matchingReading?.previousReading || null,
        currentReading: matchingReading?.currentReading || null,
        unit: matchingReading?.unit || '度',
      }
    })
  } else if (detailsFromReadings.length > 0) {
    // 使用抄表记录数据
    detailsToCreate = detailsFromReadings
  } else if (detailsFromMetadata.length > 0) {
    // 仅使用metadata数据
    detailsToCreate = detailsFromMetadata.map((metaDetail: any) => ({
      ...metaDetail,
      meterReadingId: null,
      readingDate: bill.createdAt,
      previousReading: null,
      currentReading: null,
      unit: '度',
    }))
  } else {
    console.log(`[修复工具] 账单 ${bill.billNumber} 无法找到明细数据源`)
    return false
  }

  // 5. 创建明细记录
  if (detailsToCreate.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const detail of detailsToCreate) {
        await tx.billDetail.create({
          data: {
            billId: bill.id,
            meterReadingId: detail.meterReadingId,
            meterType: detail.meterType,
            meterName: detail.meterName,
            usage: detail.usage,
            unitPrice: detail.unitPrice,
            amount: detail.amount,
            unit: detail.unit,
            previousReading: detail.previousReading || 0,
            currentReading: detail.currentReading || detail.usage,
            readingDate: detail.readingDate,
            priceSource: detail.priceSource || 'METER_CONFIG',
          },
        })
      }
    })

    console.log(
      `[修复工具] 为账单 ${bill.billNumber} 创建了 ${detailsToCreate.length} 条明细记录`
    )
    return true
  }

  return false
}

/**
 * 验证账单明细数据的完整性
 */
export async function validateBillDetailsIntegrity(): Promise<{
  totalBills: number
  billsWithDetails: number
  billsWithoutDetails: number
  utilityBillsWithoutDetails: number
}> {
  console.log('[验证工具] 开始验证账单明细数据完整性')

  const totalBills = await prisma.bill.count()

  const billsWithDetails = await prisma.bill.count({
    where: {
      billDetails: { some: {} },
    },
  })

  const billsWithoutDetails = totalBills - billsWithDetails

  const utilityBillsWithoutDetails = await prisma.bill.count({
    where: {
      type: 'UTILITIES',
      billDetails: { none: {} },
    },
  })

  const result = {
    totalBills,
    billsWithDetails,
    billsWithoutDetails,
    utilityBillsWithoutDetails,
  }

  console.log('[验证工具] 验证结果:', result)
  return result
}

/**
 * 清理重复的明细记录
 */
export async function cleanupDuplicateDetails(): Promise<number> {
  console.log('[清理工具] 开始清理重复的明细记录')

  let cleanedCount = 0

  // 查找有重复明细的账单
  const billsWithMultipleDetails = await prisma.bill.findMany({
    where: {
      billDetails: { some: {} },
    },
    include: {
      billDetails: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  for (const bill of billsWithMultipleDetails) {
    const detailGroups = new Map<string, any[]>()

    // 按meterType和meterReadingId分组
    for (const detail of bill.billDetails) {
      const key = `${detail.meterType}_${detail.meterReadingId || 'null'}`
      if (!detailGroups.has(key)) {
        detailGroups.set(key, [])
      }
      detailGroups.get(key)!.push(detail)
    }

    // 删除重复记录，保留最早创建的
    for (const [key, details] of detailGroups) {
      if (details.length > 1) {
        const toDelete = details.slice(1) // 保留第一个，删除其余
        for (const detail of toDelete) {
          await prisma.billDetail.delete({
            where: { id: detail.id },
          })
          cleanedCount++
          console.log(`[清理工具] 删除重复明细: ${detail.id}`)
        }
      }
    }
  }

  console.log(`[清理工具] 清理完成，删除了 ${cleanedCount} 条重复记录`)
  return cleanedCount
}
