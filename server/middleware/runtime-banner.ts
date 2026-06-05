import type { MiddlewareHandler } from 'hono'

import type { MinixServerEnv } from '../lib/env'

export function runtimeBanner(
  env: Pick<MinixServerEnv, 'nodeEnv' | 'runtimeName'>
): MiddlewareHandler {
  return async (c, next) => {
    await next()
    c.res.headers.set('x-rento-runtime', env.runtimeName)
    c.res.headers.set('x-rento-runtime-mode', env.nodeEnv)
  }
}
