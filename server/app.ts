import { Hono } from 'hono'

import type { AuthAppEnv } from './lib/auth-context'
import {
  jsonApiError,
} from './lib/api-responses'
import {
  notImplementedError,
  normalizeApiError,
} from './lib/api-errors'
import type { MinixServerEnv } from './lib/env'
import { getMinixServerEnv } from './lib/env'
import { serveMinixAsset } from './lib/static'
import { authSession } from './middleware/auth-session'
import {
  applyCorsHeaders,
  createCorsConstraint,
  createRequestBodyLimit,
  createRequestTimeout,
} from './middleware/request-constraints'
import { createRequestLogger } from './middleware/request-logger'
import { requireAuth } from './middleware/require-auth'
import { runtimeBanner } from './middleware/runtime-banner'
import {
  applySecurityHeaders,
  createSecurityHeaders,
} from './middleware/security-headers'
import { createAuthRoutes } from './routes/auth'
import { createDomainRoutes } from './routes/domain'
import { createHealthRoutes } from './routes/health'

export function createApp(env: MinixServerEnv = getMinixServerEnv()) {
  const app = new Hono<AuthAppEnv>()
  const apiApp = new Hono<AuthAppEnv>()

  // Phase08-01 freezes the unified /api host and its public/protected boundary.
  app.use('*', runtimeBanner(env))
  app.use('*', createRequestLogger(env))
  apiApp.use('*', createSecurityHeaders(env))
  apiApp.use('*', createCorsConstraint(env))
  apiApp.use('*', createRequestBodyLimit(env))
  apiApp.use('*', createRequestTimeout(env))
  apiApp.use('*', authSession())

  apiApp.route('/', createHealthRoutes(env))
  apiApp.route('/auth', createAuthRoutes(env))
  // 先挂公共路由，再挂受保护的正式领域骨架，最后保留统一的受保护兜底出口。
  apiApp.route('/', createDomainRoutes(env))
  apiApp.all('*', requireAuth(), (c) =>
    jsonApiError(
      c,
      notImplementedError(
        '当前接口已通过最小认证门禁，但正式领域 API 仍处于 phase09-01 骨架期。未覆盖的受保护路径继续保留统一占位响应，不在本次任务中迁移业务逻辑。',
        {
          protected: true,
          publicPaths: env.api.publicPaths,
          domainHost: 'server/routes/*',
          domainServiceHost: 'src/lib/domain/*',
          migrationState: 'skeleton-only',
        }
      ),
      { env }
    )
  )

  app.route(env.api.basePath, apiApp)

  app.get('*', async (c) => serveMinixAsset(c, env))

  app.notFound((c) => {
    return c.text('Minix frontend route not found.', 404)
  })

  app.onError((error, c) => {
    console.error(`[${env.runtimeName}] unhandled error`, error)

    if (c.req.path.startsWith('/api/')) {
      const response = jsonApiError(c, normalizeApiError(error), { env })
      applySecurityHeaders(response.headers, c.req.raw, env)
      applyCorsHeaders(response.headers, c.req.raw, env)
      return response
    }

    const response = c.text('Minix runtime error.', 500)
    applySecurityHeaders(response.headers, c.req.raw, env)
    return response
  })

  return app
}

const app = createApp()

export default app
