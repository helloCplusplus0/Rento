import { NextRequest } from 'next/server'

import {
  logMeterReadingRepairFailure,
  repairMeterReadingStatusPageClosureData,
} from '@/lib/page-closure-compat/meter-readings'

/**
 * phase13-04 page-closure compat:
 * POST /api/meter-readings/repair-status
 *
 * Next 与 Hono 共用 shared compat helper，保持抄表状态修复仍属于
 * 页面闭环桥接，不提前声明正式 API cutover。
 */
export async function POST(_request: NextRequest) {
  try {
    console.log('[状态修复API] 开始执行状态修复操作')
    const result = await repairMeterReadingStatusPageClosureData()
    console.log(`[状态修复API] 完成 - ${result.message}`)
    return Response.json(result)
  } catch (error) {
    await logMeterReadingRepairFailure(error)
    return Response.json(
      {
        success: false,
        error: 'Status repair failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
