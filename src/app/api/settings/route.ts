import { NextRequest } from 'next/server'

import { proxyToFormalHost } from '@/app/api/_shared/formal-host-proxy'

const SETTINGS_FORMAL_HOST = 'server/routes/settings.ts'
const SETTINGS_EXIT_CONDITION =
  '当前端与所有存量调用均切换到统一 Hono settings 宿主后，旧 src/app/api/settings* 路由可直接移除。'

/**
 * compat wrapper:
 * phase14-06 起 `/api/settings` 的正式读写统一收口到 `server/routes/settings.ts`。
 * 旧 Next 入口仅保留为薄 compat wrapper，不再维护第二套 settings 逻辑。
 */
async function handleSettingsCompatProxy(request: NextRequest) {
  return proxyToFormalHost(request, {
    routeLabel: 'settings-api',
    migrationHost: SETTINGS_FORMAL_HOST,
    exitCondition: SETTINGS_EXIT_CONDITION,
    compatMetadata: {
      closurePhase: 'phase14-06',
      compatReason: 'settings 首屏与基础治理读写已切到统一 Hono 宿主，旧 Next 路由仅保留兼容代理。',
    },
  })
}

export const GET = handleSettingsCompatProxy
export const POST = handleSettingsCompatProxy
export const DELETE = handleSettingsCompatProxy
