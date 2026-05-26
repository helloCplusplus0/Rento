import { NextRequest, NextResponse } from 'next/server'

import {
  clearSessionCookie,
  shouldUseSecureSessionCookie,
} from '@/lib/auth/session'

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
