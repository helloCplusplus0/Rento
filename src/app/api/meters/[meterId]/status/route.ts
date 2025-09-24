import { NextRequest, NextResponse } from 'next/server'
import { meterQueries } from '@/lib/queries'

/**
 * 切换仪表状态
 * PATCH /api/meters/[meterId]/status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ meterId: string }> }
) {
  try {
    const { meterId } = await params
    const { isActive } = await request.json()
    
    // 验证参数
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      )
    }
    
    // 检查仪表是否存在
    const existingMeter = await meterQueries.findById(meterId)
    if (!existingMeter) {
      return NextResponse.json(
        { error: 'Meter not found' },
        { status: 404 }
      )
    }
    
    // 更新仪表状态
    const updatedMeter = await meterQueries.update(meterId, { isActive })
    
    // 转换返回数据
    const meterData = {
      ...updatedMeter,
      unitPrice: Number(updatedMeter.unitPrice),
      readings: updatedMeter.readings?.map((reading: any) => ({
        ...reading,
        previousReading: reading.previousReading ? Number(reading.previousReading) : null,
        currentReading: Number(reading.currentReading),
        usage: Number(reading.usage),
        unitPrice: Number(reading.unitPrice),
        amount: Number(reading.amount)
      })) || []
    }
    
    return NextResponse.json(meterData)
  } catch (error) {
    console.error('Failed to update meter status:', error)
    return NextResponse.json(
      { error: 'Failed to update meter status' },
      { status: 500 }
    )
  }
}