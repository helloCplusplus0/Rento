/**
 * 统一导航配置
 * 确保移动端和桌面端使用相同的导航逻辑和功能
 */

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: number
  description?: string
  showInMobile?: boolean // 新增：是否在移动端导航栏显示
}

/**
 * 统一的导航项配置
 * 移动端和桌面端使用相同的导航逻辑
 */
export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: '工作台',
    href: '/',
    description: '查看系统概览和统计数据',
    showInMobile: true,
  },
  {
    id: 'rooms',
    label: '房源',
    href: '/rooms',
    description: '管理房间信息和状态',
    showInMobile: true,
  },
  {
    id: 'add',
    label: '添加',
    href: '/add',
    description: '快速添加各类信息',
    showInMobile: true,
  },
  {
    id: 'contracts',
    label: '合同',
    href: '/contracts',
    description: '管理租赁合同',
    showInMobile: true,
  },
  {
    id: 'bills',
    label: '账单',
    href: '/bills',
    description: '管理收支账单',
    showInMobile: false, // 不在移动端导航栏显示，因为工作台已有入口
  },
  {
    id: 'settings',
    label: '设置',
    href: '/settings',
    description: '系统设置和配置',
    showInMobile: true, // 在移动端导航栏显示
  },
]

/**
 * 获取移动端导航项
 * 返回需要在移动端底部导航栏显示的导航项
 */
export function getMobileNavigationItems(): NavigationItem[] {
  return navigationItems.filter((item) => item.showInMobile)
}

/**
 * 获取桌面端导航项
 * 返回需要在桌面端顶部导航栏显示的导航项（排除设置项，设置项通过用户菜单访问）
 */
export function getDesktopNavigationItems(): NavigationItem[] {
  return navigationItems.filter((item) => item.id !== 'settings')
}

/**
 * 获取导航项
 * @param includeAll 是否包含所有导航项，false时排除设置项（用于主导航）
 * @deprecated 使用 getMobileNavigationItems 或 getDesktopNavigationItems 替代
 */
export function getNavigationItems(
  includeAll: boolean = true
): NavigationItem[] {
  if (includeAll) {
    return navigationItems
  }
  // 主导航排除设置项，设置项通过用户菜单访问
  return navigationItems.filter((item) => item.id !== 'settings')
}

/**
 * 检查路径是否激活
 */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname.startsWith(href)
}
