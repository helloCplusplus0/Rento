import { NextRequest, NextResponse } from 'next/server'
import { meterQueries } from '@/lib/queries'
import { 
  generateMeterNumber, 
  generateSortOrder,
  validateDisplayName,
  validateUnitPrice,
  METER_BUSINESS_RULES
} from '@/lib/meter-utils'
import type { MeterType } from '@/types/meter'

/**
 * 获取房间仪表列表
 * GET /api/rooms/[roomId]/meters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params
    
    // 获取房间仪表列表
    const meters = await meterQueries.findByRoom(roomId)
    
    // 转换Decimal类型为number，并添加完整的仪表信息
    const metersData = meters.map((meter: any) => ({
      id: meter.id,
      meterNumber: meter.meterNumber,
      displayName: meter.displayName,
      meterType: meter.meterType,
      roomId: meter.roomId,
      unitPrice: Number(meter.unitPrice),
      unit: meter.unit,
      location: meter.location,
      isActive: meter.isActive,
      installDate: meter.installDate,
      sortOrder: meter.sortOrder,
      remarks: meter.remarks,
      createdAt: meter.createdAt,
      updatedAt: meter.updatedAt,
      room: meter.room,
      // 添加最新读数信息供抄表使用
      lastReading: meter.readings.length > 0 ? Number(meter.readings[0].currentReading) : 0,
      lastReadingDate: meter.readings.length > 0 ? meter.readings[0].readingDate : null,
      // 保留完整的readings数据
      readings: meter.readings.map((reading: any) => ({
        ...reading,
        previousReading: reading.previousReading ? Number(reading.previousReading) : null,
        currentReading: Number(reading.currentReading),
        usage: Number(reading.usage),
        unitPrice: Number(reading.unitPrice),
        amount: Number(reading.amount)
      }))
    }))
    
    return NextResponse.json({
      success: true,
      data: metersData,
      total: metersData.length
    })
  } catch (error) {
    console.error('Failed to fetch room meters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room meters' },
      { status: 500 }
    )
  }
}

/**
 * 为房间添加仪表
 * POST /api/rooms/[roomId]/meters
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params
    const data = await request.json()
    
    // 数据验证
    const validationResult = validateMeterData(data)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.errors },
        { status: 400 }
      )
    }
    
    // 业务规则检查
    const businessValidation = await validateMeterBusinessRules(roomId, data)
    if (!businessValidation.isValid) {
      return NextResponse.json(
        { error: 'Business rule validation failed', details: businessValidation.errors },
        { status: 400 }
      )
    }
    
    // 生成仪表编号
    const meterNumber = generateMeterNumber(data.meterType)
    
    // 生成排序值
    const existingMeters = await meterQueries.findByRoom(roomId)
    const existingSortOrders = existingMeters.map((m: any) => m.sortOrder)
    const sortOrder = generateSortOrder(data.meterType, existingSortOrders)
    
    // 创建仪表
    const meter = await meterQueries.create({
      meterNumber,
      displayName: data.displayName,
      meterType: data.meterType,
      roomId,
      unitPrice: data.unitPrice,
      unit: data.unit,
      location: data.location,
      installDate: data.installDate ? new Date(data.installDate) : undefined,
      sortOrder,
      remarks: data.remarks
    })
    
    // 转换返回数据
    const meterData = {
      ...meter,
      unitPrice: Number(meter.unitPrice)
    }
    
    return NextResponse.json(meterData, { status: 201 })
  } catch (error) {
    console.error('Failed to create meter:', error)
    return NextResponse.json(
      { error: 'Failed to create meter' },
      { status: 500 }
    )
  }
}

/**
 * 验证仪表数据
 */
function validateMeterData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 显示名称验证
  if (!data.displayName || typeof data.displayName !== 'string') {
    errors.push('显示名称不能为空')
  } else if (!validateDisplayName(data.displayName)) {
    errors.push('显示名称格式不正确，最多50字符，支持中文、英文、数字、横线、下划线')
  }

  // 仪表类型验证
  const validMeterTypes: MeterType[] = ['ELECTRICITY', 'COLD_WATER', 'HOT_WATER', 'GAS']
  if (!data.meterType || !validMeterTypes.includes(data.meterType)) {
    errors.push('请选择有效的仪表类型')
  }

  // 单价验证
  if (typeof data.unitPrice !== 'number' || data.unitPrice <= 0) {
    errors.push('单价必须大于0')
  } else if (!validateUnitPrice(data.unitPrice)) {
    errors.push('单价范围应在0-100元之间')
  }

  // 计量单位验证
  if (!data.unit || typeof data.unit !== 'string') {
    errors.push('计量单位不能为空')
  } else if (data.unit.length > 10) {
    errors.push('计量单位最多10个字符')
  }

  // 安装位置验证
  if (data.location && typeof data.location === 'string' && data.location.length > 100) {
    errors.push('安装位置最多100个字符')
  }

  // 备注验证
  if (data.remarks && typeof data.remarks === 'string' && data.remarks.length > 200) {
    errors.push('备注信息最多200个字符')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证仪表业务规则
 */
async function validateMeterBusinessRules(
  roomId: string, 
  data: any
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = []

  try {
    // 获取房间现有仪表
    const existingMeters = await meterQueries.findByRoom(roomId)
    
    // 检查房间仪表总数限制
    if (existingMeters.length >= METER_BUSINESS_RULES.maxMetersPerRoom) {
      errors.push(`单个房间最多只能配置${METER_BUSINESS_RULES.maxMetersPerRoom}个仪表`)
    }
    
    // 检查同类型仪表数量限制
    const sameTypeCount = existingMeters.filter((m: any) => m.meterType === data.meterType).length
    if (sameTypeCount >= METER_BUSINESS_RULES.maxSameTypePerRoom) {
      errors.push(`单个房间同类型仪表最多只能配置${METER_BUSINESS_RULES.maxSameTypePerRoom}个`)
    }
    
    // 检查显示名称唯一性（同房间内）
    const nameExists = existingMeters.some((m: any) => m.displayName === data.displayName)
    if (nameExists) {
      errors.push('显示名称在该房间内已存在，请使用不同的名称')
    }
  } catch (error) {
    console.error('Failed to validate business rules:', error)
    errors.push('业务规则验证失败，请重试')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}