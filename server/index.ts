import { serve } from '@hono/node-server'

import app from './app'
import { getMinixServerEnv } from './lib/env'

const env = getMinixServerEnv()

serve(
  {
    fetch: app.fetch,
    hostname: env.host,
    port: env.port,
  },
  (info) => {
    console.log(`Rento-miniX runtime listening on http://${info.address}:${info.port}`)
  }
)
