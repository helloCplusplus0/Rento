import { Hono } from 'hono'

import type { AuthAppEnv } from './lib/auth-context'
import type { MinixServerEnv } from './lib/env'
import { getMinixServerEnv } from './lib/env'
import { serveMinixAsset } from './lib/static'
import { authSession } from './middleware/auth-session'
import { createRequestLogger } from './middleware/request-logger'
import { requireAuth } from './middleware/require-auth'
import { runtimeBanner } from './middleware/runtime-banner'
import { createAuthRoutes } from './routes/auth'
import { createHealthRoutes } from './routes/health'

export function createApp(env: MinixServerEnv = getMinixServerEnv()) {
  const app = new Hono<AuthAppEnv>()
  const apiApp = new Hono<AuthAppEnv>()

  // Phase08-01 freezes the unified /api host and its public/protected boundary.
  app.use('*', runtimeBanner(env))
  app.use('*', createRequestLogger(env))
  apiApp.use('*', authSession())

  apiApp.route('/', createHealthRoutes(env))
  apiApp.route('/auth', createAuthRoutes(env))
  apiApp.all('*', requireAuth(), (c) =>
    createProtectedApiBoundaryResponse(c.req.path, env)
  )

  app.route(env.api.basePath, apiApp)

  app.get('*', async (c) => serveMinixAsset(c, env))

  app.notFound((c) => {
    return c.text('Minix frontend route not found.', 404)
  })

  app.onError((error, c) => {
    console.error(`[${env.runtimeName}] unhandled error`, error)

    if (c.req.path.startsWith('/api/')) {
      return c.json(
        {
          message: 'Minix runtime error.',
          runtime: env.runtimeName,
        },
        500
      )
    }

    return c.text('Minix runtime error.', 500)
  })

  return app
}

const app = createApp()

export default app

function createProtectedApiBoundaryResponse(
  path: string,
  env: MinixServerEnv
) {
  return new Response(
    JSON.stringify({
      success: false,
      error:
        '当前接口已通过最小认证门禁，但正式业务路由尚未迁入 Hono。phase08-02 仅接入认证闭环，不扩展业务 API。',
      errorType: 'NOT_IMPLEMENTED',
      path,
      runtime: env.runtimeName,
      protected: true,
      publicPaths: env.api.publicPaths,
    }),
    {
      status: 501,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    }
  )
}
