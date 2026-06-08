import type { RoomStatus } from '@prisma/client'
import {
  contractsDomainBoundary,
  deleteGuardsDomainBoundary,
  metersDomainBoundary,
} from '@/lib/domain'
import {
  generateMeterNumber,
  generateSortOrder,
  METER_BUSINESS_RULES,
  validateDisplayName,
  validateUnitPrice,
} from '@/lib/meter-utils'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { optimizedRoomQueries } from '@/lib/optimized-queries'
import { prisma } from '@/lib/prisma'
import { buildingQueries, meterQueries, roomQueries } from '@/lib/queries'
import {
  formatBatchUpdateResponse,
  formatRoomSearchResponse,
  parseRoomQueryParams,
  transformRoomDecimalFields,
} from '@/lib/room-utils'
import { roomValidationRules, validateData } from '@/lib/validation'
import {
  deleteRoomWithoutRelatedHistory,
  performRoomBuildingReassignmentSafetyCheck,
  isRoomDeleteGuardBlockedError,
  performRoomDeleteSafetyCheck,
} from '@/lib/domain/delete-guards'

import type { AuthAppEnv } from '../lib/auth-context'
import {
  notFoundError,
  notImplementedError,
  payloadTooLargeError,
  validationError,
} from '../lib/api-errors'
import { jsonApiError, jsonSuccess, readJsonBody } from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
import type { Context } from 'hono'
import { Hono } from 'hono'

const LEGACY_COMPAT = {
  currentState: 'compat-wrapper',
  targetStrategy: 'compat-wrapper',
  legacyPaths: [
    'src/app/api/rooms/route.ts',
    'src/app/api/rooms/batch/route.ts',
    'src/app/api/rooms/[id]/route.ts',
    'src/app/api/rooms/[id]/status/route.ts',
    'src/app/api/rooms/[id]/meters/route.ts',
  ] as const,
  reason:
    '房间列表、房间创建、批量创建、详情读取、详情编辑、单体状态更新、房间仪表列表/新增与删除门禁已由 server/routes/rooms.ts 承接；房间批量状态更新仍保留旧 Next compat wrapper。',
  exitCondition:
    '当前端与存量调用切换到统一 Hono 宿主后，旧 src/app/api/rooms/* compat wrapper 可移除。',
} as const

function appendRoomsFallback(routeApp: Hono<AuthAppEnv>, env: MinixServerEnv) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        '当前房间列表、房间创建、批量创建、详情读取、详情编辑、单体状态更新、房间仪表列表/新增与删除门禁已迁入统一 Hono 宿主；房间批量状态更新等入口仍由 compat wrapper 或后续子任务承接。',
        {
          phase: 'phase09-02',
          routeKey: 'rooms',
          domainServiceHost: 'src/lib/domain',
          migrationState: 'partial-migrated',
          compatBoundary: LEGACY_COMPAT,
          modules: [
            deleteGuardsDomainBoundary,
            contractsDomainBoundary,
            metersDomainBoundary,
          ].map((moduleBoundary) => ({
            name: moduleBoundary.name,
            description: moduleBoundary.description,
            compatBoundary: moduleBoundary.compatBoundary,
            transactionBoundary: moduleBoundary.transactionBoundary,
          })),
        }
      ),
      { env }
    )
  })
}

const VALID_ROOM_STATUSES: RoomStatus[] = [
  'VACANT',
  'OCCUPIED',
  'OVERDUE',
  'MAINTENANCE',
]

type RoomUpdatePayload = {
  roomNumber?: string
  floorNumber?: number
  buildingId?: string
  roomType?: 'SHARED' | 'WHOLE' | 'SINGLE'
  area?: number
  rent?: number
  status?: RoomStatus
  currentRenter?: string
  overdueDays?: number
}

type RoomCreatePayload = {
  roomNumber?: string
  floorNumber?: number
  roomType?: 'SHARED' | 'WHOLE' | 'SINGLE'
  area?: number
  rent?: number
  buildingId?: string
}

type RoomBatchCreateItemPayload = {
  roomNumber?: string
  floorNumber?: number | string
  roomType?: 'SHARED' | 'WHOLE' | 'SINGLE'
  area?: number | string
  rent?: number | string
}

type RoomBatchCreatePayload = {
  buildingId?: string
  rooms?: RoomBatchCreateItemPayload[]
}

type RoomMeterPayload = {
  displayName?: string
  meterType?: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  unitPrice?: number
  unit?: string
  location?: string
  installDate?: string
  remarks?: string
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

function transformRoomMeter(meter: {
  id: string
  meterNumber: string
  displayName: string
  meterType: string
  roomId: string | null
  unitPrice: unknown
  unit: string
  location: string | null
  isActive: boolean
  installDate: Date | null
  sortOrder: number
  remarks: string | null
  createdAt: Date
  updatedAt: Date
  room?: unknown
  readings: Array<{
    previousReading: unknown
    currentReading: unknown
    usage: unknown
    unitPrice: unknown
    amount: unknown
    readingDate: Date
  }>
}) {
  return {
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
      meter.readings.length > 0 ? Number(meter.readings[0].currentReading) : 0,
    lastReadingDate:
      meter.readings.length > 0 ? meter.readings[0].readingDate : null,
    readings: meter.readings.map((reading) => ({
      ...reading,
      previousReading:
        reading.previousReading !== null
          ? Number(reading.previousReading)
          : null,
      currentReading: Number(reading.currentReading),
      usage: Number(reading.usage),
      unitPrice: Number(reading.unitPrice),
      amount: Number(reading.amount),
    })),
  }
}

function validateRoomMeterData(data: RoomMeterPayload) {
  const errors: string[] = []

  if (!data.displayName || typeof data.displayName !== 'string') {
    errors.push('显示名称不能为空')
  } else if (!validateDisplayName(data.displayName)) {
    errors.push(
      '显示名称格式不正确，最多50字符，支持中文、英文、数字、横线、下划线'
    )
  }

  const validMeterTypes = [
    'ELECTRICITY',
    'COLD_WATER',
    'HOT_WATER',
    'GAS',
  ] as const
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

async function validateRoomMeterBusinessRules(
  roomId: string,
  data: Required<Pick<RoomMeterPayload, 'displayName' | 'meterType'>>
) {
  const errors: string[] = []

  try {
    const existingMeters = await meterQueries.findByRoom(roomId)

    if (existingMeters.length >= METER_BUSINESS_RULES.maxMetersPerRoom) {
      errors.push(
        `单个房间最多只能配置${METER_BUSINESS_RULES.maxMetersPerRoom}个仪表`
      )
    }

    const sameTypeCount = existingMeters.filter(
      (meter) => meter.meterType === data.meterType
    ).length
    if (sameTypeCount >= METER_BUSINESS_RULES.maxSameTypePerRoom) {
      errors.push(
        `单个房间同类型仪表最多只能配置${METER_BUSINESS_RULES.maxSameTypePerRoom}个`
      )
    }

    const nameExists = existingMeters.some(
      (meter) => meter.displayName === data.displayName
    )
    if (nameExists) {
      errors.push('显示名称在该房间内已存在，请使用不同的名称')
    }
  } catch (error) {
    console.error('Failed to validate room meter business rules:', error)
    errors.push('业务规则验证失败，请重试')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

function toRequiredRoomMeterPayload(data: RoomMeterPayload) {
  return data as RoomMeterPayload & {
    displayName: string
    meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
    unitPrice: number
    unit: string
  }
}

function parseCompatNumber(value: number | string | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    return Number.parseFloat(value)
  }

  return Number.NaN
}

function parseCompatInteger(value: number | string | undefined) {
  if (typeof value === 'number') {
    return Math.trunc(value)
  }

  if (typeof value === 'string') {
    return Number.parseInt(value, 10)
  }

  return Number.NaN
}

async function validateCreateRoomBusinessRules(roomData: RoomCreatePayload) {
  try {
    const building = await buildingQueries.findById(roomData.buildingId as string)
    if (!building) {
      return {
        body: { error: 'Building not found' },
        status: 404 as const,
      }
    }

    const existingRooms = await prisma.room.findMany({
      where: {
        buildingId: roomData.buildingId,
        roomNumber: roomData.roomNumber,
      },
    })

    if (existingRooms.length > 0) {
      return {
        body: { error: 'Room number already exists in this building' },
        status: 409 as const,
      }
    }

    return null
  } catch (error) {
    console.error('Business validation error:', error)
    return {
      body: { error: 'Business validation failed' },
      status: 500 as const,
    }
  }
}

export function createRoomRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.get('/', async (c) => {
    const searchParams = new URL(c.req.url).searchParams
    const includeMeters = searchParams.get('includeMeters') === 'true'

    if (includeMeters) {
      const now = new Date()
      const rooms = await optimizedRoomQueries.findWithMeters()

      const roomsWithMeters = rooms.map((room) => {
        const activeContract =
          room.contracts.find(
            (contract: {
              status: string
              startDate: string | Date
              endDate: string | Date
            }) =>
              contract.status === 'ACTIVE' &&
              now >= new Date(contract.startDate) &&
              now <= new Date(contract.endDate)
          ) || null

        const meters = room.meters.map(
          (meter: {
            id: string
            displayName: string
            meterType: string
            unitPrice: number | string
            unit: string
            location: string | null
            isActive: boolean
            readings: Array<{
              currentReading: number | string
              readingDate: string | Date
            }>
          }) => ({
            id: meter.id,
            displayName: meter.displayName,
            meterType: meter.meterType,
            unitPrice: Number(meter.unitPrice),
            unit: meter.unit,
            location: meter.location,
            isActive: meter.isActive,
            lastReading:
              meter.readings.length > 0
                ? Number(meter.readings[0].currentReading)
                : 0,
            lastReadingDate:
              meter.readings.length > 0 ? meter.readings[0].readingDate : null,
            contractId: activeContract?.id || null,
            contractNumber: activeContract?.contractNumber || null,
            renterName: activeContract?.renter?.name || null,
            contractStatus: activeContract?.status || null,
          })
        )

        return {
          ...room,
          rent: Number(room.rent),
          area: room.area ? Number(room.area) : null,
          building: {
            ...room.building,
            totalRooms: Number(room.building.totalRooms),
          },
          meters,
          activeContract: activeContract
            ? {
                id: activeContract.id,
                contractNumber: activeContract.contractNumber,
                renter: activeContract.renter,
                startDate: activeContract.startDate,
                endDate: activeContract.endDate,
                status: activeContract.status,
              }
            : null,
        }
      })

      return c.json(roomsWithMeters)
    }

    const params = parseRoomQueryParams(searchParams)
    const result = await roomQueries.searchRooms(params)

    return c.json(
      formatRoomSearchResponse({
        rooms: result.rooms,
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        aggregations: result.aggregations,
      })
    )
  })

  routeApp.post('/', async (c) => {
    let roomData: RoomCreatePayload

    try {
      roomData = await c.req.json<RoomCreatePayload>()
    } catch {
      return c.json({ error: 'Invalid JSON data' }, 400)
    }

    const validationErrors = validateData(roomData, roomValidationRules)
    if (validationErrors.length > 0) {
      return c.json(
        {
          error: 'Validation failed',
          details: validationErrors,
        },
        400
      )
    }

    const businessValidation = await validateCreateRoomBusinessRules(roomData)
    if (businessValidation) {
      return c.json(businessValidation.body, businessValidation.status)
    }

    const newRoom = await roomQueries.create(roomData as {
      roomNumber: string
      floorNumber: number
      roomType: 'SHARED' | 'WHOLE' | 'SINGLE'
      area?: number
      rent: number
      buildingId: string
    })
    const transformedRoom = transformRoomDecimalFields(newRoom)

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms'],
      detailPaths: [`/rooms/${newRoom.id}`],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return c.json(transformedRoom, 201)
  })

  routeApp.post('/batch', async (c) => {
    const body = (await readCompatJsonBody<RoomBatchCreatePayload>(c, env)) ?? {}
    const { buildingId, rooms } = body

    if (!buildingId || typeof buildingId !== 'string') {
      return c.json({ error: '楼栋ID不能为空' }, 400)
    }

    if (!Array.isArray(rooms) || rooms.length === 0) {
      return c.json({ error: '房间数据不能为空' }, 400)
    }

    if (rooms.length > 100) {
      return c.json({ error: '单次最多创建100间房间' }, 400)
    }

    const building = await buildingQueries.findById(buildingId)
    if (!building) {
      return c.json({ error: '楼栋不存在' }, 404)
    }

    const validatedRooms: Array<{
      roomNumber: string
      floorNumber: number
      roomType: 'SHARED' | 'WHOLE' | 'SINGLE'
      area?: number
      rent: number
    }> = []
    const roomNumbers = new Set<string>()

    for (const roomData of rooms) {
      if (!roomData.roomNumber || typeof roomData.roomNumber !== 'string') {
        return c.json({ error: '房间号不能为空' }, 400)
      }

      const roomNumber = roomData.roomNumber.trim()
      if (roomNumber.length === 0 || roomNumber.length > 20) {
        return c.json({ error: '房间号长度必须在1-20个字符之间' }, 400)
      }

      if (roomNumbers.has(roomNumber)) {
        return c.json({ error: `房间号 ${roomNumber} 重复` }, 400)
      }
      roomNumbers.add(roomNumber)

      const floorNumber = parseCompatInteger(roomData.floorNumber)
      if (Number.isNaN(floorNumber) || floorNumber < 1 || floorNumber > 50) {
        return c.json({ error: '楼层必须在1-50之间' }, 400)
      }

      if (!['SHARED', 'WHOLE', 'SINGLE'].includes(roomData.roomType ?? '')) {
        return c.json({ error: '房间类型无效' }, 400)
      }

      let area: number | undefined
      if (roomData.area !== undefined) {
        area = parseCompatNumber(roomData.area)
        if (Number.isNaN(area) || area <= 0 || area > 1000) {
          return c.json({ error: '房间面积必须在0-1000平方米之间' }, 400)
        }
      }

      const rent = parseCompatNumber(roomData.rent)
      if (Number.isNaN(rent) || rent <= 0 || rent > 100000) {
        return c.json({ error: '租金必须在0-100000元之间' }, 400)
      }

      validatedRooms.push({
        roomNumber,
        floorNumber,
        roomType: roomData.roomType as 'SHARED' | 'WHOLE' | 'SINGLE',
        area,
        rent,
      })
    }

    const existingRooms = await prisma.room.findMany({
      where: {
        buildingId,
        roomNumber: {
          in: Array.from(roomNumbers),
        },
      },
      select: { roomNumber: true },
    })

    if (existingRooms.length > 0) {
      const duplicateNumbers = existingRooms.map((room) => room.roomNumber).join(', ')
      return c.json({ error: `房间号已存在: ${duplicateNumbers}` }, 409)
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const createdRooms = []

        for (const roomData of validatedRooms) {
          const room = await tx.room.create({
            data: {
              ...roomData,
              buildingId,
              status: 'VACANT',
            },
            include: { building: true },
          })
          createdRooms.push(room)
        }

        const updatedBuilding = await tx.building.update({
          where: { id: buildingId },
          data: {
            totalRooms: {
              increment: validatedRooms.length,
            },
          },
        })

        return {
          createdRooms,
          updatedBuilding,
        }
      })

      const roomsData = result.createdRooms.map((room) => ({
        ...transformRoomDecimalFields(room),
        building: {
          ...room.building,
          totalRooms: Number(result.updatedBuilding.totalRooms),
        },
      }))

      await revalidateMutationPaths({
        scopes: ['dashboard', 'rooms'],
        executionRuntime: 'hono-runtime',
        runtimeName: env.runtimeName,
      })

      return c.json(
        {
          success: true,
          rooms: roomsData,
          count: roomsData.length,
          message: `成功创建 ${roomsData.length} 间房间`,
        },
        201
      )
    } catch (error) {
      console.error('Failed to create rooms:', error)

      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return c.json({ error: '房间号已存在，请检查后重试' }, 409)
      }

      throw error
    }
  })

  routeApp.patch('/', async (c) => {
    const body =
      (await readCompatJsonBody<{
        roomIds?: string[]
        status?: RoomStatus
        operator?: string
      }>(c, env)) ?? {}
    const { roomIds, status, operator } = body

    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      return c.json({ error: 'Room IDs must be a non-empty array' }, 400)
    }

    if (!status || !VALID_ROOM_STATUSES.includes(status)) {
      return c.json({ error: 'Invalid room status' }, 400)
    }

    if (roomIds.length > 100) {
      return c.json({ error: 'Cannot update more than 100 rooms at once' }, 400)
    }

    const result = await roomQueries.batchUpdateStatus(roomIds, status, operator)
    const response = formatBatchUpdateResponse(result)

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms', 'contracts'],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return c.json(response)
  })

  routeApp.get('/:id', async (c) => {
    const roomId = c.req.param('id')
    const room = await roomQueries.findById(roomId)

    if (!room) {
      return jsonApiError(c, notFoundError('Room not found'), { env })
    }

    return c.json(transformRoomDecimalFields(room))
  })

  routeApp.put('/:id', async (c) => {
    const roomId = c.req.param('id')
    const requestData =
      (await readCompatJsonBody<Record<string, unknown>>(c, env)) ?? {}
    const existingRoom = await roomQueries.findById(roomId)

    if (!existingRoom) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const updateData: RoomUpdatePayload = {}

    if (requestData.roomNumber !== undefined) {
      updateData.roomNumber = requestData.roomNumber as string
    }
    if (requestData.floorNumber !== undefined) {
      updateData.floorNumber = requestData.floorNumber as number
    }
    if (requestData.buildingId !== undefined) {
      updateData.buildingId = String(requestData.buildingId).trim()
    }
    if (requestData.roomType !== undefined) {
      updateData.roomType = requestData.roomType as RoomUpdatePayload['roomType']
    }
    if (requestData.area !== undefined) {
      updateData.area = requestData.area as number
    }
    if (requestData.rent !== undefined) {
      updateData.rent = requestData.rent as number
    }
    if (requestData.status !== undefined) {
      updateData.status = requestData.status as RoomStatus
    }
    if (requestData.currentRenter !== undefined) {
      updateData.currentRenter = requestData.currentRenter as string
    }
    if (requestData.overdueDays !== undefined) {
      updateData.overdueDays = requestData.overdueDays as number
    }

    const targetBuildingId = updateData.buildingId ?? existingRoom.buildingId

    if (updateData.buildingId !== undefined) {
      if (!updateData.buildingId) {
        return c.json({ error: '楼栋ID不能为空' }, 400)
      }

      if (updateData.buildingId !== existingRoom.buildingId) {
        const building = await buildingQueries.findById(updateData.buildingId)
        if (!building) {
          return c.json({ error: '楼栋不存在' }, 404)
        }

        const reassignmentSafetyCheck =
          await performRoomBuildingReassignmentSafetyCheck(
            roomId,
            updateData.buildingId
          )

        if (!reassignmentSafetyCheck.canReassign) {
          return c.json(
            {
              error:
                'Cannot reassign room to another building with related business history',
              code: reassignmentSafetyCheck.errorCode,
              details: {
                currentBuildingId: reassignmentSafetyCheck.currentBuildingId,
                targetBuildingId: reassignmentSafetyCheck.targetBuildingId,
                contractCount: reassignmentSafetyCheck.contractCount,
                billCount: reassignmentSafetyCheck.billCount,
                meterCount: reassignmentSafetyCheck.meterCount,
                meterReadingCount: reassignmentSafetyCheck.meterReadingCount,
                billDetailCount: reassignmentSafetyCheck.billDetailCount,
                relatedDataTypes: reassignmentSafetyCheck.relatedDataTypes,
                blockingReasons: reassignmentSafetyCheck.blockingReasons,
              },
              suggestion: reassignmentSafetyCheck.suggestion,
            },
            400
          )
        }
      }
    }

    if (
      updateData.roomNumber &&
      (updateData.roomNumber !== existingRoom.roomNumber ||
        targetBuildingId !== existingRoom.buildingId)
    ) {
      const duplicateRoom = await prisma.room.findFirst({
        where: {
          buildingId: targetBuildingId,
          roomNumber: updateData.roomNumber,
          id: { not: roomId },
        },
      })

      if (duplicateRoom) {
        return c.json(
          { error: 'Room number already exists in this building' },
          409
        )
      }
    }

    const updatedRoom = await roomQueries.update(roomId, updateData)
    const roomData = transformRoomDecimalFields(updatedRoom)

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms', 'contracts'],
      detailPaths: [`/rooms/${roomId}`],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return c.json(roomData)
  })

  routeApp.patch('/:id/status', async (c) => {
    const roomId = c.req.param('id')
    const body = await readCompatJsonBody<{ status?: RoomStatus }>(c, env)
    const status = body?.status

    if (!status || !VALID_ROOM_STATUSES.includes(status)) {
      return c.json({ error: 'Invalid room status' }, 400)
    }

    const existingRoom = await roomQueries.findById(roomId)
    if (!existingRoom) {
      return c.json({ error: 'Room not found' }, 404)
    }

    const updatedRoom = await roomQueries.update(roomId, { status })
    const roomData = transformRoomDecimalFields(updatedRoom)

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms', 'contracts'],
      detailPaths: [`/rooms/${roomId}`],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return c.json(roomData)
  })

  routeApp.get('/:id/meters', async (c) => {
    const roomId = c.req.param('id')
    const meters = await meterQueries.findByRoom(roomId)
    const metersData = meters.map((meter) => transformRoomMeter(meter))

    return c.json({
      success: true,
      data: metersData,
      total: metersData.length,
    })
  })

  routeApp.post('/:id/meters', async (c) => {
    const roomId = c.req.param('id')
    const data = (await readCompatJsonBody<RoomMeterPayload>(c, env)) ?? {}
    const validationResult = validateRoomMeterData(data)

    if (!validationResult.isValid) {
      return c.json(
        { error: 'Validation failed', details: validationResult.errors },
        400
      )
    }

    const meterPayload = toRequiredRoomMeterPayload(data)
    const businessValidation = await validateRoomMeterBusinessRules(roomId, {
      displayName: meterPayload.displayName,
      meterType: meterPayload.meterType,
    })
    if (!businessValidation.isValid) {
      return c.json(
        {
          error: 'Business rule validation failed',
          details: businessValidation.errors,
        },
        400
      )
    }

    const existingMeters = await meterQueries.findByRoom(roomId)
    const existingSortOrders = existingMeters.map((meter) => meter.sortOrder)
    const sortOrder = generateSortOrder(
      meterPayload.meterType,
      existingSortOrders
    )
    const meter = await meterQueries.create({
      meterNumber: generateMeterNumber(meterPayload.meterType),
      displayName: meterPayload.displayName,
      meterType: meterPayload.meterType,
      roomId,
      unitPrice: meterPayload.unitPrice,
      unit: meterPayload.unit,
      location: meterPayload.location,
      installDate: meterPayload.installDate
        ? new Date(meterPayload.installDate)
        : undefined,
      sortOrder,
      remarks: meterPayload.remarks,
    })
    const meterData = {
      ...meter,
      unitPrice: Number(meter.unitPrice),
    }

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms', 'meters', 'contracts'],
      detailPaths: [`/rooms/${roomId}`],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return c.json(meterData, 201)
  })

  routeApp.delete('/:id', async (c) => {
    const roomId = c.req.param('id')
    const force = c.req.query('force')
    const archive = c.req.query('archive')

    if (force === 'true' || archive === 'true') {
      return jsonApiError(
        c,
        validationError('Legacy delete overrides are no longer supported', {
          code: 'ROOM_LEGACY_DELETE_OVERRIDE_DISABLED',
          suggestion:
            '房间删除不再支持 force 或 archive 参数，请改用退租、归档、仪表停用或专用解绑流程',
          compatBoundary: LEGACY_COMPAT,
        }),
        { env }
      )
    }

    const safetyCheck = await performRoomDeleteSafetyCheck(roomId)

    if (!safetyCheck.canDelete) {
      return jsonApiError(
        c,
        validationError('Cannot delete room with related business history', {
          code: safetyCheck.errorCode,
          roomStatus: safetyCheck.roomStatus,
          contractCount: safetyCheck.contractCount,
          hasActiveContracts: safetyCheck.hasActiveContracts,
          activeContractCount: safetyCheck.activeContractCount,
          pendingContractCount: safetyCheck.pendingContractCount,
          billCount: safetyCheck.billCount,
          hasUnpaidBills: safetyCheck.hasUnpaidBills,
          unpaidBillCount: safetyCheck.unpaidBillCount,
          settledBillCount: safetyCheck.settledBillCount,
          meterCount: safetyCheck.meterCount,
          activeMeterCount: safetyCheck.activeMeterCount,
          inactiveMeterCount: safetyCheck.inactiveMeterCount,
          meterReadingCount: safetyCheck.meterReadingCount,
          billDetailCount: safetyCheck.billDetailCount,
          relatedDataTypes: safetyCheck.relatedDataTypes,
          blockingReasons: safetyCheck.blockingReasons,
          suggestion: safetyCheck.suggestion,
          compatBoundary: LEGACY_COMPAT,
        }),
        { env }
      )
    }

    try {
      const result = await deleteRoomWithoutRelatedHistory(roomId)

      await revalidateMutationPaths({
        scopes: ['dashboard', 'rooms', 'contracts'],
        detailPaths: [`/rooms/${roomId}`],
        executionRuntime: 'hono-runtime',
        runtimeName: env.runtimeName,
      })

      return c.json(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Room not found') {
        return jsonApiError(c, notFoundError('Room not found'), { env })
      }

      if (isRoomDeleteGuardBlockedError(error)) {
        const latestSafetyCheck = error.details

        return jsonApiError(
          c,
          validationError('Cannot delete room with related business history', {
            code: latestSafetyCheck.errorCode,
            roomStatus: latestSafetyCheck.roomStatus,
            contractCount: latestSafetyCheck.contractCount,
            hasActiveContracts: latestSafetyCheck.hasActiveContracts,
            activeContractCount: latestSafetyCheck.activeContractCount,
            pendingContractCount: latestSafetyCheck.pendingContractCount,
            billCount: latestSafetyCheck.billCount,
            hasUnpaidBills: latestSafetyCheck.hasUnpaidBills,
            unpaidBillCount: latestSafetyCheck.unpaidBillCount,
            settledBillCount: latestSafetyCheck.settledBillCount,
            meterCount: latestSafetyCheck.meterCount,
            activeMeterCount: latestSafetyCheck.activeMeterCount,
            inactiveMeterCount: latestSafetyCheck.inactiveMeterCount,
            meterReadingCount: latestSafetyCheck.meterReadingCount,
            billDetailCount: latestSafetyCheck.billDetailCount,
            relatedDataTypes: latestSafetyCheck.relatedDataTypes,
            blockingReasons: latestSafetyCheck.blockingReasons,
            suggestion: latestSafetyCheck.suggestion,
            compatBoundary: LEGACY_COMPAT,
          }),
          { env }
        )
      }

      throw error
    }
  })

  appendRoomsFallback(routeApp, env)

  return routeApp
}
