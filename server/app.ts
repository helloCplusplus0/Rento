import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { runtimeBanner } from './middleware/runtime-banner'
import { getMinixServerEnv } from './lib/env'
import { serveMinixAsset } from './lib/static'
import { healthRoutes } from './routes/health'

const app = new Hono()
const env = getMinixServerEnv()

app.use('*', runtimeBanner)
app.use('/api/*', logger())

app.route('/api', healthRoutes)

app.get('*', async (c) => serveMinixAsset(c, env.distDir))

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json(
      {
        message: 'Minix runtime route not found.',
        path: c.req.path,
      },
      404
    )
  }

  return c.text('Minix frontend asset not found.', 404)
})

app.onError((error, c) => {
  console.error('[minix-runtime] unhandled error', error)

  if (c.req.path.startsWith('/api/')) {
    return c.json(
      {
        message: 'Minix runtime error.',
      },
      500
    )
  }

  return c.text('Minix runtime error.', 500)
})

export default app
