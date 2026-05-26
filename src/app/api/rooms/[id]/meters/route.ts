import { NextRequest, NextResponse } from 'next/server'

import type { MeterType } from '@/types/meter'
import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import {
  generateMeterNumber,
  generateSortOrder,
  METER_BUSINESS_RULES,
  validateDisplayName,
  validateUnitPrice,
} from '@/lib/meter-utils'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { meterQueries } from '@/lib/queries'

/**
 * 获取房间仪表列表
 * GET /api/rooms/[roomId]/meters
 */
async function handleGetRoomMeters(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const meters = await meterQueries.findByRoom(roomId)

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
    lastReading:
      meter.readings.length > 0
        ? Number(meter.readings[0].currentReading)
        : 0,
    lastReadingDate:
      meter.readings.length > 0 ? meter.readings[0].readingDate : null,
    readings: meter.readings.map((reading: any) => ({
      ...reading,
      previousReading: reading.previousReading
        ? Number(reading.previousReading)
        : null,
      currentReading: Number(reading.currentReading),
      usage: Number(reading.usage),
      unitPrice: Number(reading.unitPrice),
      amount: Number(reading.amount),
    })),
  }))

  return NextResponse.json({
    success: true,
    data: metersData,
    total: metersData.length,
  })
}

export const GET = withApiErrorHandler(handleGetRoomMeters, {
  requireAuth: true,
  module: 'room-meters-api',
  errorType: ErrorType.DATABASE_ERROR,
})

/**
 * 为房间添加仪表
 * POST /api/rooms/[roomId]/meters
 */
async function handlePostRoomMeters(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const data = await request.json()

  const validationResult = validateMeterData(data)
  if (!validationResult.isValid) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.errors },
      { status: 400 }
    )
  }

  const businessValidation = await validateMeterBusinessRules(roomId, data)
  if (!businessValidation.isValid) {
    return NextResponse.json(
      {
        error: 'Business rule validation failed',
        details: businessValidation.errors,
      },
      { status: 400 }
    )
  }

  const meterNumber = generateMeterNumber(data.meterType)
  const existingMeters = await meterQueries.findByRoom(roomId)
  const existingSortOrders = existingMeters.map((meter: any) => meter.sortOrder)
  const sortOrder = generateSortOrder(data.meterType, existingSortOrders)

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
    remarks: data.remarks,
  })

  const meterData = {
    ...meter,
    unitPrice: Number(meter.unitPrice),
  }

  await revalidateMutationPaths({
    scopes: ['dashboard', 'rooms', 'meters', 'contracts'],
    detailPaths: [`/rooms/${roomId}`],
  })

  return NextResponse.json(meterData, { status: 201 })
}

export const POST = withApiErrorHandler(handlePostRoomMeters, {
  requireAuth: true,
  module: 'room-meters-api',
  errorType: ErrorType.VALIDATION_ERROR,
})

/**
 * 验证仪表数据
 */
function validateMeterData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.displayName || typeof data.displayName !== 'string') {
    errors.push('显示名称不能为空')
  } else if (!validateDisplayName(data.displayName)) {
    errors.push(
      '显示名称格式不正确，最多50字符，支持中文、英文、数字、横线、下划线'
    )
  }

  const validMeterTypes: MeterType[] = [
    'ELECTRICITY',
    'COLD_WATER',
    'HOT_WATER',
    'GAS',
  ]
  if (!data.meterType || !validMeterTypes.includes(data.meterType)) {
    errors.push('请选择有效的仪表类型')
  }

  if (typeof data.unitPrice !== 'number' || data.unitPrice <= 0) {
    errors.push('单价必须大于0')
  } else if (!validateUnitPrice(data.unitPrice)) {
    errors.push('单价范围应在0-100元之间')
  }

  if (!data.unit || typeof data.unit !== 'string') {
    errors.push('计量单位不能为空')
  } else if (data.unit.length > 10) {
    errors.push('计量单位最多10个字符')
  }

  if (
    data.location &&
    typeof data.location === 'string' &&
    data.location.length > 100
  ) {
    errors.push('安装位置最多100个字符')
  }

  if (
    data.remarks &&
    typeof data.remarks === 'string' &&
    data.remarks.length > 200
  ) {
    errors.push('备注信息最多200个字符')
  }

  return {
    isValid: errors.length === 0,
    errors,
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
    const existingMeters = await meterQueries.findByRoom(roomId)

    if (existingMeters.length >= METER_BUSINESS_RULES.maxMetersPerRoom) {
      errors.push(
        `单个房间最多只能配置${METER_BUSINESS_RULES.maxMetersPerRoom}个仪表`
      )
    }

    const sameTypeCount = existingMeters.filter(
      (meter: any) => meter.meterType === data.meterType
    ).length
    if (sameTypeCount >= METER_BUSINESS_RULES.maxSameTypePerRoom) {
      errors.push(
        `单个房间同类型仪表最多只能配置${METER_BUSINESS_RULES.maxSameTypePerRoom}个`
      )
    }

    const nameExists = existingMeters.some(
      (meter: any) => meter.displayName === data.displayName
    )
    if (nameExists) {
      errors.push('显示名称在该房间内已存在，请使用不同的名称')
    }
  } catch (error) {
    console.error('Failed to validate business rules:', error)
    errors.push('业务规则验证失败，请重试')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
