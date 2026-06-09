'use client'

import { Outlet, useLocation } from 'react-router-dom'

import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt'
import { PwaRuntimeManager } from '@/components/pwa/PwaRuntimeManager'

const ENABLED_VALUES = new Set(['true'])

function isMinixPwaEnabled() {
  // Vite 在构建期内联该变量；切换 PWA profile 需要重新构建 dist。
  const rawValue = import.meta.env.VITE_ENABLE_PWA?.trim().toLowerCase()
  return import.meta.env.PROD && Boolean(rawValue) && ENABLED_VALUES.has(rawValue)
}

export function MinixRuntimeLayout() {
  const location = useLocation()
  const pwaEnabled = isMinixPwaEnabled()

  return (
    <>
      <Outlet />
      <PwaRuntimeManager enabled={pwaEnabled} />
        <PwaInstallPrompt enabled={pwaEnabled} pathname={location.pathname} />
    </>
  )
}
