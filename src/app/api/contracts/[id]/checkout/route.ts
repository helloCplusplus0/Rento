import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  parseRequestBody,
  validateRequired,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { getOptionalSession } from '@/lib/auth/guard'
import { BILL_AMOUNT_EPSILON, toBillAmount } from '@/lib/bill-semantics'
import {
  applyCheckoutSettlementSubmission,
  buildCheckoutBillStatusAfterSettlement,
  calculateCheckoutSettlement,
  type CheckoutSettlementSubmissionItem,
} from '@/lib/checkout-settlement'
import { ErrorLogger, ErrorType } from '@/lib/error-logger'
import { createCheckoutFinalReadingsTx } from '@/lib/domain/meters'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { prisma } from '@/lib/prisma'

function appendAuditRemark(existingRemark: string | null, auditRemark: string) {
  return [existingRemark?.trim(), auditRemark.trim()].filter(Boolean).join('\n')
}

function buildCheckoutSettlementBillData(params: {
  contractId: string
  checkoutDate: Date
  operator: string
  settlement: ReturnType<typeof applyCheckoutSettlementSubmission>
  metadata: string
}) {
  const billDateKey = params.checkoutDate.toISOString().split('T')[0]
  const settlementAmount = toBillAmount(Math.abs(params.settlement.summary.netAmount))
  const settlementType = params.settlement.summary.settlementType
  const billPrefix =
    settlementType === 'REFUND'
      ? 'RF'
      : settlementType === 'CHARGE'
        ? 'AD'
        : 'BL'

  return {
    billNumber: `${billPrefix}${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    type: 'OTHER' as const,
    amount:
      settlementType === 'REFUND'
        ? -settlementAmount
        : settlementType === 'CHARGE'
          ? settlementAmount
          : 0,
    receivedAmount: settlementType === 'CHARGE' ? settlementAmount : 0,
    pendingAmount: 0,
    dueDate: params.checkoutDate,
    paidDate: params.checkoutDate,
    period: `退租结算-${billDateKey}`,
    status: 'COMPLETED' as const,
    contractId: params.contractId,
    paymentMethod: '退租结算',
    operator: params.operator,
    remarks: `退租结算：${params.settlement.description}`,
    metadata: params.metadata,
  }
}

function buildSettlementAuditMetadata(params: {
  contractId: string
  checkoutDate: Date
  checkoutReason: string
  operator: string
  settlement: ReturnType<typeof applyCheckoutSettlementSubmission>
}) {
  return JSON.stringify({
    source: 'checkout-settlement',
    contractId: params.contractId,
    checkoutDate: params.checkoutDate.toISOString(),
    checkoutReason: params.checkoutReason,
    operator: params.operator,
    generatedAt: new Date().toISOString(),
    summary: params.settlement.summary,
    items: params.settlement.submissionItems.map((item) => ({
      id: item.id,
      name: item.name,
      sourceType: item.sourceType,
      direction: item.direction,
      billId: item.billId ?? null,
      originalAmount: item.originalAmount,
      adjustedAmount: item.adjustedAmount,
      adjustmentReason: item.adjustmentReason || null,
    })),
  })
}

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
    remarks,
    settlementItems,
  } = body

  // 基础字段验证
  validateRequired(body, ['checkoutDate', 'checkoutReason'])
  if (!Array.isArray(settlementItems) || settlementItems.length === 0) {
    throw new Error('缺少正式结算明细，请刷新页面后重试')
  }

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
    const session = await getOptionalSession(request)
    const operatorName = session?.username ?? '管理员'

    // 记录退租操作开始
    logger.logInfo('退租操作开始', {
      module: 'checkout-contract-api',
      function: 'handleCheckoutContract',
      contractId,
      checkoutDate: checkoutDateObj.toISOString(),
      checkoutReason,
      damageAssessment,
      hasFinalMeterReadings: Object.keys(finalMeterReadings).length > 0,
      operator: operatorName,
    })
    // 1. 查询合同详情
    const contract = await tx.contract.findUnique({
      where: { id: contractId },
      include: {
        room: { include: { building: true } },
        renter: true,
        bills: {
          where: {
            status: { in: ['PENDING', 'OVERDUE'] },
          },
        },
      },
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
    const settlementResult = calculateCheckoutSettlement(contract, {
      checkoutDate: checkoutDateObj,
      damageAssessment,
    })
    const finalSettlement = applyCheckoutSettlementSubmission(
      settlementResult,
      settlementItems as CheckoutSettlementSubmissionItem[],
      {
        requireReasonForAdjusted: true,
      }
    )
    const contractBillMap = new Map(contract.bills.map((bill) => [bill.id, bill]))

    for (const item of finalSettlement.submissionItems) {
      if (item.sourceType !== 'OPEN_BILL' || !item.billId) {
        continue
      }

      const relatedBill = contractBillMap.get(item.billId)
      if (!relatedBill) {
        throw new Error(`结算项 ${item.name} 对应的账单不存在或已变化`)
      }

      const currentPendingAmount = toBillAmount(relatedBill.pendingAmount)
      const currentReceivedAmount = toBillAmount(relatedBill.receivedAmount)
      const currentAmount = toBillAmount(relatedBill.amount)

      if (item.adjustedAmount < -BILL_AMOUNT_EPSILON) {
        throw new Error(`${item.name} 的结算金额不能小于 0`)
      }

      if (item.adjustedAmount - currentPendingAmount > BILL_AMOUNT_EPSILON) {
        throw new Error(
          `${item.name} 的结算金额不能超过当前待收 ${currentPendingAmount.toFixed(2)}`
        )
      }

      const projectedReceivedAmount = toBillAmount(
        currentReceivedAmount + item.adjustedAmount
      )

      if (projectedReceivedAmount - currentAmount > BILL_AMOUNT_EPSILON) {
        throw new Error(`${item.name} 的结算结果会覆盖既有已收事实，已被阻止`)
      }
    }
    const settlementAuditMetadata = buildSettlementAuditMetadata({
      contractId,
      checkoutDate: checkoutDateObj,
      checkoutReason,
      operator: operatorName,
      settlement: finalSettlement,
    })

    // 4. 始终生成一张正式退租结算账单（包含 0 金额平结场景），并直接闭环。
    await tx.bill.create({
      data: buildCheckoutSettlementBillData({
        contractId,
        checkoutDate: checkoutDateObj,
        operator: operatorName,
        settlement: finalSettlement,
        metadata: settlementAuditMetadata,
      }),
    })

    // 4.5. 按正式结算明细受限处理旧未付账单
    console.log(`[退租] 开始处理旧账单结算，合同ID: ${contractId}`)

    // 获取所有未付账单（不依赖contract.bills，直接查询数据库）
    const unpaidBills = await tx.bill.findMany({
      where: {
        contractId: contractId,
        status: { in: ['PENDING', 'OVERDUE'] },
      },
    })

    console.log(`[退租] 发现${unpaidBills.length}个旧账单待处理`)

    let settledOldBillCount = 0
    let settledOldBillAmount = 0
    let waivedOldBillAmount = 0

    for (const bill of unpaidBills) {
      const settlementItem = finalSettlement.submissionItems.find(
        (item) => item.sourceType === 'OPEN_BILL' && item.billId === bill.id
      )

      if (!settlementItem) {
        throw new Error(
          `旧账单 ${bill.billNumber} 未进入正式退租结算明细，请刷新页面后重试`
        )
      }

      const currentPendingAmount = toBillAmount(bill.pendingAmount)
      const currentReceivedAmount = toBillAmount(bill.receivedAmount)
      const { settledAmount } = buildCheckoutBillStatusAfterSettlement({
        currentStatus: bill.status,
        originalPendingAmount: currentPendingAmount,
        settledAmount: settlementItem.adjustedAmount,
      })
      const waivedAmount = toBillAmount(currentPendingAmount - settledAmount)
      const nextReceivedAmount = toBillAmount(currentReceivedAmount + settledAmount)
      const auditRemark = [
        `[退租结算 ${checkoutDateObj.toISOString().split('T')[0]}]`,
        `原待收: ${currentPendingAmount.toFixed(2)}`,
        `本次纳入: ${settledAmount.toFixed(2)}`,
        `退租减免: ${waivedAmount.toFixed(2)}`,
        '剩余待收: 0.00',
        `既有已收: ${currentReceivedAmount.toFixed(2)}`,
        `退租后已收: ${nextReceivedAmount.toFixed(2)}`,
        `经办人: ${operatorName}`,
        settlementItem.adjustmentReason
          ? `调整原因: ${settlementItem.adjustmentReason}`
          : waivedAmount > BILL_AMOUNT_EPSILON
            ? '调整原因: 退租结算按最终协商金额收口，剩余部分已减免'
            : '调整原因: 按系统原始待收纳入退租结算',
      ].join(' | ')

      await tx.bill.update({
        where: { id: bill.id },
        data: {
          status: 'COMPLETED',
          receivedAmount: nextReceivedAmount,
          pendingAmount: 0,
          paidDate: checkoutDateObj,
          paymentMethod: '退租结算',
          operator: operatorName,
          remarks: appendAuditRemark(bill.remarks, auditRemark),
        },
      })

      settledOldBillCount += 1
      settledOldBillAmount = toBillAmount(settledOldBillAmount + settledAmount)
      waivedOldBillAmount = toBillAmount(waivedOldBillAmount + waivedAmount)
    }

    console.log(
      `[退租] 旧账单处理完成，共处理${settledOldBillCount}个账单，纳入金额${settledOldBillAmount.toFixed(2)}，减免金额${waivedOldBillAmount.toFixed(2)}`
    )

    // 5. 更新合同状态
    const updatedContract = await tx.contract.update({
      where: { id: contractId },
      data: {
        status: 'TERMINATED',
        businessStatus: 'CHECKED_OUT',
        updatedAt: new Date(),
        remarks: remarks
          ? `${contract.remarks || ''}\n\n[退租记录 ${checkoutDateObj.toISOString().split('T')[0]}]\n退租原因: ${checkoutReason}\n${remarks}`
          : `${contract.remarks || ''}\n\n[退租记录 ${checkoutDateObj.toISOString().split('T')[0]}]\n退租原因: ${checkoutReason}`,
      },
    })

    // 6. 更新房间状态
    await tx.room.update({
      where: { id: contract.roomId },
      data: {
        status: 'VACANT',
        currentRenter: null,
        overdueDays: null,
        updatedAt: new Date(),
      },
    })

    // 7. 处理水电表状态和最终读数
    const meterProcessingResults = await createCheckoutFinalReadingsTx(tx, {
      contractId,
      roomId: contract.roomId,
      checkoutDate: checkoutDateObj,
      finalMeterReadings,
    })

    // 8. 更新租客状态和退租记录
    await tx.renter.update({
      where: { id: contract.renterId },
      data: {
        updatedAt: new Date(),
        remarks: `${contract.renter.remarks || ''}\n[退租记录 ${checkoutDateObj.toISOString().split('T')[0]}] 合同${contract.contractNumber}正常退租`,
      },
    })

    // 9. 记录完整的退租操作日志
    logger.logInfo('退租操作完成', {
      module: 'checkout-contract-api',
      function: 'handleCheckoutContract',
      contractId,
      operationDetails: {
        contractStatus: { from: 'ACTIVE', to: 'TERMINATED' },
        roomStatus: { from: 'OCCUPIED', to: 'VACANT' },
        billsProcessed: settledOldBillCount,
        oldBillsSettledAmount: settledOldBillAmount,
        oldBillsWaivedAmount: waivedOldBillAmount,
        metersProcessed: meterProcessingResults.length,
        totalMeterUsage: meterProcessingResults.reduce(
          (sum, m) => sum + m.usage,
          0
        ),
        totalMeterAmount: meterProcessingResults.reduce(
          (sum, m) => sum + m.amount,
          0
        ),
        settlementAmount: Math.abs(finalSettlement.summary.netAmount),
        settlementType: finalSettlement.summary.settlementType,
      },
      affectedEntities: {
        contract: { id: contractId, status: 'TERMINATED' },
        room: { id: contract.roomId, status: 'VACANT' },
        renter: { id: contract.renterId, name: contract.renter.name },
        bills: finalSettlement.submissionItems
          .filter((item) => item.sourceType === 'OPEN_BILL' && item.billId)
          .map((item) => ({
            id: item.billId,
            adjustedAmount: item.adjustedAmount,
            hasReason: Boolean(item.adjustmentReason),
          })),
        meters: meterProcessingResults.map((m) => ({
          id: m.meterId,
          type: m.meterType,
          finalReading: m.finalReading,
          usage: m.usage,
          amount: m.amount,
        })),
      },
    })

    return {
      contract: updatedContract,
      settlement: finalSettlement,
      meterProcessing: meterProcessingResults,
    }
  })
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

    // 记录退租成功日志
    logger.logInfo('退租流程成功完成', {
      module: 'checkout-contract-api',
      function: 'handleCheckoutContractWithSettlement',
      contractId,
      finalResult: {
        contractTerminated: true,
        settlementCalculated: true,
        meterReadingsProcessed: result.meterProcessing?.length || 0,
        totalSettlementAmount: result.settlement.summary.netAmount,
        settlementType: result.settlement.summary.settlementType,
      },
    })

    await revalidateMutationPaths({
      scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters', 'meters'],
      detailPaths: [
        `/contracts/${contractId}`,
        `/rooms/${result.contract.roomId}`,
        `/renters/${result.contract.renterId}`,
      ],
    })

    // 返回退租成功信息
    return createSuccessResponse(
      {
        contractId,
        contract: {
          ...result.contract,
          monthlyRent: Number(result.contract.monthlyRent),
          totalRent: Number(result.contract.totalRent),
          deposit: Number(result.contract.deposit),
          keyDeposit: result.contract.keyDeposit
            ? Number(result.contract.keyDeposit)
            : null,
          cleaningFee: result.contract.cleaningFee
            ? Number(result.contract.cleaningFee)
            : null,
        },
        settlement: result.settlement,
        meterProcessing: result.meterProcessing,
      },
      '退租成功'
    )
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
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      },
      error instanceof Error ? error : undefined
    )

    throw error
  }
}

export const POST = withApiErrorHandler(handleCheckoutContractWithSettlement, {
  requireAuth: true,
  module: 'checkout-contract-api',
  errorType: ErrorType.VALIDATION_ERROR,
  enableFallback: true,
})
