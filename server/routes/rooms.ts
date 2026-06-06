import {
  contractsDomainBoundary,
  deleteGuardsDomainBoundary,
  metersDomainBoundary,
} from '@/lib/domain'
import { optimizedRoomQueries } from '@/lib/optimized-queries'
import { roomQueries } from '@/lib/queries'
import {
  formatRoomSearchResponse,
  parseRoomQueryParams,
} from '@/lib/room-utils'
import {
  deleteRoomWithoutRelatedHistory,
  isRoomDeleteGuardBlockedError,
  performRoomDeleteSafetyCheck,
} from '@/lib/domain/delete-guards'

import type { AuthAppEnv } from '../lib/auth-context'
import {
  notFoundError,
  notImplementedError,
  validationError,
} from '../lib/api-errors'
import { jsonApiError, jsonSuccess } from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
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
    'phase09-02 起由 server/routes/rooms.ts 与 src/lib/domain/delete-guards 承接房间删除门禁；旧 Next 入口仅保留 compat wrapper。',
  exitCondition:
    '当前端与存量调用切换到统一 Hono 宿主后，旧 src/app/api/rooms/* compat wrapper 可移除。',
} as const

function appendRoomsFallback(routeApp: Hono<AuthAppEnv>, env: MinixServerEnv) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        'phase09-02 仅迁入房间删除门禁；其余房间入口仍由 compat wrapper 或后续子任务承接。',
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

      return jsonSuccess(c, {
        data: result,
        message: result.message,
        env,
      })
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
