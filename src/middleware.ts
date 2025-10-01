import { NextResponse, type NextRequest } from 'next/server'

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

  // 开发环境日志 (可选)
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'development'
  ) {
    console.log(`[Middleware] ${request.method} ${pathname}`)
  }

  // 预留：身份验证检查
  // const token = request.cookies.get('auth-token')
  // if (!token && isProtectedRoute(pathname)) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  // 预留：权限验证
  // const userRole = getUserRole(token)
  // if (!hasPermission(userRole, pathname)) {
  //   return NextResponse.redirect(new URL('/unauthorized', request.url))
  // }

  // 预留：路由重定向逻辑
  // if (pathname === '/old-path') {
  //   return NextResponse.redirect(new URL('/new-path', request.url))
  // }

  // 添加安全头 (可选)
  const response = NextResponse.next()

  // 预留：添加安全相关的响应头
  // response.headers.set('X-Frame-Options', 'DENY')
  // response.headers.set('X-Content-Type-Options', 'nosniff')
  // response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  return response
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// 预留：辅助函数，后期实现
// function isProtectedRoute(pathname: string): boolean {
//   const protectedRoutes = ['/admin', '/settings/system']
//   return protectedRoutes.some(route => pathname.startsWith(route))
// }

// function getUserRole(token: any): string {
//   // 从token中解析用户角色
//   return 'user' // 默认角色
// }

// function hasPermission(role: string, pathname: string): boolean {
//   // 检查用户角色是否有访问指定路径的权限
//   return true // 默认允许访问
// }
