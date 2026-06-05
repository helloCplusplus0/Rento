import { Hono } from 'hono'

import type { MinixServerEnv } from '../lib/env'

/**
 * Phase08-01 只冻结公开认证路由的宿主归属与响应语义，
 * 真正的登录、登出、会话探测逻辑将在 phase08-02 接入。
 */
export function createAuthRoutes(env: MinixServerEnv) {
  const authRoutes = new Hono()

  authRoutes.all('/login', (c) => {
    return c.json(
      {
        success: false,
        error: '认证路由宿主已冻结，登录实现将在 phase08-02 接入。',
        errorType: 'NOT_IMPLEMENTED',
        path: c.req.path,
        runtime: env.runtimeName,
      },
      501
    )
  })

  authRoutes.all('/logout', (c) => {
    return c.json(
      {
        success: false,
        error: '认证路由宿主已冻结，登出实现将在 phase08-02 接入。',
        errorType: 'NOT_IMPLEMENTED',
        path: c.req.path,
        runtime: env.runtimeName,
      },
      501
    )
  })

  authRoutes.all('/session', (c) => {
    return c.json(
      {
        success: false,
        error: '认证路由宿主已冻结，会话探测实现将在 phase08-02 接入。',
        errorType: 'NOT_IMPLEMENTED',
        path: c.req.path,
        runtime: env.runtimeName,
      },
      501
    )
  })

  return authRoutes
}
