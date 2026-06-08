import { NextRequest } from 'next/server'

import { getMeterReadingStatusCheckPageClosureData } from '@/lib/page-closure-compat/meter-readings'

/**
 * phase13-04 page-closure compat:
 * GET /api/meter-readings/status-check
 *
 * Next 与 Hono 共用 shared compat helper，保持抄表历史页状态巡检
 * 仍处于页面闭环桥接范围，而不是提前声明正式 API cutover。
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('[状态检查API] 开始执行状态一致性检查')
    const result = await getMeterReadingStatusCheckPageClosureData()
    console.log(`[状态检查API] 完成 - ${result.message}`)
    return Response.json(result)
  } catch (error) {
    console.error('[状态检查API] 执行失败:', error)
    return Response.json(
      {
        success: false,
        error: 'Status check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
