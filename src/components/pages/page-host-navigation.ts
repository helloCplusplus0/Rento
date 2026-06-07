export interface PageHostNavigation {
  push?: (href: string) => void
  replace?: (href: string) => void
  back?: () => void
  reload?: () => void
}

function canUseWindow() {
  return typeof window !== 'undefined'
}

export function navigateWithHost(
  navigation: PageHostNavigation | undefined,
  href: string,
  options: { replace?: boolean } = {}
) {
  if (options.replace) {
    if (navigation?.replace) {
      navigation.replace(href)
      return
    }

    if (canUseWindow()) {
      window.location.replace(href)
    }
    return
  }

  if (navigation?.push) {
    navigation.push(href)
    return
  }

  if (canUseWindow()) {
    window.location.assign(href)
  }
}

export function goBackWithHost(
  navigation: PageHostNavigation | undefined,
  fallbackHref: string
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

export function reloadWithHost(navigation: PageHostNavigation | undefined) {
  if (navigation?.reload) {
    navigation.reload()
    return
  }

  if (canUseWindow()) {
    window.location.reload()
  }
}
