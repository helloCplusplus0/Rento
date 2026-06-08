import { NextRequest } from 'next/server'

import { getRenterStatsPageClosureData } from '@/lib/page-closure-compat/renters'

/**
 * phase13-04 page-closure compat:
 * stats 查询继续锚定 shared compat helper，避免把 server/Hono runtime
 * 误判为 `/api/renters/stats` 的正式宿主切流。
 */
export async function GET(_request: NextRequest) {
  try {
    const stats = await getRenterStatsPageClosureData()
    return Response.json(stats)
  } catch (error) {
    console.error('Failed to fetch renter stats:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
