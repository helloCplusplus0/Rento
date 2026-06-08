import type { NavigateFunction, NavigateOptions } from 'react-router-dom'

import { minixClientEnv } from '../env'

const MINIX_ROUTER_PATHS = new Set([
  '/',
  '/rooms',
  '/add',
  '/add/room',
  '/add/contract',
  '/contracts',
  '/contracts/new',
  '/bills',
  '/bills/create',
  '/renters',
  '/renters/new',
  '/meter-readings/batch',
  '/meter-readings/history',
  '/settings',
  '/login',
  '/offline',
  '/loading',
  '/error',
  '/404',
])

const MINIX_ROUTER_PATH_PATTERNS = [
  /^\/rooms\/[^/]+$/,
  /^\/rooms\/[^/]+\/edit$/,
  /^\/contracts\/[^/]+$/,
  /^\/contracts\/[^/]+\/edit$/,
  /^\/contracts\/[^/]+\/renew$/,
  /^\/contracts\/[^/]+\/checkout$/,
  /^\/bills\/[^/]+$/,
  /^\/bills\/[^/]+\/edit$/,
  /^\/renters\/[^/]+$/,
  /^\/renters\/[^/]+\/edit$/,
] as const

const LEGACY_DOCUMENT_PATH_PATTERNS = [
  /^\/bills\/stats$/,
  /^\/system-health$/,
  /^\/data-consistency$/,
] as const

const legacyAppOrigin = minixClientEnv.legacyAppOrigin

function resolvePathname(href: string) {
  if (typeof window === 'undefined') {
    return href
  }

  return new URL(href, window.location.origin).pathname
}

export function isMinixRouterPath(href: string) {
  const pathname = resolvePathname(href)

  return (
    MINIX_ROUTER_PATHS.has(pathname) ||
    MINIX_ROUTER_PATH_PATTERNS.some((pattern) => pattern.test(pathname))
  )
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
    `当前入口 ${pathname} 仍在后续阶段承接，当前 dev:minix 仅支持已迁移的正式页面。`
  )
}

// Prefer the migrated phase13 routes inside React Router and only fall back to
// document navigation for genuinely deferred legacy pages. After phase13-04,
// `/renters/**` and `/meter-readings/**` are owned by the minix router; the
// remaining document fallback is intentionally limited to `/bills/stats` and
// the ops-governance pages until their dedicated follow-up tasks land.
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
