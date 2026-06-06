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

function resolvePathname(href: string) {
  if (typeof window === 'undefined') {
    return href
  }

  return new URL(href, window.location.origin).pathname
}

export function isMinixRouterPath(href: string) {
  return MINIX_ROUTER_PATHS.has(resolvePathname(href))
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

  window.location.assign(href)
}

export function openDocumentPath(href: string, target: '_self' | '_blank' = '_self') {
  if (typeof window === 'undefined') {
    return
  }

  if (target === '_blank') {
    const openedWindow = window.open(href, '_blank', 'noopener,noreferrer')

    if (openedWindow) {
      return
    }
  }

  window.location.assign(href)
}
