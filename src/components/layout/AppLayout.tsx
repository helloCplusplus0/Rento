'use client'

import { useEffect } from 'react'

import { UnifiedNavigation } from './UnifiedNavigation'

interface AppLayoutProps {
  children: React.ReactNode
}

const KEYBOARD_OPEN_THRESHOLD = 120

/**
 * 应用主布局组件
 * 统一复用一套布局主线，通过 CSS 断点切换导航位置，避免客户端判屏闪烁。
 */
export function AppLayout({ children }: AppLayoutProps) {
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
        <div className="lg:mx-auto lg:max-w-7xl lg:px-8">{children}</div>
      </main>
    </div>
  )
}
