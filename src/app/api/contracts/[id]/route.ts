import { NextRequest, NextResponse } from 'next/server'

import {
  createSuccessResponse,
  parseRequestBody,
  validateRequired,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { ErrorLogger, ErrorType } from '@/lib/error-logger'
import {
  deletePendingContractWithoutHistory,
  isContractDeleteGuardBlockedError,
  performContractDeleteSafetyCheck,
} from '@/lib/domain/delete-guards'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { prisma } from '@/lib/prisma'
import { contractQueries } from '@/lib/queries'

/**
 * 单个合同管理API
 * GET /api/contracts/[id] - 获取合同详情
 * PUT /api/contracts/[id] - 更新合同信息
 * DELETE /api/contracts/[id] - 删除合同
 */

async function handleGetContract(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

async function handleUpdateContract(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  if (
    existingContract.status === 'ACTIVE' ||
    existingContract.status === 'EXPIRED'
  ) {
    // 对于生效中或已到期的合同，只允许编辑签约信息
    const { signedBy, signedDate, remarks } = body

    // 构建更新数据 - 只包含签约信息
    const updateData: any = {}

    if (signedBy !== undefined) updateData.signedBy = signedBy
    if (signedDate !== undefined)
      updateData.signedDate = signedDate ? new Date(signedDate) : null
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
          include: { building: true },
        },
        renter: true,
        bills: true,
      },
    })

    await revalidateMutationPaths({
      scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
      detailPaths: [`/contracts/${id}`],
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
      remarks,
    } = body

    // 构建更新数据
    const updateData: any = {}

    if (monthlyRent !== undefined) {
      updateData.monthlyRent = Number(monthlyRent)
      // 如果月租金变化，重新计算总租金
      if (updateData.monthlyRent !== Number(existingContract.monthlyRent)) {
        const startDate = new Date(existingContract.startDate)
        const endDate = new Date(existingContract.endDate)
        const monthsDiff = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
        updateData.totalRent = updateData.monthlyRent * monthsDiff
      }
    }

    if (deposit !== undefined) updateData.deposit = Number(deposit)
    if (keyDeposit !== undefined)
      updateData.keyDeposit = keyDeposit ? Number(keyDeposit) : null
    if (cleaningFee !== undefined)
      updateData.cleaningFee = cleaningFee ? Number(cleaningFee) : null
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (paymentTiming !== undefined) updateData.paymentTiming = paymentTiming
    if (signedBy !== undefined) updateData.signedBy = signedBy
    if (signedDate !== undefined)
      updateData.signedDate = signedDate ? new Date(signedDate) : null
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
          include: { building: true },
        },
        renter: true,
        bills: true,
      },
    })

    await revalidateMutationPaths({
      scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
      detailPaths: [`/contracts/${id}`],
    })

    return createSuccessResponse(updatedContract, '合同更新成功')
  }
}

/**
 * 删除合同API
 * DELETE /api/contracts/[id]
 *
 * compat wrapper:
 * phase09-02 起合同删除门禁与物理删除窄场景由 src/lib/domain/delete-guards 承接，
 * 当前 Next 入口仅保留存量请求兼容，不再维护独立删除规则。
 */
async function handleDeleteContract(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 验证合同ID
  validateRequired({ id }, ['id'])

  const existingContract = await prisma.contract.findUnique({
    where: { id },
    select: {
      id: true,
      roomId: true,
      renterId: true,
    },
  })

  if (!existingContract) {
    return NextResponse.json({ error: '合同不存在' }, { status: 404 })
  }

  // 执行删除安全检查
  const safetyCheck = await performContractDeleteSafetyCheck(id)

  if (!safetyCheck.canDelete) {
    const errorResponse = {
      error: '无法删除合同',
      code: safetyCheck.errorCode,
      details: {
        currentStatus: safetyCheck.contractStatus,
        billCount: safetyCheck.billCount,
        paidBillCount: safetyCheck.paidBillCount,
        unpaidBillCount: safetyCheck.unpaidBillCount,
        meterReadingCount: safetyCheck.meterReadingCount,
        billedMeterReadingCount: safetyCheck.billedMeterReadingCount,
        billDetailCount: safetyCheck.billDetailCount,
        blockingReasons: safetyCheck.blockingReasons,
        suggestion: safetyCheck.suggestion,
      },
    }

    return NextResponse.json(errorResponse, { status: 400 })
  }

  const logger = ErrorLogger.getInstance()

  logger.logInfo('合同删除操作开始', {
    module: 'contract-delete-api',
    function: 'handleDeleteContract',
    contractId: id,
    contractStatus: safetyCheck.contractStatus,
    billCount: safetyCheck.billCount,
    meterReadingCount: safetyCheck.meterReadingCount,
    compatBoundary: 'src/lib/domain/delete-guards',
  })

  let deleteResult

  try {
    deleteResult = await deletePendingContractWithoutHistory(id)
  } catch (error) {
    if (isContractDeleteGuardBlockedError(error)) {
      return NextResponse.json(
        {
          error: '无法删除合同',
          code: error.details.errorCode,
          details: {
            currentStatus: error.details.contractStatus,
            billCount: error.details.billCount,
            paidBillCount: error.details.paidBillCount,
            unpaidBillCount: error.details.unpaidBillCount,
            meterReadingCount: error.details.meterReadingCount,
            billedMeterReadingCount: error.details.billedMeterReadingCount,
            billDetailCount: error.details.billDetailCount,
            blockingReasons: error.details.blockingReasons,
            suggestion: error.details.suggestion,
          },
        },
        { status: 400 }
      )
    }

    throw error
  }

  logger.logInfo('合同删除操作完成', {
    module: 'contract-delete-api',
    function: 'handleDeleteContract',
    contractId: id,
    deletedEntities: deleteResult.deletedEntities,
  })

  await revalidateMutationPaths({
    scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
    detailPaths: [
      `/contracts/${id}`,
      `/rooms/${existingContract.roomId}`,
      `/renters/${existingContract.renterId}`,
    ],
  })

  return createSuccessResponse(
    {
      success: true,
      message: deleteResult.message,
      deletedEntities: deleteResult.deletedEntities,
    },
    '合同删除成功'
  )
}

export const GET = withApiErrorHandler(handleGetContract, {
  requireAuth: true,
  module: 'contract-detail-api',
  errorType: ErrorType.DATABASE_ERROR,
})

export const PUT = withApiErrorHandler(handleUpdateContract, {
  requireAuth: true,
  module: 'contract-update-api',
  errorType: ErrorType.VALIDATION_ERROR,
  enableFallback: true,
})

export const DELETE = withApiErrorHandler(handleDeleteContract, {
  requireAuth: true,
  module: 'contract-delete-api',
  errorType: ErrorType.DATABASE_ERROR,
  enableFallback: false,
})
