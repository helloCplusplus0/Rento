/**
 * phase04-04 的辅助页面分类矩阵、最小门禁策略与访问决策单一真相源。
 * Task1 冻结分类边界，Task2/3 逐步把导航收口与运行时门禁接到这里。
 */

export const pageCategoryPolicies = {
  'business-entry': {
    category: 'business-entry',
    label: '正式业务入口',
    requireAuth: true,
    developmentOnly: false,
    allowDirectRoute: true,
    description: '正式业务主链页面，允许在受保护环境中通过直达路由访问。',
  },
  'ops-governance': {
    category: 'ops-governance',
    label: '运维治理',
    requireAuth: true,
    developmentOnly: false,
    allowDirectRoute: true,
    description:
      '治理与排障入口，保留直达路由，但不得与正式业务导航按同等语义暴露。',
  },
  'dev-only': {
    category: 'dev-only',
    label: 'dev-only',
    requireAuth: true,
    developmentOnly: true,
    allowDirectRoute: true,
    description:
      '开发或验证辅助页，仅在开发环境保留直达访问价值，非开发环境应拒绝或重定向。',
  },
} as const

export type PageCategory = keyof typeof pageCategoryPolicies

export type ExposureSurface =
  | 'direct-route'
  | 'dashboard-function-grid'
  | 'dashboard-quick-action'
  | 'settings-tool'
  | 'error-recovery-action'
  | 'cross-page-link'

export interface AuxiliaryPageGovernanceEntry {
  path: string
  title: string
  category: PageCategory
  purpose: string
  currentExposure: ExposureSurface[]
  rationale: string
}

export const auxiliaryPageGovernance: AuxiliaryPageGovernanceEntry[] = [
  {
    path: '/performance-test',
    title: '性能测试',
    category: 'dev-only',
    purpose: '验证前端性能优化、懒加载、缓存与接口响应表现。',
    currentExposure: ['direct-route', 'cross-page-link'],
    rationale: '页面依赖测试数据与浏览器性能 API，不属于租务主链或运维日常入口。',
  },
  {
    path: '/performance-benchmark',
    title: '性能基准',
    category: 'dev-only',
    purpose: '执行页面、脚本、网络与资源加载的基准测试。',
    currentExposure: ['direct-route'],
    rationale: '用于开发阶段比较性能变化，不应被误读为生产业务能力。',
  },
  {
    path: '/performance-analysis',
    title: '性能分析',
    category: 'dev-only',
    purpose: '分析页面跳转链路、资源加载与性能瓶颈。',
    currentExposure: ['direct-route', 'cross-page-link'],
    rationale: '页面专门服务调试与诊断，且内含对其他辅助页的测试跳转入口。',
  },
  {
    path: '/layout-demo',
    title: '布局演示',
    category: 'dev-only',
    purpose: '演示和回归验证响应式布局系统。',
    currentExposure: ['direct-route'],
    rationale: '属于 UI 验证资产，不承载正式租务操作。',
  },
  {
    path: '/components',
    title: '组件展示',
    category: 'dev-only',
    purpose: '集中展示 UI 与业务组件样式，供开发联调和回归检查使用。',
    currentExposure: ['direct-route', 'cross-page-link'],
    rationale: '页面使用大量模拟数据与演示组件，不适合作为正式产品入口。',
  },
  {
    path: '/business-flow-validation',
    title: '核心业务流程验证',
    category: 'dev-only',
    purpose: '触发端到端式业务流程验证，检查合同、账单、抄表等关键链路完整性。',
    currentExposure: ['direct-route'],
    rationale:
      '页面会主动触发验证流程，适合作为开发/验收辅助台，不适合长期暴露给正式日常操作入口。',
  },
  {
    path: '/system-health',
    title: '系统监控',
    category: 'ops-governance',
    purpose: '查看系统健康状态、依赖检查结果与运行概况。',
    currentExposure: ['direct-route', 'settings-tool', 'cross-page-link'],
    rationale: '该页用于运行治理与故障定位，可保留，但应从正式业务主入口语义中剥离。',
  },
  {
    path: '/data-consistency',
    title: '数据一致性管理',
    category: 'ops-governance',
    purpose: '执行数据一致性检查与修复，支撑排障和治理收口。',
    currentExposure: ['direct-route', 'settings-tool', 'error-recovery-action'],
    rationale: '该页属于治理工具链，允许保留直达路由，但不应被普通业务导航等价暴露。',
  },
] as const

export const auxiliaryPageGovernanceByPath = Object.fromEntries(
  auxiliaryPageGovernance.map((entry) => [entry.path, entry])
) as Record<string, AuxiliaryPageGovernanceEntry>

export function getAuxiliaryPageGovernance(path: string) {
  return auxiliaryPageGovernanceByPath[path]
}

export function isAuxiliaryPagePath(path: string) {
  return path in auxiliaryPageGovernanceByPath
}

export function getPageCategoryPolicy(category: PageCategory) {
  return pageCategoryPolicies[category]
}

export function isDevelopmentEnvironment() {
  return process.env.NODE_ENV === 'development'
}

export interface AuxiliaryPageAccessDecision {
  matched: boolean
  allowed: boolean
  redirectPath?: string
  entry?: AuxiliaryPageGovernanceEntry
}

export function getAuxiliaryPageAccessDecision(
  path: string,
  runtimeEnvironment: string = process.env.NODE_ENV ?? 'development'
): AuxiliaryPageAccessDecision {
  const entry = getAuxiliaryPageGovernance(path)

  if (!entry) {
    return { matched: false, allowed: true }
  }

  const categoryPolicy = getPageCategoryPolicy(entry.category)

  if (!categoryPolicy.developmentOnly) {
    return {
      matched: true,
      allowed: true,
      entry,
    }
  }

  if (runtimeEnvironment === 'development') {
    return {
      matched: true,
      allowed: true,
      entry,
    }
  }

  return {
    matched: true,
    allowed: false,
    redirectPath: '/',
    entry,
  }
}
