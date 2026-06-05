import {
  contractsDomainBoundary,
  deleteGuardsDomainBoundary,
  metersDomainBoundary,
} from '@/lib/domain'
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
