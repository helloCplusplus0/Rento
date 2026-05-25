'use client'

import { UnifiedNavigation } from './UnifiedNavigation'

interface MobileLayoutProps {
  children: React.ReactNode
}

/**
 * 移动端布局组件
 * 特点：全屏布局，底部导航栏固定，主内容区域可滚动。
 * 该组件保留为兼容入口，布局约束需与 AppLayout 的移动端主线保持一致。
 */
export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="flex min-h-app flex-col bg-gray-50 lg:hidden">
      {/* 主内容区域 */}
      <main className="mobile-scroll-area flex-1 pb-[var(--mobile-bottom-offset)]">
        {children}
      </main>

      {/* 统一导航栏 - 移动端样式 */}
      <UnifiedNavigation variant="mobile" />
    </div>
  )
}
