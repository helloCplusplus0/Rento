import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const METER_READING_RELATED_BILLS_FORMAL_HOST = 'server/routes/meter-readings.ts'
const METER_READING_RELATED_BILLS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/meter-readings/[id]/related-bills/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/meter-readings/:id/related-bills` 的正式读取统一收口到
 * `server/routes/meter-readings.ts`。旧 Next 入口仅保留为薄 compat proxy。
 */
async function handleMeterReadingRelatedBillsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'meter-reading-related-bills-api',
    migrationHost: METER_READING_RELATED_BILLS_FORMAL_HOST,
    exitCondition: METER_READING_RELATED_BILLS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason:
        'meter-readings related-bills 已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleMeterReadingRelatedBillsCompatProxy
