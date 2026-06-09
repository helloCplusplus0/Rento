'use client'

import { usePathname } from 'next/navigation'

import { PwaInstallPrompt as SharedPwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt'

const ENABLED_VALUES = new Set(['true'])

function isLegacyPwaEnabled() {
  const rawValue = process.env.NEXT_PUBLIC_ENABLE_PWA?.trim().toLowerCase()

  if (process.env.NODE_ENV !== 'production' || !rawValue) {
    return false
  }

  return ENABLED_VALUES.has(rawValue)
}

export function PwaInstallPrompt() {
  const pathname = usePathname()

  return (
    <SharedPwaInstallPrompt
      enabled={isLegacyPwaEnabled()}
      pathname={pathname}
    />
  )
}
