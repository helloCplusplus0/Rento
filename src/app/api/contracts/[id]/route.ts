import { NextRequest, NextResponse } from 'next/server'
import { contractQueries } from '@/lib/queries'
import { prisma } from '@/lib/prisma'
import { 
  withApiErrorHandler, 
  parseRequestBody,
  createSuccessResponse,
  validateRequired
} from '@/lib/api-error-handler'
import { ErrorType, ErrorLogger } from '@/lib/error-logger'
import { performContractDeleteSafetyCheck } from '@/lib/validation'

/**
 * 单个合同管理API
 * GET /api/contracts/[id] - 获取合同详情
 * PUT /api/contracts/[id] - 更新合同信息
 * DELETE /api/contracts/[id] - 删除合同
 */

async function handleGetContract(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // 验证合同ID
  validateRequired({ id }, ['id'])
  
  // 获取合同详情
  const contract = await contractQueries.findById(id)
  
  if (!contract) {
    throw new Error('合同不存在')
  }
  
  return createSuccessResponse(contract, '获取合同详情成功')
}

async function handleUpdateContract(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await parseRequestBody(request)
  
  // 验证合同ID
  validateRequired({ id }, ['id'])
  
  // 验证合同是否存在
  const existingContract = await contractQueries.findById(id)
  if (!existingContract) {
    throw new Error('合同不存在')
  }
  
  // 检查合同状态 - 只允许编辑签约信息
  if (existingContract.status === 'ACTIVE' || existingContract.status === 'EXPIRED') {
    // 对于生效中或已到期的合同，只允许编辑签约信息
    const {
      signedBy,
      signedDate,
      remarks
    } = body
    
    // 构建更新数据 - 只包含签约信息
    const updateData: any = {}
    
    if (signedBy !== undefined) updateData.signedBy = signedBy
    if (signedDate !== undefined) updateData.signedDate = signedDate ? new Date(signedDate) : null
    if (remarks !== undefined) updateData.remarks = remarks
    
    // 如果没有要更新的数据
    if (Object.keys(updateData).length === 0) {
      throw new Error('没有提供要更新的数据')
    }
    
    // 执行更新
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        room: {
          include: { building: true }
        },
        renter: true,
        bills: true
      }
    })
    
    return createSuccessResponse(updatedContract, '合同签约信息更新成功')
  } else {
    // 对于待生效的合同，允许编辑所有字段
    const {
      monthlyRent,
      deposit,
      keyDeposit,
      cleaningFee,
      paymentMethod,
      paymentTiming,
      signedBy,
      signedDate,
      remarks
    } = body
    
    // 构建更新数据
    const updateData: any = {}
    
    if (monthlyRent !== undefined) {
      updateData.monthlyRent = Number(monthlyRent)
      // 如果月租金变化，重新计算总租金
      if (updateData.monthlyRent !== Number(existingContract.monthlyRent)) {
        const startDate = new Date(existingContract.startDate)
        const endDate = new Date(existingContract.endDate)
        const monthsDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
        updateData.totalRent = updateData.monthlyRent * monthsDiff
      }
    }
    
    if (deposit !== undefined) updateData.deposit = Number(deposit)
    if (keyDeposit !== undefined) updateData.keyDeposit = keyDeposit ? Number(keyDeposit) : null
    if (cleaningFee !== undefined) updateData.cleaningFee = cleaningFee ? Number(cleaningFee) : null
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (paymentTiming !== undefined) updateData.paymentTiming = paymentTiming
    if (signedBy !== undefined) updateData.signedBy = signedBy
    if (signedDate !== undefined) updateData.signedDate = signedDate ? new Date(signedDate) : null
    if (remarks !== undefined) updateData.remarks = remarks
    
    // 如果没有要更新的数据
    if (Object.keys(updateData).length === 0) {
      throw new Error('没有提供要更新的数据')
    }
    
    // 执行更新
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        room: {
          include: { building: true }
        },
        renter: true,
        bills: true
      }
    })
    
    return createSuccessResponse(updatedContract, '合同更新成功')
  }
}

/**
 * 删除合同API
 * DELETE /api/contracts/[id]
 */
async function handleDeleteContract(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // 验证合同ID
  validateRequired({ id }, ['id'])
  
  // 执行删除安全检查
  const safetyCheck = await performContractDeleteSafetyCheck(id)
  
  if (!safetyCheck.canDelete) {
    const errorResponse = {
      error: '无法删除合同',
      code: safetyCheck.errorCode,
      details: {
        currentStatus: safetyCheck.contractStatus,
        paidBillCount: safetyCheck.paidBillCount,
        suggestion: safetyCheck.suggestion
      }
    }
    
    return NextResponse.json(errorResponse, { status: 400 })
  }
  
  // 如果有已支付账单，不允许删除
  if (safetyCheck.hasPaidBills) {
    return NextResponse.json({
      error: '不能删除有已支付账单的合同',
      code: 'HAS_PAID_BILLS',
      details: {
        paidBillCount: safetyCheck.paidBillCount,
        suggestion: '已支付的账单包含重要的财务记录，不能删除'
      }
    }, { status: 400 })
  }
  
  // 开始数据库事务执行级联删除
  return await prisma.$transaction(async (tx) => {
    const logger = ErrorLogger.getInstance()
    
    // 记录删除操作开始
    logger.logInfo('合同删除操作开始', {
      module: 'contract-delete-api',
      function: 'handleDeleteContract',
      contractId: id,
      contractStatus: safetyCheck.contractStatus,
      unpaidBillCount: safetyCheck.unpaidBillCount,
      meterReadingCount: safetyCheck.meterReadingCount
    })
    
    // 1. 删除关联的未支付账单
    if (safetyCheck.hasUnpaidBills) {
      await tx.bill.deleteMany({
        where: {
          contractId: id,
          status: { not: 'PAID' }
        }
      })
    }
    
    // 2. 删除关联的抄表记录
    if (safetyCheck.hasMeterReadings) {
      await tx.meterReading.deleteMany({
        where: {
          contractId: id
        }
      })
    }
    
    // 3. 获取合同信息用于房间状态更新
    const contract = await tx.contract.findUnique({
      where: { id },
      select: { roomId: true }
    })
    
    // 4. 删除合同主记录
    await tx.contract.delete({
      where: { id }
    })
    
    // 5. 更新房间状态为VACANT，清理租客关联
    if (contract?.roomId) {
      await tx.room.update({
        where: { id: contract.roomId },
        data: {
          status: 'VACANT',
          currentRenter: null,
          overdueDays: null
        }
      })
    }
    
    // 记录删除操作完成
    logger.logInfo('合同删除操作完成', {
      module: 'contract-delete-api',
      function: 'handleDeleteContract',
      contractId: id,
      deletedEntities: {
        contract: id,
        bills: safetyCheck.unpaidBillCount,
        meterReadings: safetyCheck.meterReadingCount
      }
    })
    
    return createSuccessResponse({
      success: true,
      message: '合同删除成功',
      deletedEntities: {
        contract: id,
        bills: safetyCheck.unpaidBillCount,
        meterReadings: safetyCheck.meterReadingCount
      }
    }, '合同删除成功')
  })
}

export const GET = withApiErrorHandler(handleGetContract, {
  module: 'contract-detail-api',
  errorType: ErrorType.DATABASE_ERROR
})

export const PUT = withApiErrorHandler(handleUpdateContract, {
  module: 'contract-update-api',
  errorType: ErrorType.VALIDATION_ERROR,
  enableFallback: true
})

export const DELETE = withApiErrorHandler(handleDeleteContract, {
  module: 'contract-delete-api',
  errorType: ErrorType.DATABASE_ERROR,
  enableFallback: false
})