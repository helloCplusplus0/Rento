import type { MiddlewareHandler } from 'hono'

import { forbiddenError, unauthorizedError } from '../lib/api-errors'
import type { AuthAppEnv } from '../lib/auth-context'

/**
 * Hono 最小认证门禁。
 * 当前仅接受管理员会话，其余请求统一返回可复用的 401/403 语义。
 */
export function requireAuth(): MiddlewareHandler<AuthAppEnv> {
  return async (c, next) => {
    const session = c.get('session')

    if (!session) {
      throw unauthorizedError('请先登录')
    }

    if (session.role !== 'ADMIN') {
      throw forbiddenError('权限不足')
    }

    await next()
  }
}
