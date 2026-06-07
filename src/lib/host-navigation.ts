export interface HostNavigationAdapter {
  push?: (href: string) => void
  replace?: (href: string) => void
  back?: () => void
  refresh?: () => void
}

function canUseWindow() {
  return typeof window !== 'undefined'
}

export function pushWithHostNavigation(
  href: string,
  navigation?: HostNavigationAdapter
) {
  if (navigation?.push) {
    navigation.push(href)
    return
  }

  if (canUseWindow()) {
    window.location.assign(href)
  }
}

export function replaceWithHostNavigation(
  href: string,
  navigation?: HostNavigationAdapter
) {
  if (navigation?.replace) {
    navigation.replace(href)
    return
  }

  if (canUseWindow()) {
    window.location.replace(href)
  }
}

export function backWithHostNavigation(
  fallbackHref: string,
  navigation?: HostNavigationAdapter
) {
  if (navigation?.back) {
    navigation.back()
    return
  }

  if (!canUseWindow()) {
    return
  }

  if (window.history.length > 1) {
    window.history.back()
    return
  }

  window.location.assign(fallbackHref)
}

export function refreshWithHostNavigation(navigation?: HostNavigationAdapter) {
  if (navigation?.refresh) {
    navigation.refresh()
    return
  }

  if (canUseWindow()) {
    window.location.reload()
  }
}
