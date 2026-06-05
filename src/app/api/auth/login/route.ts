import { NextRequest, NextResponse } from 'next/server'

import { verifyAdminCredentials } from '@/lib/auth/password'
import {
  buildSessionCookie,
  createSessionToken,
  shouldUseSecureSessionCookie,
} from '@/lib/auth/session'

/**
 * 兼容保留说明：
 * - 当前文件仅保留为旧 Next.js 宿主下的存量认证接口与迁移过渡入口。
 * - 自 phase08-02 起，新增认证骨架默认宿主固定为 `server/routes/auth.ts`。
 * - 后续新增认证能力不得再默认落到 `src/app/api/*`；本文件仅在旧运行线未完全退出前继续保留。
 */
export async function POST(request: NextRequest) {
  try {
    await ensureNodeCrypto()
    const rawBody = await request.text()
    const body = JSON.parse(rawBody || '{}') as {
      username?: string
      password?: string
    }
    const username = String(body.username || '').trim()
    const password = String(body.password || '')

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: '请输入用户名和密码',
          errorType: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json(
        {
          success: false,
          error: '用户名或密码错误',
          errorType: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }

    const token = await createSessionToken(username)
    const secureCookie = shouldUseSecureSessionCookie({
      protocol: request.headers.get('x-forwarded-proto') || request.nextUrl.protocol,
      hostname: request.nextUrl.hostname,
    })
    const response = NextResponse.json({
      success: true,
      data: {
        role: 'ADMIN',
        username,
      },
      timestamp: new Date().toISOString(),
    })
    const sessionCookie = buildSessionCookie(token, secureCookie)

    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options
    )

    return response
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '认证配置无效，请检查环境变量',
        errorType: 'SYSTEM_ERROR',
        details: error instanceof Error ? error.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

async function ensureNodeCrypto() {
  if (globalThis.crypto?.subtle) {
    return
  }

  const { webcrypto } = await import('crypto')
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  })
}
