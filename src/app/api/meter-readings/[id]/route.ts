import { NextRequest, NextResponse } from 'next/server'
import { meterReadingQueries } from '@/lib/queries'

/**
 * 获取单个抄表记录
 * GET /api/meter-readings/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const reading = await meterReadingQueries.findById(id)
    
    if (!reading) {
      return NextResponse.json(
        { success: false, error: '抄表记录不存在' },
        { status: 404 }
      )
    }

    // 转换数据类型
    const readingData = {
      ...reading,
      previousReading: reading.previousReading ? Number(reading.previousReading) : null,
      currentReading: Number(reading.currentReading),
      usage: Number(reading.usage),
      unitPrice: Number(reading.unitPrice),
      amount: Number(reading.amount),
      meter: reading.meter ? {
        ...reading.meter,
        unitPrice: Number(reading.meter.unitPrice),
        room: reading.meter.room ? {
          ...reading.meter.room,
          rent: Number(reading.meter.room.rent),
          area: reading.meter.room.area ? Number(reading.meter.room.area) : null,
          building: reading.meter.room.building ? {
            ...reading.meter.room.building,
            totalRooms: Number(reading.meter.room.building.totalRooms)
          } : undefined
        } : undefined
      } : undefined
    }

    return NextResponse.json({
      success: true,
      data: readingData
    })
  } catch (error) {
    console.error('获取抄表记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取抄表记录失败' },
      { status: 500 }
    )
  }
}

/**
 * 更新抄表记录
 * PUT /api/meter-readings/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // 检查记录是否存在
    const existingReading = await meterReadingQueries.findById(id)
    if (!existingReading) {
      return NextResponse.json(
        { success: false, error: '抄表记录不存在' },
        { status: 404 }
      )
    }

    // 检查是否已生成账单，已生成账单的记录不允许修改
    if (existingReading.isBilled) {
      return NextResponse.json(
        { success: false, error: '已生成账单的抄表记录不允许修改' },
        { status: 400 }
      )
    }

    // 更新记录
    const updatedReading = await meterReadingQueries.update(id, {
      currentReading: body.currentReading,
      usage: body.usage,
      amount: body.amount,
      operator: body.operator,
      remarks: body.remarks
    })

    // 转换数据类型
    const readingData = {
      ...updatedReading,
      previousReading: updatedReading.previousReading ? Number(updatedReading.previousReading) : null,
      currentReading: Number(updatedReading.currentReading),
      usage: Number(updatedReading.usage),
      unitPrice: Number(updatedReading.unitPrice),
      amount: Number(updatedReading.amount)
    }

    return NextResponse.json({
      success: true,
      data: readingData,
      message: '抄表记录更新成功'
    })
  } catch (error) {
    console.error('更新抄表记录失败:', error)
    return NextResponse.json(
      { success: false, error: '更新抄表记录失败' },
      { status: 500 }
    )
  }
}

/**
 * 删除抄表记录
 * DELETE /api/meter-readings/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 检查记录是否存在
    const existingReading = await meterReadingQueries.findById(id)
    if (!existingReading) {
      return NextResponse.json(
        { success: false, error: '抄表记录不存在' },
        { status: 404 }
      )
    }

    // 检查是否已生成账单，已生成账单的记录不允许删除
    if (existingReading.isBilled) {
      return NextResponse.json(
        { success: false, error: '已生成账单的抄表记录不允许删除' },
        { status: 400 }
      )
    }

    // 删除记录
    await meterReadingQueries.delete(id)

    return NextResponse.json({
      success: true,
      message: '抄表记录删除成功'
    })
  } catch (error) {
    console.error('删除抄表记录失败:', error)
    return NextResponse.json(
      { success: false, error: '删除抄表记录失败' },
      { status: 500 }
    )
  }
}