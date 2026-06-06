import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { getWorkbenchSearchHref } from '@/lib/workbench-search'
import { cn } from '@/lib/utils'

import {
  MinixNotificationEntryButton,
  MinixUserProfileSheet,
} from '../components/homepage/MinixDashboardAdapters'
import { minixHomeRoute, minixPrimaryRoutes } from '../routes/route-manifest'

interface UnifiedNavigationProps {
  variant: 'mobile' | 'desktop'
}

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
)

const BuildingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
)

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
)

const ReceiptIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
    />
  </svg>
)

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const iconMap = {
  dashboard: HomeIcon,
  rooms: BuildingIcon,
  add: PlusIcon,
  contracts: DocumentIcon,
  bills: ReceiptIcon,
  settings: SettingsIcon,
} as const

function isActiveRoute(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }

  return pathname.startsWith(href)
}

function MobileNavItem({
  label,
  href,
  iconKey,
  isActive,
}: {
  label: string
  href: string
  iconKey: keyof typeof iconMap
  isActive: boolean
}) {
  const IconComponent = iconMap[iconKey]

  return (
    <Link
      to={href}
      className={cn(
        'flex h-[var(--nav-height-mobile)] min-h-[44px] min-w-[52px] flex-1 flex-col items-center justify-center rounded-lg px-2 py-1 transition-colors',
        'hover:bg-gray-100 active:bg-gray-200',
        isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
      )}
    >
      <IconComponent className="h-6 w-6" />
      <span
        className={cn(
          'mt-1 line-clamp-1 text-xs font-medium',
          isActive ? 'text-blue-600' : 'text-gray-600'
        )}
      >
        {label}
      </span>
    </Link>
  )
}

/**
 * phase07-02 仅承接导航壳和路由状态，不迁移旧宿主中的完整通知、用户面板与鉴权逻辑。
 */
export function UnifiedNavigation({ variant }: UnifiedNavigationProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [desktopSearchQuery, setDesktopSearchQuery] = useState('')
  const [showUserSheet, setShowUserSheet] = useState(false)

  const mobileItems = useMemo(
    () => [minixHomeRoute, ...minixPrimaryRoutes.filter((route) => route.showInMobileNav)],
    []
  )
  const desktopItems = useMemo(
    () => [minixHomeRoute, ...minixPrimaryRoutes.filter((route) => route.showInDesktopNav)],
    []
  )

  const handleDesktopSearch = () => {
    const targetHref = getWorkbenchSearchHref(desktopSearchQuery)

    if (targetHref) {
      navigate(targetHref)
    }
  }

  const handleDesktopSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      handleDesktopSearch()
    }
  }

  if (variant === 'mobile') {
    return (
      <nav
        aria-label="移动端底部导航"
        className="mobile-bottom-nav fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90"
      >
        <div className="flex h-[var(--mobile-nav-total-height)] items-start justify-around px-2 pb-[var(--safe-area-inset-bottom)]">
          {mobileItems.map((item) => (
            <MobileNavItem
              key={item.path}
              href={item.path}
              iconKey={item.iconKey as keyof typeof iconMap}
              isActive={isActiveRoute(location.pathname, item.path)}
              label={item.label}
            />
          ))}
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <span className="text-sm font-bold text-white">R</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-xl font-bold text-gray-900">Rento</span>
                  <span className="text-[11px] text-gray-500">miniX</span>
                </div>
              </Link>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {desktopItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActiveRoute(location.pathname, item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden w-72 items-center md:flex">
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={desktopSearchQuery}
                    onChange={(event) => setDesktopSearchQuery(event.target.value)}
                    onKeyDown={handleDesktopSearchKeyDown}
                    placeholder="搜索房源、房间号、合同"
                    className="h-10 border-gray-200 bg-gray-50 pl-10 pr-10 text-sm focus:border-blue-300 focus:bg-white"
                    aria-label="搜索房源、房间号、合同"
                  />
                  <button
                    type="button"
                    onClick={handleDesktopSearch}
                    className="absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
                    disabled={!desktopSearchQuery.trim()}
                    aria-label="执行搜索"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <MinixNotificationEntryButton />

              <Link
                to="/settings"
                className={cn(
                  'rounded-md p-2 transition-colors',
                  isActiveRoute(location.pathname, '/settings')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
                aria-label="系统设置"
              >
                <SettingsIcon className="h-5 w-5" />
              </Link>

              <button
                type="button"
                onClick={() => setShowUserSheet(true)}
                className="flex items-center space-x-2 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="打开个人中心"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-sm font-medium text-gray-700">U</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MinixUserProfileSheet
        open={showUserSheet}
        onOpenChange={setShowUserSheet}
      />
    </>
  )
}
