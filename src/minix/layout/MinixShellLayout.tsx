import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { UnifiedNavigation } from './UnifiedNavigation'

const KEYBOARD_OPEN_THRESHOLD = 120

export function MinixShellLayout() {
  useEffect(() => {
    const root = document.documentElement

    const syncViewportInsets = () => {
      const viewport = window.visualViewport

      if (!viewport) {
        root.style.setProperty('--keyboard-inset-height', '0px')
        root.dataset.virtualKeyboard = 'closed'
        return
      }

      const keyboardInset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      )

      root.style.setProperty('--keyboard-inset-height', `${keyboardInset}px`)
      root.dataset.virtualKeyboard =
        keyboardInset > KEYBOARD_OPEN_THRESHOLD ? 'open' : 'closed'
    }

    syncViewportInsets()

    window.visualViewport?.addEventListener('resize', syncViewportInsets)
    window.visualViewport?.addEventListener('scroll', syncViewportInsets)
    window.addEventListener('resize', syncViewportInsets)

    return () => {
      window.visualViewport?.removeEventListener('resize', syncViewportInsets)
      window.visualViewport?.removeEventListener('scroll', syncViewportInsets)
      window.removeEventListener('resize', syncViewportInsets)
      root.style.setProperty('--keyboard-inset-height', '0px')
      root.dataset.virtualKeyboard = 'closed'
    }
  }, [])

  return (
    <div className="min-h-app bg-gray-50">
      <div className="hidden lg:block">
        <UnifiedNavigation variant="desktop" />
      </div>

      <div className="lg:hidden">
        <UnifiedNavigation variant="mobile" />
      </div>

      <main className="min-h-app pt-0 pb-[var(--mobile-bottom-offset)] lg:pt-16 lg:pb-0">
        <div className="lg:mx-auto lg:max-w-7xl lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
