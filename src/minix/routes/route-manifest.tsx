import { auxiliaryPageGovernanceByPath } from '@/lib/page-governance'
import { navigationItems } from '@/lib/navigation-config'
import { getRouteConfig } from '@/lib/route-config'

type MinixRouteKind = 'primary' | 'state'
type MinixRouteShell = 'app' | 'standalone'
type GovernanceSource =
  | 'src/lib/route-config.ts'
  | 'src/lib/navigation-config.ts'
  | 'src/lib/page-governance.ts'
  | 'phase07-02-local'

export interface MinixRouteDefinition {
  path: string
  segment: string
  label: string
  title: string
  description: string
  iconKey: string
  kind: MinixRouteKind
  shell: MinixRouteShell
  showInMobileNav: boolean
  showInDesktopNav: boolean
  governanceSource: GovernanceSource[]
}

export const minixHomeRoute: MinixRouteDefinition = {
  path: '/',
  segment: '',
  label: '工作台',
  title: '工作台承接位',
  description:
    '当前页面复用既有工作台信息架构，作为 phase07-02 的统一前端宿主首页；后续迁移继续挂接在此壳层中，而不是回退到旧 Next.js 页面宿主。',
  iconKey: 'dashboard',
  kind: 'primary',
  shell: 'app',
  showInMobileNav: true,
  showInDesktopNav: true,
  governanceSource: ['src/lib/route-config.ts', 'src/lib/navigation-config.ts'],
}

export const minixPrimaryRoutes: MinixRouteDefinition[] = navigationItems
  .filter((item) => item.href !== '/')
  .map((item) => {
    const routeConfig = getRouteConfig(item.href)

    return {
      path: item.href,
      segment: item.href.replace(/^\//, ''),
      label: item.label,
      title: routeConfig?.title ?? `${item.label}承接位`,
      description:
        routeConfig?.description
          ? `${routeConfig.description}。当前页面仅承接统一布局、导航与后续迁移挂载位，不在 phase07-02 迁移完整查询、写操作或认证闭环。`
          : `当前页面仅承接 ${item.label} 模块壳层，后续继续复用既有信息架构迁移正式页面能力。`,
      iconKey: item.id,
      kind: 'primary',
      shell: 'app',
      showInMobileNav: Boolean(item.showInMobile),
      showInDesktopNav: item.id !== 'settings',
      governanceSource: ['src/lib/route-config.ts', 'src/lib/navigation-config.ts'],
    }
  })

export const minixStateRoutes: MinixRouteDefinition[] = [
  {
    path: '/login',
    segment: 'login',
    label: '登录',
    title: '登录页承接位',
    description:
      '当前仅承接最小登录壳与后续会话入口提示，完整认证链仍由后续阶段继续迁移。',
    iconKey: 'login',
    kind: 'state',
    shell: 'standalone',
    showInMobileNav: false,
    showInDesktopNav: false,
    governanceSource: ['phase07-02-local'],
  },
  {
    path: '/offline',
    segment: 'offline',
    label: '离线',
    title: '离线页承接位',
    description:
      '延续现有 PWA 离线兜底语义，只承接静态壳、图标与最小指引，不缓存动态业务接口。',
    iconKey: 'offline',
    kind: 'state',
    shell: 'standalone',
    showInMobileNav: false,
    showInDesktopNav: false,
    governanceSource: ['phase07-02-local'],
  },
  {
    path: '/loading',
    segment: 'loading',
    label: '加载中',
    title: '加载态承接位',
    description:
      '用于承接 React Router 宿主的最小加载反馈，与旧宿主的全局 loading 骨架保持同类语义。',
    iconKey: 'loading',
    kind: 'state',
    shell: 'standalone',
    showInMobileNav: false,
    showInDesktopNav: false,
    governanceSource: ['phase07-02-local'],
  },
  {
    path: '/error',
    segment: 'error',
    label: '错误',
    title: '错误页承接位',
    description:
      '承接新宿主中的基础错误展示和恢复动作，后续可继续挂接运行时与 API 错误边界。',
    iconKey: 'error',
    kind: 'state',
    shell: 'standalone',
    showInMobileNav: false,
    showInDesktopNav: false,
    governanceSource: ['phase07-02-local'],
  },
  {
    path: '/404',
    segment: '404',
    label: '未找到',
    title: '404 页承接位',
    description:
      '用于承接未知路径和错误跳转场景，继续沿用当前产品的最小回退导航信息结构。',
    iconKey: 'not-found',
    kind: 'state',
    shell: 'standalone',
    showInMobileNav: false,
    showInDesktopNav: false,
    governanceSource: ['phase07-02-local'],
  },
]

export const minixOpsGovernanceRoutes = ['/system-health', '/data-consistency'].map((path) => {
  const governanceEntry = auxiliaryPageGovernanceByPath[path]

  return {
    path,
    label: governanceEntry.title,
    category: governanceEntry.category,
    rationale: governanceEntry.rationale,
    governanceSource: 'src/lib/page-governance.ts' as const,
  }
})

export function getMinixPrimaryRoute(path: string) {
  if (path === '/') {
    return minixHomeRoute
  }

  return minixPrimaryRoutes.find((route) => route.path === path)
}

export function getMinixStateRoute(path: string) {
  return minixStateRoutes.find((route) => route.path === path)
}
