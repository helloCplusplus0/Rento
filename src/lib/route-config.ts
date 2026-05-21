/**
 * 路由配置管理
 * 提供页面标题和导航辅助元数据。
 *
 * 注意：
 * - 实际页面鉴权以 `src/middleware.ts` 为准。
 * - 辅助页面分类与最小门禁策略以 `src/lib/page-governance.ts` 为准。
 */

/**
 * 路由配置接口
 */
export interface RouteConfig {
  path: string // 路由路径
  requireAuth?: boolean // 是否需要身份验证
  roles?: string[] // 允许访问的角色列表
  redirect?: string // 重定向路径
  title?: string // 页面标题
  description?: string // 页面描述
  icon?: string // 页面图标
}

/**
 * 应用路由配置
 * 当前仅维护路由展示元数据，不再把这里视为鉴权真相源。
 */
export const routeConfigs: RouteConfig[] = [
  // 主要页面
  {
    path: '/',
    requireAuth: true,
    title: '工作台',
    description: '仪表板和数据概览',
    icon: 'home',
  },
  {
    path: '/rooms',
    requireAuth: true,
    title: '房源管理',
    description: '管理房间信息和状态',
    icon: 'building',
  },
  {
    path: '/contracts',
    requireAuth: true,
    title: '合同管理',
    description: '管理租赁合同',
    icon: 'document',
  },
  {
    path: '/bills',
    requireAuth: true,
    title: '账单管理',
    description: '管理收支账单',
    icon: 'receipt',
  },
  {
    path: '/add',
    requireAuth: true,
    title: '添加功能',
    description: '快速添加各类信息',
    icon: 'plus',
  },
  {
    path: '/settings',
    requireAuth: true,
    title: '系统设置',
    description: '配置系统参数',
    icon: 'settings',
  },

  // 辅助页面元数据，分类与门禁真相源见 `page-governance.ts`
  {
    path: '/components',
    requireAuth: true,
    title: '组件展示',
    description: '开发组件展示页面',
    icon: 'code',
  },
  {
    path: '/layout-demo',
    requireAuth: true,
    title: '布局演示',
    description: '响应式布局演示',
    icon: 'layout',
  },

  // 预留：管理员页面 (后期实现)
  // {
  //   path: '/admin',
  //   requireAuth: true,
  //   roles: ['admin'],
  //   title: '系统管理',
  //   description: '系统管理功能',
  //   icon: 'shield'
  // },

  // 预留：用户管理页面 (后期实现)
  // {
  //   path: '/users',
  //   requireAuth: true,
  //   roles: ['admin', 'manager'],
  //   title: '用户管理',
  //   description: '管理系统用户',
  //   icon: 'users'
  // },
]

/**
 * 根据路径获取路由配置
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
  return routeConfigs.find((config) => config.path === path)
}

/**
 * 检查路径是否需要身份验证
 */
export function requiresAuth(path: string): boolean {
  const config = getRouteConfig(path)
  return config?.requireAuth ?? false
}

/**
 * 检查用户角色是否有访问权限
 */
export function hasPermission(userRoles: string[], path: string): boolean {
  const config = getRouteConfig(path)

  // 如果没有配置或不需要特定角色，允许访问
  if (!config?.roles || config.roles.length === 0) {
    return true
  }

  // 检查用户角色是否在允许列表中
  return config.roles.some((role) => userRoles.includes(role))
}

/**
 * 获取所有公开路由
 */
export function getPublicRoutes(): RouteConfig[] {
  return routeConfigs.filter((config) => !config.requireAuth)
}

/**
 * 获取所有受保护路由
 */
export function getProtectedRoutes(): RouteConfig[] {
  return routeConfigs.filter((config) => config.requireAuth)
}

/**
 * 导航项配置 (与底部导航栏保持一致)
 */
export const navigationRoutes = [
  '/',
  '/rooms',
  '/add',
  '/contracts',
  '/settings',
]

/**
 * 检查路径是否为主导航路由
 */
export function isNavigationRoute(path: string): boolean {
  return navigationRoutes.includes(path)
}
