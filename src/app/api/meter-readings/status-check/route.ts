import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const METER_READING_STATUS_CHECK_FORMAL_HOST = 'server/routes/meter-readings.ts'
const METER_READING_STATUS_CHECK_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/meter-readings/status-check/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/meter-readings/status-check` 的状态巡检统一收口到 `server/routes/meter-readings.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再直接复用 shared helper。
 */
async function handleMeterReadingStatusCheckCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'meter-reading-status-check-api',
    migrationHost: METER_READING_STATUS_CHECK_FORMAL_HOST,
    exitCondition: METER_READING_STATUS_CHECK_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason: 'meter-readings 状态巡检已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleMeterReadingStatusCheckCompatProxy
