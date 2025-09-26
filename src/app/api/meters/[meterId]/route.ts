import { NextRequest, NextResponse } from 'next/server'
import { meterQueries } from '@/lib/queries'
import { validateDisplayName, validateUnitPrice } from '@/lib/meter-utils'

/**
 * 获取仪表详情
 * GET /api/meters/[meterId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meterId: string }> }
) {
  try {
    const { meterId } = await params
    
    const meter = await meterQueries.findById(meterId)
    if (!meter) {
      return NextResponse.json(
        { error: 'Meter not found' },
        { status: 404 }
      )
    }
    
    // 转换Decimal类型为number
    const meterData = {
      ...meter,
      unitPrice: Number(meter.unitPrice),
      readings: meter.readings.map((reading: any) => ({
        ...reading,
        previousReading: reading.previousReading ? Number(reading.previousReading) : null,
        currentReading: Number(reading.currentReading),
        usage: Number(reading.usage),
        unitPrice: Number(reading.unitPrice),
        amount: Number(reading.amount)
      }))
    }
    
    return NextResponse.json(meterData)
  } catch (error) {
    console.error('Failed to fetch meter:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meter' },
      { status: 500 }
    )
  }
}

/**
 * 更新仪表配置
 * PUT /api/meters/[meterId]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ meterId: string }> }
) {
  try {
    const { meterId } = await params
    const data = await request.json()
    
    // 获取现有仪表信息
    const existingMeter = await meterQueries.findById(meterId)
    if (!existingMeter) {
      return NextResponse.json(
        { error: 'Meter not found' },
        { status: 404 }
      )
    }
    
    // 数据验证
    const validationResult = validateMeterUpdateData(data)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.errors },
        { status: 400 }
      )
    }
    
    // 业务规则检查（如果修改了显示名称）
    if (data.displayName && data.displayName !== existingMeter.displayName) {
      const isUnique = await checkDisplayNameUnique(
        existingMeter.roomId,
        data.displayName,
        meterId
      )
      if (!isUnique) {
        return NextResponse.json(
          { error: 'Display name already exists in this room' },
          { status: 400 }
        )
      }
    }
    
    // 更新仪表
    const updatedMeter = await meterQueries.update(meterId, {
      displayName: data.displayName,
      unitPrice: data.unitPrice,
      unit: data.unit,
      location: data.location,
      remarks: data.remarks
    })
    
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
    console.error('Failed to update meter:', error)
    return NextResponse.json(
      { error: 'Failed to update meter' },
      { status: 500 }
    )
  }
}

/**
 * 移除仪表关联（软删除或硬删除）
 * DELETE /api/meters/[meterId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ meterId: string }> }
) {
  try {
    const { meterId } = await params
    
    // 检查仪表是否存在
    const existingMeter = await meterQueries.findById(meterId)
    if (!existingMeter) {
      return NextResponse.json(
        { error: 'Meter not found' },
        { status: 404 }
      )
    }
    
    // 检查是否有抄表记录
    if (existingMeter.readings && existingMeter.readings.length > 0) {
      // 有抄表记录时，只能软删除（设置为禁用状态）
      await meterQueries.softDelete(meterId)
      return NextResponse.json({ 
        message: 'Meter association removed successfully. Historical data preserved.',
        action: 'soft_delete'
      })
    } else {
      // 没有抄表记录时，可以硬删除
      await meterQueries.delete(meterId)
      return NextResponse.json({ 
        message: 'Meter removed successfully.',
        action: 'hard_delete'
      })
    }
  } catch (error) {
    console.error('Failed to remove meter:', error)
    return NextResponse.json(
      { error: 'Failed to remove meter' },
      { status: 500 }
    )
  }
}

/**
 * 验证仪表更新数据
 */
function validateMeterUpdateData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 显示名称验证
  if (data.displayName !== undefined) {
    if (!data.displayName || typeof data.displayName !== 'string') {
      errors.push('显示名称不能为空')
    } else if (!validateDisplayName(data.displayName)) {
      errors.push('显示名称格式不正确，最多50字符，支持中文、英文、数字、横线、下划线')
    }
  }

  // 单价验证
  if (data.unitPrice !== undefined) {
    if (typeof data.unitPrice !== 'number' || data.unitPrice <= 0) {
      errors.push('单价必须大于0')
    } else if (!validateUnitPrice(data.unitPrice)) {
      errors.push('单价范围应在0-100元之间')
    }
  }

  // 计量单位验证
  if (data.unit !== undefined) {
    if (!data.unit || typeof data.unit !== 'string') {
      errors.push('计量单位不能为空')
    } else if (data.unit.length > 10) {
      errors.push('计量单位最多10个字符')
    }
  }

  // 安装位置验证
  if (data.location !== undefined && data.location !== null) {
    if (typeof data.location === 'string' && data.location.length > 100) {
      errors.push('安装位置最多100个字符')
    }
  }

  // 备注验证
  if (data.remarks !== undefined && data.remarks !== null) {
    if (typeof data.remarks === 'string' && data.remarks.length > 200) {
      errors.push('备注信息最多200个字符')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 检查显示名称唯一性
 */
async function checkDisplayNameUnique(
  roomId: string,
  displayName: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const existingMeters = await meterQueries.findByRoom(roomId)
    const nameExists = existingMeters.some((m: any) => 
      m.displayName === displayName && m.id !== excludeId
    )
    return !nameExists
  } catch (error) {
    console.error('Failed to check display name uniqueness:', error)
    return false
  }
}