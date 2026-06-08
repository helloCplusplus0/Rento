import { validateDisplayName, validateUnitPrice } from '@/lib/meter-utils'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { prisma } from '@/lib/prisma'
import { meterQueries } from '@/lib/queries'

import type { AuthAppEnv } from '../lib/auth-context'
import { payloadTooLargeError } from '../lib/api-errors'
import { readJsonBody } from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
import type { Context } from 'hono'
import { Hono } from 'hono'

const LEGACY_COMPAT = {
  currentState: 'compat-wrapper',
  targetStrategy: 'compat-wrapper',
  legacyPaths: [
    'src/app/api/meters/[meterId]/route.ts',
    'src/app/api/meters/[meterId]/status/route.ts',
  ] as const,
  reason:
    'phase13-03 起仪表详情、配置更新、启停切换与删除门禁由 server/routes/meters.ts 复用既有查询与删除语义承接；旧 Next 入口仅保留 compat wrapper。',
  exitCondition:
    '当前端与所有存量调用切换到统一 Hono 宿主后，旧 src/app/api/meters/[meterId]/* compat wrapper 可移除。',
} as const

type MeterUpdatePayload = {
  displayName?: string
  unitPrice?: number
  unit?: string
  location?: string | null
  remarks?: string | null
}

type MeterStatusPayload = {
  isActive?: boolean
}

type MeterReadingLike = {
  previousReading: unknown
  currentReading: unknown
  usage: unknown
  unitPrice: unknown
  amount: unknown
}

type MeterWithReadings = {
  unitPrice: unknown
  roomId: string | null
  readings?: MeterReadingLike[]
  [key: string]: unknown
}

function isBodyTooLarge(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes('request entity too large') ||
      error.message.includes('request body too large') ||
      error.message.includes('Body exceeded'))
  )
}

async function readCompatJsonBody<T>(c: Context, env: MinixServerEnv) {
  try {
    return await readJsonBody<T>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })
  } catch (error) {
    if (isBodyTooLarge(error)) {
      throw payloadTooLargeError('请求体过大', {
        maxBytes: env.requestGovernance.maxRequestSize,
      })
    }

    throw error
  }
}

function transformMeter(meter: MeterWithReadings) {
  return {
    ...meter,
    unitPrice: Number(meter.unitPrice),
    readings:
      meter.readings?.map((reading) => ({
        ...reading,
        previousReading:
          reading.previousReading !== null
            ? Number(reading.previousReading)
            : null,
        currentReading: Number(reading.currentReading),
        usage: Number(reading.usage),
        unitPrice: Number(reading.unitPrice),
        amount: Number(reading.amount),
      })) || [],
  }
}

function validateMeterUpdateData(data: MeterUpdatePayload) {
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

async function checkDisplayNameUnique(
  roomId: string,
  displayName: string,
  excludeId?: string
) {
  try {
    const existingMeters = await meterQueries.findByRoom(roomId)
    const nameExists = existingMeters.some(
      (meter) => meter.displayName === displayName && meter.id !== excludeId
    )
    return !nameExists
  } catch (error) {
    console.error('Failed to check display name uniqueness:', error)
    return false
  }
}

export function createMeterRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.get('/:meterId', async (c) => {
    const meterId = c.req.param('meterId')
    const meter = await meterQueries.findById(meterId)

    if (!meter) {
      return c.json({ error: 'Meter not found' }, 404)
    }

    return c.json(transformMeter(meter as unknown as MeterWithReadings))
  })

  routeApp.put('/:meterId', async (c) => {
    const meterId = c.req.param('meterId')
    const data = (await readCompatJsonBody<MeterUpdatePayload>(c, env)) ?? {}
    const existingMeter = await meterQueries.findById(meterId)

    if (!existingMeter) {
      return c.json({ error: 'Meter not found' }, 404)
    }

    const validationResult = validateMeterUpdateData(data)
    if (!validationResult.isValid) {
      return c.json(
        { error: 'Validation failed', details: validationResult.errors },
        400
      )
    }

    if (
      data.displayName &&
      data.displayName !== existingMeter.displayName &&
      existingMeter.roomId
    ) {
      const isUnique = await checkDisplayNameUnique(
        existingMeter.roomId,
        data.displayName,
        meterId
      )

      if (!isUnique) {
        return c.json(
          { error: 'Display name already exists in this room' },
          400
        )
      }
    }

    const updatedMeter = await meterQueries.update(meterId, {
      displayName: data.displayName,
      unitPrice: data.unitPrice,
      unit: data.unit,
      location: data.location ?? undefined,
      remarks: data.remarks ?? undefined,
    })

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms', 'meters', 'contracts'],
      detailPaths: updatedMeter.roomId ? [`/rooms/${updatedMeter.roomId}`] : [],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return c.json(transformMeter(updatedMeter as unknown as MeterWithReadings))
  })

  routeApp.delete('/:meterId', async (c) => {
    const meterId = c.req.param('meterId')
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
      return c.json({ error: 'Meter not found' }, 404)
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

      await revalidateMutationPaths({
        scopes: ['dashboard', 'rooms', 'meters', 'contracts'],
        detailPaths: [`/rooms/${existingMeter.roomId}`],
        executionRuntime: 'hono-runtime',
        runtimeName: env.runtimeName,
      })

      return c.json({
        success: true,
        message:
          action === 'deactivate'
            ? '仪表已有历史，已停用并保留历史读数与计费事实'
            : '仪表已有历史且已处于停用状态，继续保留历史读数与计费事实',
        action,
        hasHistoricalFacts: true,
        details: {
          readingCount,
          billCount,
          billDetailCount,
          roomId: existingMeter.roomId,
          roomNumber: existingMeter.room.roomNumber,
          suggestion:
            '如需换表，请保留旧表为停用状态后再新增新表；当前数据模型不提供结构化解绑',
          compatBoundary: LEGACY_COMPAT,
        },
      })
    }

    await prisma.meter.delete({
      where: { id: meterId },
    })

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms', 'meters', 'contracts'],
      detailPaths: [`/rooms/${existingMeter.roomId}`],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return c.json({
      success: true,
      message: '仪表无任何历史读数或计费事实，已执行硬删除',
      action: 'hard_delete',
      hasHistoricalFacts: false,
      details: {
        roomId: existingMeter.roomId,
        roomNumber: existingMeter.room.roomNumber,
        suggestion:
          '仅无历史的误加仪表适合直接删除；如需换表，请优先停用旧表并新增新表',
        compatBoundary: LEGACY_COMPAT,
      },
    })
  })

  routeApp.patch('/:meterId/status', async (c) => {
    const meterId = c.req.param('meterId')
    const body = (await readCompatJsonBody<MeterStatusPayload>(c, env)) ?? {}

    if (typeof body.isActive !== 'boolean') {
      return c.json({ error: 'isActive must be a boolean' }, 400)
    }

    const existingMeter = await meterQueries.findById(meterId)
    if (!existingMeter) {
      return c.json({ error: 'Meter not found' }, 404)
    }

    const updatedMeter = await meterQueries.update(meterId, {
      isActive: body.isActive,
    })

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms', 'meters', 'contracts'],
      detailPaths: updatedMeter.roomId ? [`/rooms/${updatedMeter.roomId}`] : [],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return c.json(transformMeter(updatedMeter as unknown as MeterWithReadings))
  })

  return routeApp
}
