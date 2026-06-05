import type { MiddlewareHandler } from 'hono'

import type { MinixServerEnv } from '../lib/env'

/**
 * phase08-03 最小安全头：
 * 先冻结对管理后台安全收益最高、且不会破坏现有 UI 的基础响应头。
 */
export function createSecurityHeaders(
  env: Pick<MinixServerEnv, 'isProduction'>
): MiddlewareHandler {
  return async (c, next) => {
    await next()
    applySecurityHeaders(c.res.headers, c.req.raw, env)
  }
}

export function applySecurityHeaders(
  headers: Headers,
  request: Request,
  env: Pick<MinixServerEnv, 'isProduction'>
) {
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  headers.set('Origin-Agent-Cluster', '?1')
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )

  if (env.isProduction && isSecureRequest(request)) {
    headers.set(
      'Strict-Transport-Security',
      'max-age=15552000; includeSubDomains'
    )
  }
}

function isSecureRequest(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const forwardedProto = request.headers
      .get('x-forwarded-proto')
      ?.split(',')[0]
      ?.trim()

    return (forwardedProto || requestUrl.protocol.replace(/:$/, '')) === 'https'
  } catch {
    return false
  }
}
