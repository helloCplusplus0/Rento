export const API_BASE_PATH = '/api' as const

export const PUBLIC_API_PATHS = [
  '/health',
  '/auth/login',
  '/auth/logout',
  '/auth/session',
] as const

export type PublicApiPath = (typeof PUBLIC_API_PATHS)[number]

export function getPublicApiPaths() {
  return PUBLIC_API_PATHS.map((path) => `${API_BASE_PATH}${path}`)
}

export function isPublicApiPath(pathname: string) {
  return getPublicApiPaths().some(
    (publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  )
}
