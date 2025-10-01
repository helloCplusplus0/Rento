import { NextResponse } from 'next/server'

import { ErrorLogger, ErrorSeverity, ErrorType } from '@/lib/error-logger'
import {
  repairReadingStatusInconsistencies,
  validateReadingBillConsistency,
} from '@/lib/reading-status-sync'

/**
 * 抄表状态修复API
 * POST /api/meter-readings/repair-status
 */
export async function POST() {
  try {
    console.log('[状态修复API] 开始执行状态修复操作')

    // 先检查当前状态
    const preValidation = await validateReadingBillConsistency()

    if (preValidation.totalInconsistencies === 0) {
      return NextResponse.json({
        success: true,
        data: {
          repairedOrphaned: 0,
          repairedInconsistent: 0,
          errors: [],
        },
        message: '所有抄表记录状态已一致，无需修复',
      })
    }

    // 执行修复操作
    const repairResults = await repairReadingStatusInconsistencies()

    // 修复后再次验证
    const postValidation = await validateReadingBillConsistency()

    const result = {
      success: repairResults.errors.length === 0,
      data: {
        ...repairResults,
        preRepairInconsistencies: preValidation.totalInconsistencies,
        postRepairInconsistencies: postValidation.totalInconsistencies,
        fullyRepaired: postValidation.totalInconsistencies === 0,
      },
      message:
        repairResults.errors.length === 0
          ? `修复完成: 孤立记录${repairResults.repairedOrphaned}个, 不一致记录${repairResults.repairedInconsistent}个`
          : `修复部分完成: 成功${repairResults.repairedOrphaned + repairResults.repairedInconsistent}个, 失败${repairResults.errors.length}个`,
    }

    console.log(`[状态修复API] 完成 - ${result.message}`)

    return NextResponse.json(result)
  } catch (error) {
    // 使用统一的错误日志记录
    const logger = ErrorLogger.getInstance()
    await logger.logError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      '抄表状态修复API执行失败',
      {
        module: 'MeterReadingRepairStatusAPI',
        function: 'POST',
        url: '/api/meter-readings/repair-status',
      },
      error instanceof Error ? error : undefined
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Status repair failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
