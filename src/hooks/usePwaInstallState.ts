'use client'

import { useCallback, useEffect, useState } from 'react'

type PwaStatus = 'unknown' | 'installed' | 'browser' | 'unsupported'
type PwaInstallMethod = 'native-prompt' | 'manual-ios' | 'not-available'
type PwaPlatform = 'android' | 'ios' | 'desktop'
type InstallPromptOutcome = 'accepted' | 'dismissed' | 'unavailable'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

interface PwaInstallState {
  status: PwaStatus
  installMethod: PwaInstallMethod
  platform: PwaPlatform
  isInstalled: boolean
  isInstallable: boolean
  isMobile: boolean
  promptInstall: () => Promise<InstallPromptOutcome>
}

function getPlatform(userAgent: string): PwaPlatform {
  if (/Android/i.test(userAgent)) {
    return 'android'
  }

  if (/iPad|iPhone|iPod/i.test(userAgent)) {
    return 'ios'
  }

  return 'desktop'
}

function isStandaloneMode() {
  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

function resolveInstallState(
  deferredPrompt: BeforeInstallPromptEvent | null
): Omit<PwaInstallState, 'promptInstall'> {
  const userAgent = window.navigator.userAgent
  const platform = getPlatform(userAgent)
  const isMobile = platform !== 'desktop'
  const isInstalled = isStandaloneMode()

  if (isInstalled) {
    return {
      status: 'installed',
      installMethod: 'not-available',
      platform,
      isInstalled: true,
      isInstallable: false,
      isMobile,
    }
  }

  if (deferredPrompt) {
    return {
      status: 'browser',
      installMethod: 'native-prompt',
      platform,
      isInstalled: false,
      isInstallable: true,
      isMobile,
    }
  }

  if (platform === 'ios') {
    const isIosSafari =
      /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)

    return {
      status: isIosSafari ? 'browser' : 'unsupported',
      installMethod: isIosSafari ? 'manual-ios' : 'not-available',
      platform,
      isInstalled: false,
      isInstallable: false,
      isMobile: true,
    }
  }

  const isSupportedChromium = /Chrome|Chromium|Edg|SamsungBrowser/i.test(
    userAgent
  )

  return {
    status: isSupportedChromium ? 'browser' : 'unsupported',
    installMethod: 'not-available',
    platform,
    isInstalled: false,
    isInstallable: false,
    isMobile,
  }
}

export function usePwaInstallState(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [state, setState] = useState<Omit<PwaInstallState, 'promptInstall'>>({
    status: 'unknown',
    installMethod: 'not-available',
    platform: 'desktop',
    isInstalled: false,
    isInstallable: false,
    isMobile: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)')

    const syncState = (prompt: BeforeInstallPromptEvent | null) => {
      setState(resolveInstallState(prompt))
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent
      installEvent.preventDefault()
      setDeferredPrompt(installEvent)
      syncState(installEvent)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      syncState(null)
    }

    const handleDisplayModeChange = () => {
      syncState(deferredPrompt)
    }

    syncState(deferredPrompt)

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt as EventListener
    )
    window.addEventListener('appinstalled', handleAppInstalled)

    if (typeof standaloneMediaQuery.addEventListener === 'function') {
      standaloneMediaQuery.addEventListener('change', handleDisplayModeChange)
    } else {
      standaloneMediaQuery.addListener(handleDisplayModeChange)
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt as EventListener
      )
      window.removeEventListener('appinstalled', handleAppInstalled)

      if (typeof standaloneMediaQuery.removeEventListener === 'function') {
        standaloneMediaQuery.removeEventListener(
          'change',
          handleDisplayModeChange
        )
      } else {
        standaloneMediaQuery.removeListener(handleDisplayModeChange)
      }
    }
  }, [deferredPrompt])

  const promptInstall = useCallback(async (): Promise<InstallPromptOutcome> => {
    if (!deferredPrompt) {
      return 'unavailable'
    }

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null)
    }

    return choice.outcome
  }, [deferredPrompt])

  return {
    ...state,
    promptInstall,
  }
}
