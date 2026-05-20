import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { validateDisplayName, validateUnitPrice } from '@/lib/meter-utils'
import { prisma } from '@/lib/prisma'
import { meterQueries } from '@/lib/queries'

/**
 * 获取仪表详情
 * GET /api/meters/[meterId]
 */
async function handleGetMeter(
  _request: NextRequest,
  { params }: { params: Promise<{ meterId: string }> }
) {
  const { meterId } = await params
  const meter = await meterQueries.findById(meterId)
  if (!meter) {
    return NextResponse.json({ error: 'Meter not found' }, { status: 404 })
  }

  const meterData = {
    ...meter,
    unitPrice: Number(meter.unitPrice),
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
  }

  return NextResponse.json(meterData)
}

export const GET = withApiErrorHandler(handleGetMeter, {
  requireAuth: true,
  module: 'meter-detail-api',
  errorType: ErrorType.DATABASE_ERROR,
})

/**
 * 更新仪表配置
 * PUT /api/meters/[meterId]
 */
async function handlePutMeter(
  request: NextRequest,
  { params }: { params: Promise<{ meterId: string }> }
) {
  const { meterId } = await params
  const data = await request.json()

  const existingMeter = await meterQueries.findById(meterId)
  if (!existingMeter) {
    return NextResponse.json({ error: 'Meter not found' }, { status: 404 })
  }

  const validationResult = validateMeterUpdateData(data)
  if (!validationResult.isValid) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.errors },
      { status: 400 }
    )
  }

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

  const updatedMeter = await meterQueries.update(meterId, {
    displayName: data.displayName,
    unitPrice: data.unitPrice,
    unit: data.unit,
    location: data.location,
    remarks: data.remarks,
  })

  const meterData = {
    ...updatedMeter,
    unitPrice: Number(updatedMeter.unitPrice),
    readings:
      updatedMeter.readings?.map((reading: any) => ({
        ...reading,
        previousReading: reading.previousReading
          ? Number(reading.previousReading)
          : null,
        currentReading: Number(reading.currentReading),
        usage: Number(reading.usage),
        unitPrice: Number(reading.unitPrice),
        amount: Number(reading.amount),
      })) || [],
  }

  return NextResponse.json(meterData)
}

export const PUT = withApiErrorHandler(handlePutMeter, {
  requireAuth: true,
  module: 'meter-detail-api',
  errorType: ErrorType.VALIDATION_ERROR,
})

/**
 * 移除仪表关联（停用优先，必要时才允许硬删除）
 * DELETE /api/meters/[meterId]
 */
async function handleDeleteMeter(
  _request: NextRequest,
  { params }: { params: Promise<{ meterId: string }> }
) {
  const { meterId } = await params
  const existingMeter = await prisma.meter.findUnique({
    where: { id: meterId },
    include: {
      room: {
        include: { building: true },
      },
      _count: {
        select: {
          readings: true,
        },
      },
    },
  })

  if (!existingMeter) {
    return NextResponse.json({ error: 'Meter not found' }, { status: 404 })
  }

  const [billCount, billDetailCount] = await Promise.all([
    prisma.bill.count({
      where: {
        meterReading: {
          meterId,
        },
      },
    }),
    prisma.billDetail.count({
      where: {
        meterReading: {
          meterId,
        },
      },
    }),
  ])

  const readingCount = existingMeter._count.readings
  const hasHistoricalFacts =
    readingCount > 0 || billCount > 0 || billDetailCount > 0

  if (hasHistoricalFacts) {
    if (existingMeter.isActive) {
      await meterQueries.softDelete(meterId)
    }

    const action = existingMeter.isActive ? 'deactivate' : 'already_inactive'

    return NextResponse.json({
      success: true,
      message:
        action === 'deactivate'
          ? '仪表已停用，历史读数与计费事实已保留'
          : '仪表已处于停用状态，历史读数与计费事实继续保留',
      action,
      details: {
        readingCount,
        billCount,
        billDetailCount,
        roomId: existingMeter.roomId,
        roomNumber: existingMeter.room.roomNumber,
        suggestion: '当前数据模型未提供物理解绑字段，请后续通过专用解绑流程处理当前绑定关系',
      },
    })
  }

  await prisma.meter.delete({
    where: { id: meterId },
  })

  return NextResponse.json({
    success: true,
    message: '仪表无任何历史读数或计费事实，已执行物理删除',
    action: 'hard_delete',
  })
}

export const DELETE = withApiErrorHandler(handleDeleteMeter, {
  requireAuth: true,
  module: 'meter-detail-api',
  errorType: ErrorType.VALIDATION_ERROR,
})

/**
 * 验证仪表更新数据
 */
function validateMeterUpdateData(data: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (data.displayName !== undefined) {
    if (!data.displayName || typeof data.displayName !== 'string') {
      errors.push('显示名称不能为空')
    } else if (!validateDisplayName(data.displayName)) {
      errors.push(
        '显示名称格式不正确，最多50字符，支持中文、英文、数字、横线、下划线'
      )
    }
  }

  if (data.unitPrice !== undefined) {
    if (typeof data.unitPrice !== 'number' || data.unitPrice <= 0) {
      errors.push('单价必须大于0')
    } else if (!validateUnitPrice(data.unitPrice)) {
      errors.push('单价范围应在0-100元之间')
    }
  }

  if (data.unit !== undefined) {
    if (!data.unit || typeof data.unit !== 'string') {
      errors.push('计量单位不能为空')
    } else if (data.unit.length > 10) {
      errors.push('计量单位最多10个字符')
    }
  }

  if (data.location !== undefined && data.location !== null) {
    if (typeof data.location === 'string' && data.location.length > 100) {
      errors.push('安装位置最多100个字符')
    }
  }

  if (data.remarks !== undefined && data.remarks !== null) {
    if (typeof data.remarks === 'string' && data.remarks.length > 200) {
      errors.push('备注信息最多200个字符')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
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
    const nameExists = existingMeters.some(
      (meter: any) => meter.displayName === displayName && meter.id !== excludeId
    )
    return !nameExists
  } catch (error) {
    console.error('Failed to check display name uniqueness:', error)
    return false
  }
}
