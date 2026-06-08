import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const METER_READING_DETAIL_FORMAL_HOST = 'server/routes/meter-readings.ts'
const METER_READING_DETAIL_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/meter-readings/[id]/route.ts 可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/meter-readings/:id` 的详情读取、更新禁用语义与删除门禁统一收口到
 * `server/routes/meter-readings.ts`。旧 Next 入口仅保留为薄 compat proxy。
 */
async function handleMeterReadingDetailCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'meter-reading-detail-api',
    migrationHost: METER_READING_DETAIL_FORMAL_HOST,
    exitCondition: METER_READING_DETAIL_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason:
        'meter-readings 详情、更新禁用语义与删除门禁已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

/**
 * compat wrapper:
 * phase14-06 起 `/api/meter-readings/:id` PUT 的 disabled 语义由统一 Hono 宿主承接。
 */
export const PUT = handleMeterReadingDetailCompatProxy

/**
 * compat wrapper:
 * phase14-06 起 `/api/meter-readings/:id` DELETE 的删除门禁由统一 Hono 宿主承接。
 */
export const GET = handleMeterReadingDetailCompatProxy
export const DELETE = handleMeterReadingDetailCompatProxy
