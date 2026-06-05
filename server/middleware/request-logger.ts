import { logger } from 'hono/logger'

import type { MinixServerEnv } from '../lib/env'

export function createRequestLogger(env: Pick<MinixServerEnv, 'runtimeName'>) {
  return logger((message, ...rest) => {
    console.log(`[${env.runtimeName}] ${message}`, ...rest)
  })
}
