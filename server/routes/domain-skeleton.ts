import { Hono } from 'hono'

import type { DomainModuleBoundary } from '@/lib/domain'

import { notImplementedError } from '../lib/api-errors'
import { jsonApiError } from '../lib/api-responses'
import type { AuthAppEnv } from '../lib/auth-context'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'

interface DomainRouteSkeletonOptions {
  routeKey: 'contracts' | 'bills' | 'meter-readings' | 'rooms' | 'checkout'
  legacyCompat: {
    currentState: 'legacy-source-of-truth'
    targetStrategy: 'compat-wrapper' | 'thin-forwarder' | 'read-only-reference'
    legacyPaths: readonly string[]
    reason: string
    exitCondition: string
  }
  modules: readonly DomainModuleBoundary[]
}

/**
 * phase09-01 只冻结正式宿主的领域路由外壳。
 * 旧 src/app/api/* 继续保留 compat 宿主；未来跨聚合写事务必须收口到 src/lib/domain，
 * 路由层只负责请求/响应适配与鉴权门禁，不在这里直接迁业务逻辑。
 */
export function createDomainRouteSkeleton(
  env: MinixServerEnv,
  options: DomainRouteSkeletonOptions
) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        `phase09-01 仅冻结 ${options.routeKey} 领域路由骨架，正式业务逻辑仍待迁入共享领域服务。`,
        {
          phase: 'phase09-01',
          routeKey: options.routeKey,
          domainServiceHost: 'src/lib/domain',
          migrationState: 'skeleton-only',
          compatBoundary: {
            legacyHost: 'src/app/api/*',
            ...options.legacyCompat,
          },
          modules: options.modules.map((moduleBoundary) => ({
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

  return routeApp
}
