import type { NavigateFunction, NavigateOptions } from 'react-router-dom'

const MINIX_ROUTER_PATHS = new Set([
  '/',
  '/rooms',
  '/add',
  '/contracts',
  '/bills',
  '/settings',
  '/login',
  '/offline',
  '/loading',
  '/error',
  '/404',
])

const LEGACY_DOCUMENT_PATH_PATTERNS = [
  /^\/add\//,
  /^\/renters\//,
  /^\/rooms\/[^/]+$/,
  /^\/contracts\/[^/]+$/,
  /^\/contracts\/[^/]+\/renew$/,
  /^\/bills\/[^/]+$/,
  /^\/bills\/stats$/,
  /^\/meter-readings\/batch$/,
  /^\/meter-readings\/history$/,
  /^\/system-health$/,
  /^\/data-consistency$/,
] as const

const legacyAppOrigin =
  typeof import.meta !== 'undefined'
    ? import.meta.env.VITE_LEGACY_APP_ORIGIN?.trim() || ''
    : ''

function resolvePathname(href: string) {
  if (typeof window === 'undefined') {
    return href
  }

  return new URL(href, window.location.origin).pathname
}

export function isMinixRouterPath(href: string) {
  return MINIX_ROUTER_PATHS.has(resolvePathname(href))
}

function isLegacyDocumentPath(href: string) {
  const pathname = resolvePathname(href)

  return LEGACY_DOCUMENT_PATH_PATTERNS.some((pattern) => pattern.test(pathname))
}

function resolveDocumentHref(href: string) {
  if (typeof window === 'undefined') {
    return href
  }

  const resolvedUrl = new URL(href, window.location.origin)

  if (
    legacyAppOrigin &&
    legacyAppOrigin !== window.location.origin &&
    isLegacyDocumentPath(resolvedUrl.pathname)
  ) {
    return new URL(
      `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`,
      legacyAppOrigin
    ).toString()
  }

  return resolvedUrl.toString()
}

function showUnsupportedPhaseBoundaryNotice(href: string) {
  if (typeof window === 'undefined') {
    return
  }

  const pathname = resolvePathname(href)

  window.alert(
    `当前入口 ${pathname} 仍在后续阶段承接，当前 dev:minix 仅支持已迁移的一级正式页面。`
  )
}

// Keep phase13-02 list routes inside React Router, but fall back to
// document navigation for detail/create pages that still live on the legacy host.
export function navigateToMinixOrDocument(
  navigate: NavigateFunction,
  href: string,
  options?: NavigateOptions
) {
  if (typeof window === 'undefined') {
    navigate(href, options)
    return
  }

  if (isMinixRouterPath(href)) {
    navigate(href, options)
    return
  }

  if (isLegacyDocumentPath(href) && !legacyAppOrigin) {
    showUnsupportedPhaseBoundaryNotice(href)
    return
  }

  window.location.assign(resolveDocumentHref(href))
}

export function openDocumentPath(href: string, target: '_self' | '_blank' = '_self') {
  if (typeof window === 'undefined') {
    return
  }

  if (isLegacyDocumentPath(href) && !legacyAppOrigin) {
    showUnsupportedPhaseBoundaryNotice(href)
    return
  }

  const targetHref = resolveDocumentHref(href)

  if (target === '_blank') {
    const openedWindow = window.open(targetHref, '_blank', 'noopener,noreferrer')

    if (openedWindow) {
      return
    }
  }

  window.location.assign(targetHref)
}
