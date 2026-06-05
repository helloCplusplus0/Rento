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
import type { MinixServerEnv } from '../lib/env'
import { ensureServerCrypto } from '../middleware/auth-session'

interface LoginRequestBody {
  username?: string
  password?: string
}

class AuthRouteValidationError extends Error {}

/**
 * phase08-02 把最小认证闭环迁入 Hono，
 * 继续复用旧宿主的管理员凭证校验与 Cookie Session 语义。
 */
export function createAuthRoutes(env: MinixServerEnv) {
  const authRoutes = new Hono<AuthAppEnv>()

  authRoutes.post('/login', async (c) => {
    try {
      await ensureServerCrypto()

      const body = await readLoginRequestBody(c)
      const username = String(body.username || '').trim()
      const password = String(body.password || '')

      if (!username || !password) {
        return c.json(
          {
            success: false,
            error: '请输入用户名和密码',
            errorType: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
          },
          400
        )
      }

      if (!verifyAdminCredentials(username, password)) {
        return c.json(
          {
            success: false,
            error: '用户名或密码错误',
            errorType: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
          },
          401
        )
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

      return c.json({
        success: true,
        data: {
          role: 'ADMIN',
          username,
        },
        timestamp: new Date().toISOString(),
        runtime: env.runtimeName,
      })
    } catch (error) {
      if (error instanceof AuthRouteValidationError) {
        return c.json(
          {
            success: false,
            error: error.message,
            errorType: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
          },
          400
        )
      }

      return c.json(
        {
          success: false,
          error: '认证配置无效，请检查环境变量',
          errorType: 'SYSTEM_ERROR',
          details: error instanceof Error ? error.message : undefined,
          timestamp: new Date().toISOString(),
          runtime: env.runtimeName,
        },
        500
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

    return c.json({
      success: true,
      message: '已安全退出登录',
      timestamp: new Date().toISOString(),
      runtime: env.runtimeName,
    })
  })

  authRoutes.get('/session', (c) => {
    const session = c.get('session')

    return c.json({
      success: true,
      data: {
        authenticated: Boolean(session),
        user: session
          ? {
              role: session.role,
              username: session.username,
            }
          : null,
      },
      timestamp: new Date().toISOString(),
      runtime: env.runtimeName,
    })
  })

  return authRoutes
}

async function readLoginRequestBody(c: { req: { text(): Promise<string> } }) {
  const rawBody = await c.req.text()

  if (!rawBody.trim()) {
    return {} as LoginRequestBody
  }

  try {
    return JSON.parse(rawBody) as LoginRequestBody
  } catch {
    throw new AuthRouteValidationError('请求体必须是合法 JSON')
  }
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
