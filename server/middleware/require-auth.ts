import type { MiddlewareHandler } from 'hono'

import type { AuthAppEnv } from '../lib/auth-context'

/**
 * Hono 最小认证门禁。
 * 当前仅接受管理员会话，其余请求统一返回可复用的 401/403 语义。
 */
export function requireAuth(): MiddlewareHandler<AuthAppEnv> {
  return async (c, next) => {
    const session = c.get('session')

    if (!session) {
      return c.json(
        {
          success: false,
          error: '请先登录',
          errorType: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        },
        401
      )
    }

    if (session.role !== 'ADMIN') {
      return c.json(
        {
          success: false,
          error: '权限不足',
          errorType: 'FORBIDDEN',
          timestamp: new Date().toISOString(),
        },
        403
      )
    }

    await next()
  }
}
