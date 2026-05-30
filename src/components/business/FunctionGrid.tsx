'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { dashboardMobileStyles } from '@/components/business/dashboard-mobile-styles'
import { getAuxiliaryPageGovernance } from '@/lib/page-governance'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FunctionItem {
  id: string
  title: string
  href: string
  icon: React.ReactNode
  color: string
  bgColor: string
  description?: string
}

/**
 * 工作台快捷入口。
 * 这里仅保留正式业务主链和日常操作入口，辅助页面是否暴露由 page-governance 矩阵决定。
 */
const coreFeatures: FunctionItem[] = [
  {
    id: 'rooms',
    title: '房源管理',
    href: '/rooms',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
    description: '管理房间信息和状态',
  },
  {
    id: 'renters',
    title: '租客管理',
    href: '/renters',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    description: '管理租客信息和档案',
  },
  {
    id: 'contracts',
    title: '合同管理',
    href: '/contracts',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
    description: '处理租赁合同事务',
  },
  {
    id: 'bills',
    title: '账单管理',
    href: '/bills',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
    description: '管理收支和账单',
  },
  {
    id: 'settings',
    title: '设置',
    href: '/settings',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.14 12.94a7.49 7.49 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.4 7.4 0 00-1.63-.95l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.95l-2.39-.96a.5.5 0 00-.6.22L2.71 8.84a.5.5 0 00.12.64l2.03 1.58a7.49 7.49 0 000 1.88L2.83 14.52a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.5.4 1.05.72 1.63.95l.36 2.54a.5.5 0 00.5.42h3.84a.5.5 0 00.5-.42l.36-2.54c.58-.23 1.12-.55 1.63-.95l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-slate-500 to-slate-600',
    description: '系统设置和配置',
  },
  {
    id: 'batch-reading',
    title: '批量抄表',
    href: '/meter-readings/batch',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
    description: '批量录入仪表读数',
  },
  {
    id: 'meter-history',
    title: '抄表历史',
    href: '/meter-readings/history',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4-4h-2v10h2V7z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    description: '查看抄表历史记录',
  },
  {
    id: 'system-health',
    title: '系统监控',
    href: '/system-health',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
    description: '实时监控系统健康状态',
  },
  {
    id: 'performance-test',
    title: '性能测试',
    href: '/performance-test',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    description: '系统性能测试和验证',
  },
  {
    id: 'performance-benchmark',
    title: '性能基准',
    href: '/performance-benchmark',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
    description: '性能基准测试和评分',
  },
  {
    id: 'performance-analysis',
    title: '性能分析',
    href: '/performance-analysis',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-rose-500 to-rose-600',
    description: '页面跳转性能分析',
  },
]

const dashboardFeatures = coreFeatures.filter((feature) => {
  const governanceEntry = getAuxiliaryPageGovernance(feature.href)

  // 不在治理矩阵中的页面默认视为正式业务入口。
  if (!governanceEntry) {
    return true
  }

  // 运维治理与 dev-only 页面保留直达路由，但退出正式工作台默认入口。
  return governanceEntry.category === 'business-entry'
})

interface FunctionGridItemProps {
  feature: FunctionItem
}

/**
 * 功能网格单项组件
 * 支持导航、加载状态和交互反馈
 */
function FunctionGridItem({ feature }: FunctionGridItemProps) {
  return (
    <Link
      href={feature.href}
      className={cn(dashboardMobileStyles.shortcutButton)}
      aria-label={`导航到${feature.title}页面`}
    >
      <div className="flex w-full flex-col items-center">
        <div
          className={cn(
            dashboardMobileStyles.shortcutIconBox,
            feature.bgColor,
            feature.color
          )}
        >
          <div className="h-4 w-4 sm:h-5 sm:w-5">{feature.icon}</div>
        </div>
        <div className="min-w-0">
          <div className={dashboardMobileStyles.shortcutTitleText}>
            {feature.title}
          </div>
          {feature.description && (
            <div className={dashboardMobileStyles.shortcutDescription}>
              {feature.description}
            </div>
          )}
        </div>
        <ArrowRight className={dashboardMobileStyles.shortcutArrow} />
      </div>
    </Link>
  )
}

interface FunctionGridProps {
  className?: string
  showTitle?: boolean
}

/**
 * 功能模块网格组件
 * 展示正式业务主链和日常操作入口
 */
export function FunctionGrid({
  className,
  showTitle = true,
}: FunctionGridProps) {
  return (
    <Card className={cn(dashboardMobileStyles.shortcutCard, className)}>
      {showTitle && (
        <CardHeader className={dashboardMobileStyles.shortcutHeader}>
          <CardTitle className={dashboardMobileStyles.shortcutTitle}>
            快捷操作
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={dashboardMobileStyles.shortcutContent}>
        <div className={dashboardMobileStyles.shortcutGrid}>
          {dashboardFeatures.map((feature) => (
            <FunctionGridItem key={feature.id} feature={feature} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 功能网格骨架屏组件
 */
export function FunctionGridSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn(dashboardMobileStyles.shortcutCard, className)}>
      <CardHeader className={dashboardMobileStyles.shortcutHeader}>
        <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
      </CardHeader>
      <CardContent className={dashboardMobileStyles.shortcutContent}>
        <div className={dashboardMobileStyles.shortcutGrid}>
          {Array.from({ length: dashboardFeatures.length }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-start gap-2.5 rounded-lg border border-gray-100 bg-white p-3"
            >
              <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-200" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
