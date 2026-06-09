'use client'

import { PwaRuntimeManager as SharedPwaRuntimeManager } from '@/components/pwa/PwaRuntimeManager'

const ENABLED_VALUES = new Set(['true'])

function isServiceWorkerEnabledByEnv() {
  const rawValue = process.env.NEXT_PUBLIC_ENABLE_PWA?.trim().toLowerCase()
  if (process.env.NODE_ENV !== 'production' || !rawValue) {
    return false
  }

  return ENABLED_VALUES.has(rawValue)
}

export function PwaRuntimeManager() {
  return <SharedPwaRuntimeManager enabled={isServiceWorkerEnabledByEnv()} />
}
