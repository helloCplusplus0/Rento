import { Hono } from 'hono'

import type { MinixServerEnv } from './lib/env'
import { getMinixServerEnv } from './lib/env'
import { serveMinixAsset } from './lib/static'
import { createRequestLogger } from './middleware/request-logger'
import { runtimeBanner } from './middleware/runtime-banner'
import { createHealthRoutes } from './routes/health'

export function createApp(env: MinixServerEnv = getMinixServerEnv()) {
  const app = new Hono()

  // Phase07 only freezes the minimal runtime chain. Auth and API guards land later.
  app.use('*', runtimeBanner(env))
  app.use('*', createRequestLogger(env))

  app.route('/api', createHealthRoutes(env))
  app.all('/api/*', (c) => {
    return c.json(
      {
        message: 'Minix runtime route not found.',
        path: c.req.path,
        runtime: env.runtimeName,
      },
      404
    )
  })

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
