import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'

import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
} from '../../src/lib/auth/session'
import type { AuthAppEnv } from '../lib/auth-context'

/**
 * 为 Node 运行时补齐 Web Crypto，确保复用旧会话签名逻辑时行为一致。
 */
export async function ensureServerCrypto() {
  if (globalThis.crypto?.subtle) {
    return
  }

  const { webcrypto } = await import('node:crypto')

  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  })
}

/**
 * 从 Cookie 中解析最小管理员会话，并挂到 Hono 上下文中。
 * 无效或过期会话统一视为未登录，避免把脏状态继续向后传播。
 */
export function authSession(): MiddlewareHandler<AuthAppEnv> {
  return async (c, next) => {
    await ensureServerCrypto()

    const token = getCookie(c, AUTH_COOKIE_NAME)
    const session = await verifySessionToken(token)

    c.set('session', session)
    await next()
  }
}
