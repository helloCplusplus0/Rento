'use client'

import { UnifiedNavigation } from './UnifiedNavigation'

interface DesktopLayoutProps {
  children: React.ReactNode
}

/**
 * 桌面端布局组件
 * 特点：顶部导航栏，多列内容布局，支持键盘导航
 */
export function DesktopLayout({ children }: DesktopLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 统一导航栏 - 桌面端样式 */}
      <UnifiedNavigation variant="desktop" />

      {/* 主内容区域 */}
      <main className="pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
