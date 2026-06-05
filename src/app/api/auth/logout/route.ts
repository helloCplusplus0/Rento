import { NextRequest, NextResponse } from 'next/server'

import {
  clearSessionCookie,
  shouldUseSecureSessionCookie,
} from '@/lib/auth/session'

/**
 * 兼容保留说明：
 * - 当前文件仅保留为旧 Next.js 宿主下的存量认证接口与迁移过渡入口。
 * - 自 phase08-02 起，新增认证骨架默认宿主固定为 `server/routes/auth.ts`。
 * - 后续新增认证能力不得再默认落到 `src/app/api/*`；本文件仅在旧运行线未完全退出前继续保留。
 */
export async function POST(request: NextRequest) {
  const secureCookie = shouldUseSecureSessionCookie({
    protocol: request.headers.get('x-forwarded-proto') || request.nextUrl.protocol,
    hostname: request.nextUrl.hostname,
  })
  const response = NextResponse.json({
    success: true,
    message: '已安全退出登录',
    timestamp: new Date().toISOString(),
  })
  const sessionCookie = clearSessionCookie(secureCookie)

  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options
  )

  return response
}
