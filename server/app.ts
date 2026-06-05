import { Hono } from 'hono'

import type { MinixServerEnv } from './lib/env'
import { getMinixServerEnv } from './lib/env'
import { serveMinixAsset } from './lib/static'
import { createRequestLogger } from './middleware/request-logger'
import { runtimeBanner } from './middleware/runtime-banner'
import { createAuthRoutes } from './routes/auth'
import { createHealthRoutes } from './routes/health'

export function createApp(env: MinixServerEnv = getMinixServerEnv()) {
  const app = new Hono()
  const apiApp = new Hono()

  // Phase08-01 freezes the unified /api host and its public/protected boundary.
  app.use('*', runtimeBanner(env))
  app.use('*', createRequestLogger(env))

  apiApp.route('/', createHealthRoutes(env))
  apiApp.route('/auth', createAuthRoutes(env))
  apiApp.all('*', (c) => createProtectedApiBoundaryResponse(c.req.path, env))

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
        '当前接口位于默认受保护边界内。phase08-01 仅冻结 /api 宿主，认证会话与正式路由将在后续子任务接入。',
      errorType: 'UNAUTHORIZED',
      path,
      runtime: env.runtimeName,
      publicPaths: env.api.publicPaths,
    }),
    {
      status: 401,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    }
  )
}
