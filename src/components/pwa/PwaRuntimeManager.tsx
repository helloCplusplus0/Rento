'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RuntimeMode =
  | 'unsupported'
  | 'disabled'
  | 'ready'
  | 'update-available'
  | 'applying-update'

interface PwaRuntimeManagerProps {
  enabled: boolean
  serviceWorkerPath?: string
}

function isSecureRuntime() {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1'
  )
}

function shouldRegisterServiceWorker(enabled: boolean) {
  if (typeof window === 'undefined') {
    return false
  }

  if (!enabled || !('serviceWorker' in navigator)) {
    return false
  }

  return isSecureRuntime()
}

function isOwnedServiceWorkerRegistration(
  registration: ServiceWorkerRegistration,
  serviceWorkerPath: string
) {
  const candidates = [
    registration.active?.scriptURL,
    registration.installing?.scriptURL,
    registration.waiting?.scriptURL,
  ].filter(Boolean) as string[]

  return candidates.some((scriptUrl) => {
    try {
      const url = new URL(scriptUrl)
      return (
        url.origin === window.location.origin &&
        url.pathname === serviceWorkerPath
      )
    } catch {
      return false
    }
  })
}

async function unregisterOwnedServiceWorkers(serviceWorkerPath: string) {
  const registrations = await navigator.serviceWorker.getRegistrations()
  const ownedRegistrations = registrations.filter((registration) =>
    isOwnedServiceWorkerRegistration(registration, serviceWorkerPath)
  )

  if (ownedRegistrations.length === 0) {
    return
  }

  await Promise.all(
    ownedRegistrations.map((registration) => registration.unregister())
  )
}

export function PwaRuntimeManager({
  enabled,
  serviceWorkerPath = '/sw.js',
}: PwaRuntimeManagerProps) {
  const [mode, setMode] = useState<RuntimeMode>('disabled')
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const hasReloadedRef = useRef(false)

  const shouldRegister = useMemo(
    () => shouldRegisterServiceWorker(enabled),
    [enabled]
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (!('serviceWorker' in navigator)) {
      setMode('unsupported')
      return
    }

    const handleControllerChange = () => {
      if (hasReloadedRef.current) {
        return
      }

      hasReloadedRef.current = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange
    )

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange
      )
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    if (!shouldRegister) {
      setMode('disabled')
      setWaitingWorker(null)
      void unregisterOwnedServiceWorkers(serviceWorkerPath)
      return
    }

    let isDisposed = false
    let cleanupRegistrationListeners: (() => void) | undefined

    const markUpdateAvailable = (registration: ServiceWorkerRegistration) => {
      if (!registration.waiting || !navigator.serviceWorker.controller) {
        return
      }

      setWaitingWorker(registration.waiting)
      setDismissed(false)
      setMode('update-available')
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          serviceWorkerPath,
          {
            scope: '/',
          }
        )

        if (isDisposed) {
          return
        }

        setMode('ready')
        markUpdateAvailable(registration)

        const handleUpdateFound = () => {
          const installingWorker = registration.installing

          if (!installingWorker) {
            return
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              markUpdateAvailable(registration)
            }
          })
        }

        registration.addEventListener('updatefound', handleUpdateFound)

        const requestFreshCheck = () => {
          void registration.update()
        }

        document.addEventListener('visibilitychange', requestFreshCheck)

        cleanupRegistrationListeners = () => {
          registration.removeEventListener('updatefound', handleUpdateFound)
          document.removeEventListener('visibilitychange', requestFreshCheck)
        }
      } catch {
        if (!isDisposed) {
          setMode('disabled')
        }
      }
    }

    void register()

    return () => {
      isDisposed = true
      cleanupRegistrationListeners?.()
    }
  }, [serviceWorkerPath, shouldRegister])

  const handleApplyUpdate = () => {
    if (!waitingWorker) {
      return
    }

    setMode('applying-update')
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
  }

  if (
    mode !== 'update-available' &&
    mode !== 'applying-update'
  ) {
    return null
  }

  if (dismissed && mode === 'update-available') {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] px-4">
      <section
        aria-live="polite"
        className={cn(
          'pointer-events-auto mx-auto flex w-full max-w-2xl items-start gap-3 rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-lg shadow-slate-200/70 backdrop-blur'
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {mode === 'applying-update' ? '正在切换到新版本' : '发现新版本'}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {mode === 'applying-update'
              ? 'Service worker 已接管更新，页面会在新版本生效后自动刷新。'
              : '当前只更新最小静态壳与离线页，不缓存动态业务接口和鉴权态业务页面；点击后会刷新页面并切换到新版本。'}
          </p>
        </div>

        {mode === 'update-available' ? (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭更新提示"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleApplyUpdate}
            disabled={mode === 'applying-update'}
          >
            <RefreshCw
              className={cn('h-4 w-4', mode === 'applying-update' && 'animate-spin')}
            />
            {mode === 'applying-update' ? '正在更新...' : '立即更新'}
          </Button>
        </div>
      </section>
    </div>
  )
}
