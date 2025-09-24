import { NextRequest } from 'next/server'
import { renterQueries } from '@/lib/queries'

/**
 * 获取租客统计数据API
 * GET /api/renters/stats
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await renterQueries.getRenterStats()
    return Response.json(stats)
  } catch (error) {
    console.error('Failed to fetch renter stats:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}