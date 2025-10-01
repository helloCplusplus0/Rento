'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  getDesktopNavigationItems,
  getMobileNavigationItems,
  isActiveRoute,
} from '@/lib/navigation-config'
import { cn } from '@/lib/utils'
import { UserProfileSheet } from '@/components/business/UserProfileSheet'

interface UnifiedNavigationProps {
  variant: 'mobile' | 'desktop'
}

// 图标组件
const HomeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
)

const BuildingIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
)

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
)

const ReceiptIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
    />
  </svg>
)

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
)

// 图标映射
const iconMap = {
  dashboard: HomeIcon,
  rooms: BuildingIcon,
  add: PlusIcon,
  contracts: DocumentIcon,
  bills: ReceiptIcon,
  settings: SettingsIcon,
}

/**
 * 统一导航组件
 * 根据variant参数显示不同的样式，但功能完全一致
 */
export function UnifiedNavigation({ variant }: UnifiedNavigationProps) {
  const pathname = usePathname()
  const [showUserSheet, setShowUserSheet] = useState(false)

  if (variant === 'mobile') {
    // 移动端使用专门的移动端导航项（工作台、房源、添加、合同、设置）
    const mobileItems = getMobileNavigationItems()

    return (
      <>
        <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white">
          <div className="flex h-16 items-center justify-around px-2">
            {mobileItems.map((item) => {
              const isActive = isActiveRoute(pathname, item.href)
              const IconComponent = iconMap[item.id as keyof typeof iconMap]

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-lg px-2 py-1 transition-colors',
                    'hover:bg-gray-100 active:bg-gray-200',
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <div className="relative">
                    {IconComponent && <IconComponent className="h-6 w-6" />}
                    {/* 徽章显示 */}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-1 text-xs font-medium',
                      isActive ? 'text-blue-600' : 'text-gray-600'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* 安全区域适配 */}
          <div className="h-[env(safe-area-inset-bottom)] bg-white"></div>
        </nav>

        {/* 用户资料抽屉 */}
        <UserProfileSheet
          open={showUserSheet}
          onOpenChange={setShowUserSheet}
        />
      </>
    )
  }

  // 桌面端使用专门的桌面端导航项（排除设置项，设置项通过用户菜单访问）
  const desktopItems = getDesktopNavigationItems()

  return (
    <>
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo 区域 */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <span className="text-sm font-bold text-white">R</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Rento</span>
              </Link>
            </div>

            {/* 主导航菜单 */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {desktopItems.map((item) => {
                  const isActive = isActiveRoute(pathname, item.href)

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      {item.label}
                      {/* 徽章显示 */}
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* 用户菜单区域 */}
            <div className="flex items-center space-x-4">
              {/* 搜索按钮 */}
              <button className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              {/* 通知按钮 */}
              <button className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v4"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 text-xs text-white"></span>
              </button>

              {/* 设置按钮 */}
              <Link
                href="/settings"
                className={cn(
                  'rounded-md p-2 transition-colors',
                  isActiveRoute(pathname, '/settings')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <SettingsIcon className="h-5 w-5" />
              </Link>

              {/* 用户头像 */}
              <button
                onClick={() => setShowUserSheet(true)}
                className="flex items-center space-x-2 rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-sm font-medium text-gray-700">U</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 用户资料抽屉 */}
      <UserProfileSheet open={showUserSheet} onOpenChange={setShowUserSheet} />
    </>
  )
}
