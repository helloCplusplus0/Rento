import { NextRequest } from 'next/server'
import { contractQueries, roomQueries, meterQueries, meterReadingQueries } from '@/lib/queries'
import { prisma } from '@/lib/prisma'
import { 
  withApiErrorHandler, 
  createSuccessResponse,
  parseRequestBody,
  validateRequired
} from '@/lib/api-error-handler'
import { ErrorType, ErrorLogger } from '@/lib/error-logger'

/**
 * 合同退租API
 * POST /api/contracts/[id]/checkout
 * 
 * 根据moving_out_rental_chart.md设计实现退租功能
 * 复用现有的合同和账单管理逻辑
 */
async function handleCheckoutContract(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params
  const body = await parseRequestBody(request)
  
  const {
    checkoutDate,
    checkoutReason,
    damageAssessment = 0,
    finalMeterReadings = {},
    remarks
  } = body

  // 基础字段验证
  validateRequired(body, ['checkoutDate', 'checkoutReason'])

  // 验证退租日期
  const checkoutDateObj = new Date(checkoutDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (checkoutDateObj < today) {
    throw new Error('退租日期不能早于当前日期')
  }

  // 验证损坏赔偿金额
  if (damageAssessment < 0) {
    throw new Error('损坏赔偿金额不能为负数')
  }

  // 开始数据库事务
  return await prisma.$transaction(async (tx) => {
    const logger = ErrorLogger.getInstance()
    
    // 记录退租操作开始
    logger.logInfo('退租操作开始', {
      module: 'checkout-contract-api',
      function: 'handleCheckoutContract',
      contractId,
      checkoutDate: checkoutDateObj.toISOString(),
      checkoutReason,
      damageAssessment,
      hasFinalMeterReadings: Object.keys(finalMeterReadings).length > 0
    })
    // 1. 查询合同详情
    const contract = await tx.contract.findUnique({
      where: { id: contractId },
      include: {
        room: { include: { building: true } },
        renter: true,
        bills: {
          where: {
            status: { in: ['PENDING', 'OVERDUE'] }
          }
        }
      }
    })

    if (!contract) {
      throw new Error('合同不存在')
    }

    // 2. 业务验证阶段
    // 检查合同状态
    if (contract.status !== 'ACTIVE') {
      throw new Error(`合同状态不允许退租，当前状态：${contract.status}`)
    }

    // 检查退租日期不能晚于合同结束日期
    if (checkoutDateObj > contract.endDate) {
      throw new Error('退租日期不能晚于合同结束日期')
    }

    // 注释：允许有未付账单的合同进行退租
    // 退租时会自动处理所有未付账单的结清
    // 这符合实际业务场景：退租当日进行最终结算

    // 3. 计算退租结算
    const settlementResult = calculateCheckoutSettlement(
      contract,
      checkoutDateObj,
      damageAssessment
    )

    // 4. 生成结算账单（如果有退款或补缴）
    if (settlementResult.refundAmount > 0) {
      // 生成退款账单
      await tx.bill.create({
        data: {
          billNumber: `RF${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          type: 'OTHER',
          amount: -settlementResult.refundAmount, // 负数表示退款
          receivedAmount: 0,
          pendingAmount: -settlementResult.refundAmount,
          dueDate: checkoutDateObj,
          period: `退租结算-${checkoutDateObj.toISOString().split('T')[0]}`,
          status: 'PENDING',
          contractId: contractId,
          remarks: `退租结算：${settlementResult.description}`
        }
      })
    } else if (settlementResult.additionalAmount > 0) {
      // 生成补缴账单
      await tx.bill.create({
        data: {
          billNumber: `AD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          type: 'OTHER',
          amount: settlementResult.additionalAmount,
          receivedAmount: 0,
          pendingAmount: settlementResult.additionalAmount,
          dueDate: checkoutDateObj,
          period: `退租结算-${checkoutDateObj.toISOString().split('T')[0]}`,
          status: 'PENDING',
          contractId: contractId,
          remarks: `退租结算：${settlementResult.description}`
        }
      })
    }

    // 4.5. 自动结清所有未付账单
    // 退租时一次性结清所有权利和义务，将未付账单标记为已支付
    console.log(`[退租] 开始处理未付账单结清，合同ID: ${contractId}`)
    
    // 获取所有未付账单（不依赖contract.bills，直接查询数据库）
    const unpaidBills = await tx.bill.findMany({
      where: {
        contractId: contractId,
        status: { in: ['PENDING', 'OVERDUE'] }
      }
    })

    console.log(`[退租] 发现${unpaidBills.length}个未付账单需要结清`)

    // 逐个更新账单状态
    for (const bill of unpaidBills) {
      console.log(`[退租] 结清账单: ${bill.billNumber}, 金额: ${bill.amount}`)
      await tx.bill.update({
        where: { id: bill.id },
        data: {
          status: 'PAID',
          receivedAmount: bill.amount,
          pendingAmount: 0,
          paidDate: checkoutDateObj,
          paymentMethod: '退租结算',
          operator: '系统自动',
          remarks: '退租时自动结清'
        }
      })
    }

    console.log(`[退租] 账单结清完成，共处理${unpaidBills.length}个账单`)

    // 5. 更新合同状态
    const updatedContract = await tx.contract.update({
      where: { id: contractId },
      data: {
        status: 'TERMINATED',
        businessStatus: 'CHECKED_OUT',
        updatedAt: new Date(),
        remarks: remarks ? 
          `${contract.remarks || ''}\n\n[退租记录 ${checkoutDateObj.toISOString().split('T')[0]}]\n退租原因: ${checkoutReason}\n${remarks}` :
          `${contract.remarks || ''}\n\n[退租记录 ${checkoutDateObj.toISOString().split('T')[0]}]\n退租原因: ${checkoutReason}`
      }
    })

    // 6. 更新房间状态
    await tx.room.update({
      where: { id: contract.roomId },
      data: {
        status: 'VACANT',
        currentRenter: null,
        overdueDays: null,
        updatedAt: new Date()
      }
    })

    // 7. 处理水电表状态和最终读数
    const roomMeters = await tx.meter.findMany({
      where: { roomId: contract.roomId, isActive: true }
    })

    const meterProcessingResults = []
    for (const meter of roomMeters) {
      const meterTypeKey = meter.meterType.toLowerCase()
      const finalReading = finalMeterReadings[meterTypeKey]
      
      if (finalReading && finalReading > 0) {
        // 获取最新抄表记录
        const latestReading = await tx.meterReading.findFirst({
          where: { meterId: meter.id },
          orderBy: { readingDate: 'desc' }
        })

        const previousReading = latestReading?.currentReading || 0
        const usage = Math.max(0, finalReading - Number(previousReading))
        const amount = usage * Number(meter.unitPrice)

        // 创建最终抄表记录
        const finalMeterReading = await tx.meterReading.create({
          data: {
            meterId: meter.id,
            contractId: contractId,
            previousReading: Number(previousReading),
            currentReading: finalReading,
            usage: usage,
            readingDate: checkoutDateObj,
            period: `退租结算-${checkoutDateObj.toISOString().split('T')[0]}`,
            unitPrice: Number(meter.unitPrice),
            amount: amount,
            status: 'CONFIRMED',
            operator: '退租结算',
            remarks: '退租时最终读数'
          }
        })

        // 如果有用量，生成水电费账单
        if (usage > 0 && amount > 0) {
          await tx.bill.create({
            data: {
              billNumber: `UT${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
              type: 'UTILITIES',
              amount: amount,
              receivedAmount: 0,
              pendingAmount: amount,
              dueDate: checkoutDateObj,
              period: `退租结算-${meter.displayName}-${checkoutDateObj.toISOString().split('T')[0]}`,
              status: 'PAID', // 退租时直接标记为已支付
              contractId: contractId,
              paymentMethod: '退租结算',
              operator: '系统自动',
              remarks: `退租时${meter.displayName}用量结算：${usage}${meter.unit}`
            }
          })
        }

        meterProcessingResults.push({
          meterId: meter.id,
          meterType: meter.meterType,
          displayName: meter.displayName,
          previousReading: Number(previousReading),
          finalReading: finalReading,
          usage: usage,
          amount: amount,
          readingId: finalMeterReading.id
        })
      }
    }

    // 8. 更新租客状态和退租记录
    await tx.renter.update({
      where: { id: contract.renterId },
      data: {
        updatedAt: new Date(),
        remarks: `${contract.renter.remarks || ''}\n[退租记录 ${checkoutDateObj.toISOString().split('T')[0]}] 合同${contract.contractNumber}正常退租`
      }
    })

    // 9. 记录完整的退租操作日志
    logger.logInfo('退租操作完成', {
      module: 'checkout-contract-api',
      function: 'handleCheckoutContract',
      contractId,
      operationDetails: {
        contractStatus: { from: 'ACTIVE', to: 'TERMINATED' },
        roomStatus: { from: 'OCCUPIED', to: 'VACANT' },
        billsProcessed: contract.bills.length,
        metersProcessed: meterProcessingResults.length,
        totalMeterUsage: meterProcessingResults.reduce((sum, m) => sum + m.usage, 0),
        totalMeterAmount: meterProcessingResults.reduce((sum, m) => sum + m.amount, 0),
        settlementAmount: settlementResult.refundAmount || settlementResult.additionalAmount || 0,
        settlementType: settlementResult.refundAmount > 0 ? 'REFUND' : 
                       settlementResult.additionalAmount > 0 ? 'CHARGE' : 'BALANCED'
      },
      affectedEntities: {
        contract: { id: contractId, status: 'TERMINATED' },
        room: { id: contract.roomId, status: 'VACANT' },
        renter: { id: contract.renterId, name: contract.renter.name },
        bills: contract.bills.map(b => ({ id: b.id, status: 'PAID' })),
        meters: meterProcessingResults.map(m => ({ 
          id: m.meterId, 
          type: m.meterType, 
          finalReading: m.finalReading,
          usage: m.usage,
          amount: m.amount
        }))
      }
    })

    return {
      contract: updatedContract,
      settlement: settlementResult,
      meterProcessing: meterProcessingResults
    }
  })
}

/**
 * 计算退租结算
 */
function calculateCheckoutSettlement(
  contract: any,
  checkoutDate: Date,
  damageAssessment: number
) {
  const startDate = new Date(contract.startDate)
  const endDate = new Date(contract.endDate)
  const monthlyRent = Number(contract.monthlyRent)
  const deposit = Number(contract.deposit)

  // 计算实际居住天数
  const actualDays = Math.ceil((checkoutDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  // 计算合同总天数
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  // 计算应付租金（按日计算）
  const dailyRent = monthlyRent / 30 // 简化计算，按30天/月
  const shouldPayRent = Math.round(actualDays * dailyRent * 100) / 100
  
  // 计算已付租金（从totalRent推算）
  const totalRent = Number(contract.totalRent)
  const paidRent = totalRent
  
  // 计算租金差额
  const rentDifference = paidRent - shouldPayRent
  
  // 计算押金退还（扣除损坏赔偿）
  const depositRefund = Math.max(0, deposit - damageAssessment)
  
  // 计算最终结算
  let refundAmount = 0
  let additionalAmount = 0
  let description = ''

  if (rentDifference > 0) {
    // 有多付租金，加上押金退还
    refundAmount = rentDifference + depositRefund
    description = `多付租金退还: ¥${rentDifference.toFixed(2)}, 押金退还: ¥${depositRefund.toFixed(2)}`
    if (damageAssessment > 0) {
      description += `, 扣除损坏赔偿: ¥${damageAssessment.toFixed(2)}`
    }
  } else if (rentDifference < 0) {
    // 需要补缴租金
    const needPay = Math.abs(rentDifference)
    if (depositRefund >= needPay) {
      // 押金足够抵扣
      refundAmount = depositRefund - needPay
      description = `押金抵扣欠缴租金: ¥${needPay.toFixed(2)}, 押金退还: ¥${refundAmount.toFixed(2)}`
    } else {
      // 押金不够，需要额外支付
      additionalAmount = needPay - depositRefund
      description = `押金全部抵扣: ¥${depositRefund.toFixed(2)}, 需补缴: ¥${additionalAmount.toFixed(2)}`
    }
    if (damageAssessment > 0) {
      description += `, 扣除损坏赔偿: ¥${damageAssessment.toFixed(2)}`
    }
  } else {
    // 租金刚好，只退押金
    refundAmount = depositRefund
    description = `押金退还: ¥${depositRefund.toFixed(2)}`
    if (damageAssessment > 0) {
      description += `, 扣除损坏赔偿: ¥${damageAssessment.toFixed(2)}`
    }
  }

  return {
    actualDays,
    totalDays,
    shouldPayRent,
    paidRent,
    rentDifference,
    depositRefund,
    refundAmount,
    additionalAmount,
    damageAssessment,
    description
  }
}

/**
 * 退租后处理（在事务外调用）
 */
async function handleCheckoutContractWithSettlement(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = ErrorLogger.getInstance()
  const contractId = (await params).id
  
  try {
    // 执行退租事务
    const result = await handleCheckoutContract(request, { params })
    
    // 计算详细结算明细
    const settlement = calculateDetailedSettlement(result.contract, result.settlement)
    
    // 记录退租成功日志
    logger.logInfo('退租流程成功完成', {
      module: 'checkout-contract-api',
      function: 'handleCheckoutContractWithSettlement',
      contractId,
      finalResult: {
        contractTerminated: true,
        settlementCalculated: true,
        meterReadingsProcessed: result.meterProcessing?.length || 0,
        totalSettlementAmount: settlement.summary?.netAmount || 0,
        settlementType: settlement.summary?.settlementType || 'BALANCED'
      }
    })
    
    // 返回退租成功信息
    return createSuccessResponse({
      contractId,
      contract: {
        ...result.contract,
        monthlyRent: Number(result.contract.monthlyRent),
        totalRent: Number(result.contract.totalRent),
        deposit: Number(result.contract.deposit),
        keyDeposit: result.contract.keyDeposit ? Number(result.contract.keyDeposit) : null,
        cleaningFee: result.contract.cleaningFee ? Number(result.contract.cleaningFee) : null
      },
      settlement,
      meterProcessing: result.meterProcessing
    }, '退租成功')
  } catch (error) {
    // 记录退租失败日志
    await logger.logError(
      ErrorType.SYSTEM_ERROR,
      'HIGH' as any,
      `退租操作失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        module: 'checkout-contract-api',
        function: 'handleCheckoutContractWithSettlement',
        contractId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      },
      error instanceof Error ? error : undefined
    )
    
    throw error
  }
}

/**
 * 计算详细结算明细（用于前端展示）
 */
function calculateDetailedSettlement(contract: any, basicSettlement: any) {
  const keyDepositRefund = contract.keyDeposit ? Number(contract.keyDeposit) : 0
  
  return {
    refundItems: {
      rentRefund: Math.max(0, basicSettlement.rentDifference),
      depositRefund: basicSettlement.depositRefund,
      keyDepositRefund,
      subtotal: Math.max(0, basicSettlement.rentDifference) + basicSettlement.depositRefund + keyDepositRefund
    },
    chargeItems: {
      rentCharge: Math.max(0, -basicSettlement.rentDifference),
      damageCharge: basicSettlement.damageAssessment || 0,
      cleaningCharge: 0,
      subtotal: Math.max(0, -basicSettlement.rentDifference) + (basicSettlement.damageAssessment || 0)
    },
    summary: {
      totalRefund: Math.max(0, basicSettlement.rentDifference) + basicSettlement.depositRefund + keyDepositRefund,
      totalCharge: Math.max(0, -basicSettlement.rentDifference) + (basicSettlement.damageAssessment || 0),
      netAmount: basicSettlement.refundAmount - basicSettlement.additionalAmount,
      settlementType: basicSettlement.refundAmount > basicSettlement.additionalAmount ? 'REFUND' : 
                     basicSettlement.refundAmount < basicSettlement.additionalAmount ? 'CHARGE' : 'BALANCED'
    }
  }
}

export const POST = withApiErrorHandler(handleCheckoutContractWithSettlement, {
  module: 'checkout-contract-api',
  errorType: ErrorType.VALIDATION_ERROR,
  enableFallback: true
})