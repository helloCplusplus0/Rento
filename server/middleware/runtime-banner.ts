import type { MiddlewareHandler } from 'hono'

export const runtimeBanner: MiddlewareHandler = async (c, next) => {
  c.header('x-rento-runtime', 'minix')
  await next()
}
