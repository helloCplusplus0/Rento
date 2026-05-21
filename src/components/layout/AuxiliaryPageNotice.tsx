'use client'

import { getAuxiliaryPageGovernance, getPageCategoryPolicy } from '@/lib/page-governance'
import { cn } from '@/lib/utils'

interface AuxiliaryPageNoticeProps {
  path: string
  className?: string
}

const categoryToneMap = {
  'dev-only': {
    badge: 'dev-only',
    containerClass: 'border-amber-200 bg-amber-50',
    badgeClass: 'bg-amber-100 text-amber-800',
    textClass: 'text-amber-900',
    hint: '仅开发环境保留直达访问，正式入口不会默认暴露该页面。',
  },
  'ops-governance': {
    badge: '运维治理',
    containerClass: 'border-sky-200 bg-sky-50',
    badgeClass: 'bg-sky-100 text-sky-800',
    textClass: 'text-sky-900',
    hint: '保留直达路由用于排障和治理，但不与正式业务入口等价暴露。',
  },
  'business-entry': {
    badge: '正式业务入口',
    containerClass: 'border-emerald-200 bg-emerald-50',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    textClass: 'text-emerald-900',
    hint: '该页面属于正式业务主链入口。',
  },
} as const

export function AuxiliaryPageNotice({
  path,
  className,
}: AuxiliaryPageNoticeProps) {
  const governanceEntry = getAuxiliaryPageGovernance(path)

  if (!governanceEntry) {
    return null
  }

  const policy = getPageCategoryPolicy(governanceEntry.category)
  const tone = categoryToneMap[governanceEntry.category]

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 text-sm shadow-sm',
        tone.containerClass,
        className
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full px-2 py-1 text-xs font-medium',
            tone.badgeClass
          )}
        >
          {tone.badge}
        </span>
        <span className={cn('font-medium', tone.textClass)}>
          {governanceEntry.title}
        </span>
      </div>
      <p className={cn('mb-1', tone.textClass)}>{governanceEntry.purpose}</p>
      <p className="text-gray-700">{tone.hint}</p>
      <p className="mt-1 text-gray-600">
        保留原因：{governanceEntry.rationale}
      </p>
      <p className="mt-1 text-gray-600">门禁策略：{policy.description}</p>
    </div>
  )
}
