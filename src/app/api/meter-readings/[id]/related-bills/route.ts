import { NextRequest, NextResponse } from 'next/server'

import { meterReadingDomainService } from '@/lib/domain/meters'

/**
 * 获取抄表记录关联账单API
 * GET /api/meter-readings/[id]/related-bills
 *
 * compat wrapper:
 * phase09-04 起 related-bills 追溯、metadata/BillDetail 命中规则统一收口到 src/lib/domain/meters。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const traceResult =
      await meterReadingDomainService.getRelatedBillsForMeterReading(id)

    return NextResponse.json({
      success: true,
      data: {
        ...traceResult,
      },
      compatMode: true,
      migrationHost: 'src/lib/domain/meters',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'MeterReading not found') {
      return NextResponse.json(
        { success: false, error: '抄表记录不存在' },
        { status: 404 }
      )
    }

    console.error('获取抄表记录关联账单失败:', error)
    return NextResponse.json(
      { success: false, error: '获取关联账单失败' },
      { status: 500 }
    )
  }
}
