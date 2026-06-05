import { serve } from '@hono/node-server'

import { createApp } from './app'
import { getMinixServerEnv } from './lib/env'

const env = getMinixServerEnv()
const app = createApp(env)

const server = serve(
  {
    fetch: app.fetch,
    hostname: env.host,
    port: env.port,
  },
  (info) => {
    console.log(`Rento-miniX runtime listening on http://${info.address}:${info.port}`)
  }
)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`[${env.runtimeName}] received ${signal}, shutting down runtime...`)

    server.close((error) => {
      if (error) {
        console.error(`[${env.runtimeName}] failed to close runtime cleanly`, error)
        process.exit(1)
      }

      process.exit(0)
    })
  })
}
