'use client'

import { BottomNavigation } from './BottomNavigation'

interface MobileLayoutProps {
  children: React.ReactNode
}

/**
 * 移动端布局组件
 * 特点：全屏布局，底部导航栏固定，主内容区域可滚动
 */
export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      
      {/* 底部导航栏 */}
      <BottomNavigation />
    </div>
  )
}