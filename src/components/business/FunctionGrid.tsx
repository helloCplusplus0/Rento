'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
 * 核心功能定义 - 4个主要业务功能 + 批量抄表 + 抄表历史 + 系统监控 + 性能测试功能
 */
const coreFeatures: FunctionItem[] = [
  {
    id: 'rooms',
    title: '房源管理',
    href: '/rooms',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
    description: '管理房间信息和状态'
  },
  {
    id: 'renters',
    title: '租客管理',
    href: '/renters',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    description: '管理租客信息和档案'
  },
  {
    id: 'contracts',
    title: '合同管理',
    href: '/contracts',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
    description: '处理租赁合同事务'
  },
  {
    id: 'bills',
    title: '账单管理',
    href: '/bills',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
    description: '管理收支和账单'
  },
  {
    id: 'batch-reading',
    title: '批量抄表',
    href: '/meter-readings/batch',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
    description: '批量录入仪表读数'
  },
  {
    id: 'meter-history',
    title: '抄表历史',
    href: '/meter-readings/history',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4-4h-2v10h2V7z"/>
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    description: '查看抄表历史记录'
  },
  {
    id: 'system-health',
    title: '系统监控',
    href: '/system-health',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
    description: '实时监控系统健康状态'
  },
  {
    id: 'performance-test',
    title: '性能测试',
    href: '/performance-test',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    description: '系统性能测试和验证'
  },
  {
    id: 'performance-benchmark',
    title: '性能基准',
    href: '/performance-benchmark',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
    description: '性能基准测试和评分'
  },
  {
    id: 'performance-analysis',
    title: '性能分析',
    href: '/performance-analysis',
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
      </svg>
    ),
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-rose-500 to-rose-600',
    description: '页面跳转性能分析'
  }
]

interface FunctionGridItemProps {
  feature: FunctionItem
}

/**
 * 功能网格单项组件
 * 支持导航、加载状态和交互反馈
 */
function FunctionGridItem({ feature }: FunctionGridItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // 使用 window.location.href 替代 router.push 避免预取冲突
      window.location.href = feature.href
    } catch (error) {
      console.error('Navigation error:', error)
      // 回退到 router.push
      await router.push(feature.href)
    } finally {
      // 延迟重置加载状态，避免闪烁
      setTimeout(() => setIsLoading(false), 100)
    }
  }

  return (
    <button 
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        feature.bgColor
      )}
      aria-label={`导航到${feature.title}页面`}
    >
      {isLoading ? (
        <div className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 animate-spin">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.364-7.364l-2.828 2.828M9.464 14.536l-2.828 2.828m12.728 0l-2.828-2.828M9.464 9.464L6.636 6.636"/>
          </svg>
        </div>
      ) : (
        <div className={cn('w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2', feature.color)}>
          {feature.icon}
        </div>
      )}
      <span className="text-xs sm:text-sm font-medium text-white">
        {feature.title}
      </span>
    </button>
  )
}

interface FunctionGridProps {
  className?: string
  showTitle?: boolean
}

/**
 * 功能模块网格组件
 * 展示4个核心业务功能的入口
 */
export function FunctionGrid({ className, showTitle = true }: FunctionGridProps) {
  return (
    <Card className={cn('', className)}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">快捷操作</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-10 gap-3 sm:gap-4">
          {coreFeatures.map(feature => (
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
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-10 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div 
              key={index}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-gray-200 animate-pulse"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 bg-gray-300 rounded" />
              <div className="h-3 w-12 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}