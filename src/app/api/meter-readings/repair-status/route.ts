import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const METER_READING_REPAIR_FORMAL_HOST = 'server/routes/meter-readings.ts'
const METER_READING_REPAIR_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/meter-readings/repair-status/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/meter-readings/repair-status` 的状态修复统一收口到 `server/routes/meter-readings.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再直接复用 shared helper。
 */
async function handleMeterReadingRepairCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'meter-reading-repair-api',
    migrationHost: METER_READING_REPAIR_FORMAL_HOST,
    exitCondition: METER_READING_REPAIR_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason: 'meter-readings 状态修复已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const POST = handleMeterReadingRepairCompatProxy
