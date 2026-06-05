import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'

import { verifyAdminCredentials } from '../../src/lib/auth/password'
import {
  buildSessionCookie,
  clearSessionCookie,
  createSessionToken,
  shouldUseSecureSessionCookie,
} from '../../src/lib/auth/session'
import type { AuthAppEnv } from '../lib/auth-context'
import { systemError, unauthorizedError, validationError } from '../lib/api-errors'
import { jsonSuccess, readJsonBody } from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'
import { ensureServerCrypto } from '../middleware/auth-session'

interface LoginRequestBody {
  username?: string
  password?: string
}

/**
 * phase08-02 把最小认证闭环迁入 Hono，
 * 继续复用旧宿主的管理员凭证校验与 Cookie Session 语义。
 */
export function createAuthRoutes(env: MinixServerEnv) {
  const authRoutes = new Hono<AuthAppEnv>()

  authRoutes.post('/login', async (c) => {
    try {
      await ensureServerCrypto()

      const body = await readJsonBody<LoginRequestBody>(c, {
        allowEmpty: true,
        maxBytes: env.requestGovernance.maxRequestSize,
      })
      const payload = body || {}
      const username = String(payload.username || '').trim()
      const password = String(payload.password || '')

      if (!username || !password) {
        throw validationError('请输入用户名和密码')
      }

      if (!verifyAdminCredentials(username, password)) {
        throw unauthorizedError('用户名或密码错误')
      }

      const token = await createSessionToken(username)
      const sessionCookie = buildSessionCookie(
        token,
        shouldUseSecureCookie(c.req.raw, c.req.header('x-forwarded-proto'))
      )

      setCookie(
        c,
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.options
      )

      return jsonSuccess(c, {
        data: {
          role: 'ADMIN',
          username,
        },
        env,
      })
    } catch (error) {
      if (
        error instanceof Error &&
        ['ApiError', 'HTTPException'].includes(error.name)
      ) {
        throw error
      }

      throw systemError(
        '认证配置无效，请检查环境变量',
        error instanceof Error ? error.message : error,
        error
      )
    }
  })

  authRoutes.post('/logout', (c) => {
    const sessionCookie = clearSessionCookie(
      shouldUseSecureCookie(c.req.raw, c.req.header('x-forwarded-proto'))
    )

    setCookie(
      c,
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options
    )
    c.set('session', null)

    return jsonSuccess(c, {
      message: '已安全退出登录',
      env,
    })
  })

  authRoutes.get('/session', (c) => {
    const session = c.get('session')

    return jsonSuccess(c, {
      data: {
        authenticated: Boolean(session),
        user: session
          ? {
              role: session.role,
              username: session.username,
            }
          : null,
      },
      env,
    })
  })

  return authRoutes
}

function shouldUseSecureCookie(
  request: Request,
  forwardedProto?: string | undefined
) {
  const requestUrl = new URL(request.url)

  return shouldUseSecureSessionCookie({
    protocol: forwardedProto || requestUrl.protocol,
    hostname: requestUrl.hostname,
  })
}
