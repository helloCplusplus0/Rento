'use client'

import { useEffect, useState } from 'react'

import { DesktopLayout } from './DesktopLayout'
import { MobileLayout } from './MobileLayout'

interface AppLayoutProps {
  children: React.ReactNode
}

/**
 * 应用主布局组件
 * 根据屏幕尺寸自动选择移动端或桌面端布局
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检测屏幕尺寸
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024) // lg 断点
    }

    // 初始检测
    checkScreenSize()
    setIsLoading(false)

    // 监听窗口大小变化
    window.addEventListener('resize', checkScreenSize)

    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  // 避免服务端渲染和客户端渲染不一致
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 根据屏幕尺寸选择布局
  return isMobile ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <DesktopLayout>{children}</DesktopLayout>
  )
}
