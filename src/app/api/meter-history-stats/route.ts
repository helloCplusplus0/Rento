import { NextRequest, NextResponse } from 'next/server'
import { 
  getAllMeterHistoryStats, 
  getRemovedMeterStats, 
  getMeterTypeHistorySummary,
  generateMeterHistoryReport 
} from '@/lib/meter-data-protection'
import { meterReadingQueries } from '@/lib/queries'

/**
 * 获取仪表历史数据统计
 * GET /api/meter-history-stats
 * 
 * 查询参数:
 * - includeInactive: boolean - 是否包含已移除的仪表 (默认: true)
 * - startDate: string - 开始日期
 * - endDate: string - 结束日期
 * - meterType: string - 仪表类型筛选
 * - roomId: string - 房间ID筛选
 * - buildingId: string - 楼栋ID筛选
 * - type: 'all' | 'removed' | 'summary' | 'report' - 统计类型
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const includeInactive = searchParams.get('includeInactive') !== 'false'
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const meterType = searchParams.get('meterType') as any
    const roomId = searchParams.get('roomId') || undefined
    const buildingId = searchParams.get('buildingId') || undefined
    const type = searchParams.get('type') || 'all'

    const options = {
      includeInactive,
      startDate,
      endDate,
      meterType,
      roomId,
      buildingId
    }

    let result: any

    switch (type) {
      case 'removed':
        // 仅获取已移除仪表的统计
        result = await getRemovedMeterStats({
          startDate,
          endDate,
          meterType
        })
        break

      case 'summary':
        // 获取按类型汇总的统计
        result = await getMeterTypeHistorySummary({
          startDate,
          endDate,
          includeInactive
        })
        break

      case 'report':
        // 生成完整的历史数据报表
        result = await generateMeterHistoryReport({
          startDate,
          endDate,
          format: 'detailed'
        })
        break

      case 'readings':
        // 获取抄表记录统计（包含已移除仪表数据）
        result = await meterReadingQueries.getCompleteHistoryStats(startDate, endDate)
        break

      case 'active-only':
        // 仅获取活跃仪表的抄表统计
        result = await meterReadingQueries.getActiveMetersStats(startDate, endDate)
        break

      default:
        // 获取所有仪表的历史统计
        result = await getAllMeterHistoryStats(options)
        break
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        queryType: type,
        includeInactive,
        dateRange: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        },
        filters: {
          meterType,
          roomId,
          buildingId
        },
        dataProtection: {
          message: '历史数据完整性已保护，包含已移除仪表的历史记录',
          note: '移除仪表不会影响历史数据的统计分析'
        }
      }
    })

  } catch (error) {
    console.error('Failed to fetch meter history stats:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch meter history statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * 验证仪表数据完整性
 * POST /api/meter-history-stats/validate
 */
export async function POST(request: NextRequest) {
  try {
    const { meterId } = await request.json()
    
    if (!meterId) {
      return NextResponse.json(
        { error: 'meterId is required' },
        { status: 400 }
      )
    }

    const { validateMeterDataIntegrity } = await import('@/lib/meter-data-protection')
    const validation = await validateMeterDataIntegrity(meterId)

    return NextResponse.json({
      success: true,
      data: validation,
      message: validation.isValid 
        ? '数据完整性验证通过' 
        : '发现数据完整性问题'
    })

  } catch (error) {
    console.error('Failed to validate meter data integrity:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to validate meter data integrity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}