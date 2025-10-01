import { NextRequest, NextResponse } from 'next/server'

import {
  cleanupDuplicateDetails,
  repairAllUtilityBillDetails,
  validateBillDetailsIntegrity,
} from '@/lib/bill-detail-repair'

/**
 * 账单明细修复API
 * POST /api/bills/repair-details
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'repair' } = body

    console.log(`[修复API] 开始执行操作: ${action}`)

    switch (action) {
      case 'repair':
        // 修复所有缺失明细的账单
        const repairResult = await repairAllUtilityBillDetails()
        return NextResponse.json({
          success: repairResult.success,
          action: 'repair',
          result: repairResult,
          message: `修复完成: 成功 ${repairResult.repairedCount} 个, 跳过 ${repairResult.skippedCount} 个, 错误 ${repairResult.errors.length} 个`,
        })

      case 'validate':
        // 验证明细数据完整性
        const validateResult = await validateBillDetailsIntegrity()
        return NextResponse.json({
          success: true,
          action: 'validate',
          result: validateResult,
          message: `验证完成: 总账单 ${validateResult.totalBills} 个, 有明细 ${validateResult.billsWithDetails} 个, 缺失明细 ${validateResult.billsWithoutDetails} 个`,
        })

      case 'cleanup':
        // 清理重复明细
        const cleanupResult = await cleanupDuplicateDetails()
        return NextResponse.json({
          success: true,
          action: 'cleanup',
          result: { cleanedCount: cleanupResult },
          message: `清理完成: 删除了 ${cleanupResult} 条重复记录`,
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            availableActions: ['repair', 'validate', 'cleanup'],
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[修复API] 操作失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Repair operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * 获取修复状态信息
 * GET /api/bills/repair-details
 */
export async function GET() {
  try {
    const integrity = await validateBillDetailsIntegrity()

    return NextResponse.json({
      success: true,
      integrity,
      recommendations: {
        needsRepair: integrity.utilityBillsWithoutDetails > 0,
        repairCount: integrity.utilityBillsWithoutDetails,
        message:
          integrity.utilityBillsWithoutDetails > 0
            ? `发现 ${integrity.utilityBillsWithoutDetails} 个水电费账单缺失明细，建议执行修复操作`
            : '所有账单明细数据完整',
      },
    })
  } catch (error) {
    console.error('[修复API] 获取状态失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get repair status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
