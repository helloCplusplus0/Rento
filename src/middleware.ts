import { NextResponse, type NextRequest } from 'next/server'

import { getSessionFromRequest } from '@/lib/auth/session'

const PUBLIC_PAGE_PATHS = new Set(['/login'])
const PUBLIC_API_PREFIXES = ['/api/health', '/api/auth/login', '/api/auth/logout']

function isPublicApiPath(pathname: string) {
  return PUBLIC_API_PREFIXES.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  )
}

function createUnauthorizedApiResponse() {
  return NextResponse.json(
    {
      success: false,
      error: '请先登录',
      errorType: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  )
}

function appendSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

/**
 * Next.js 中间件
 * 用于处理路由守卫、身份验证和权限控制
 *
 * 当前为预留接口，后期可扩展以下功能：
 * 1. 用户身份验证检查
 * 2. 基于角色的权限验证
 * 3. 路由重定向逻辑
 * 4. 请求日志记录
 * 5. 安全头设置
 */
export function middleware(request: NextRequest) {
  // 获取请求路径
  const { pathname } = request.nextUrl
  const nextPath = request.nextUrl.pathname

  // 开发环境日志 (可选)
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'development'
  ) {
    console.log(`[Middleware] ${request.method} ${pathname}`)
  }

  return handleAuth(request, nextPath)
}

async function handleAuth(request: NextRequest, pathname: string) {
  const session = await getSessionFromRequest(request)

  if (pathname.startsWith('/api')) {
    if (isPublicApiPath(pathname)) {
      return appendSecurityHeaders(NextResponse.next())
    }

    if (!session) {
      return appendSecurityHeaders(createUnauthorizedApiResponse())
    }

    return appendSecurityHeaders(NextResponse.next())
  }

  if (PUBLIC_PAGE_PATHS.has(pathname)) {
    if (session) {
      return appendSecurityHeaders(
        NextResponse.redirect(new URL('/', request.url))
      )
    }

    return appendSecurityHeaders(NextResponse.next())
  }

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)

    return appendSecurityHeaders(NextResponse.redirect(loginUrl))
  }

  return appendSecurityHeaders(NextResponse.next())
}

/**
 * 中间件配置
 * 定义哪些路径需要经过中间件处理
 */
export const config = {
  /*
   * 匹配所有路径除了:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public files (images, etc.)
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
