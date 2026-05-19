import { NextResponse } from 'next/server'

import { clearSessionCookie } from '@/lib/auth/session'

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: '已安全退出登录',
    timestamp: new Date().toISOString(),
  })
  const sessionCookie = clearSessionCookie()

  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options
  )

  return response
}
