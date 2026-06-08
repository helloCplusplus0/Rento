import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const METER_READINGS_FORMAL_HOST = 'server/routes/meter-readings.ts'
const METER_READINGS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/meter-readings/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/meter-readings` 的历史读取与批量抄表写入统一收口到 `server/routes/meter-readings.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护 shared helper 或第二套写入逻辑。
 */
async function handleMeterReadingsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'meter-readings-api',
    migrationHost: METER_READINGS_FORMAL_HOST,
    exitCondition: METER_READINGS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason: 'meter-readings 主链已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleMeterReadingsCompatProxy
export const POST = handleMeterReadingsCompatProxy
