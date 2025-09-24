'use client'

import { BillCard, BillCardSkeleton } from '@/components/business/bill-card'
import type { BillWithContract } from '@/types/database'

interface BillGridProps {
  bills: BillWithContract[]
  onBillClick?: (bill: BillWithContract) => void
  loading?: boolean
  className?: string
}

/**
 * 账单网格布局组件
 * 响应式网格显示账单卡片，支持加载状态和空状态
 */
export function BillGrid({ bills, onBillClick, loading, className }: BillGridProps) {
  if (loading) {
    return <BillGridSkeleton className={className} />
  }

  if (bills.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无账单</h3>
        <p className="text-gray-600">还没有创建任何账单，点击添加按钮开始创建</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {bills.map((bill) => (
        <BillCard
          key={bill.id}
          bill={bill}
          onClick={() => onBillClick?.(bill)}
        />
      ))}
    </div>
  )
}

/**
 * 账单网格骨架屏组件
 * 用于加载状态的占位显示
 */
export function BillGridSkeleton({ className }: { className?: string }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <BillCardSkeleton key={i} />
      ))}
    </div>
  )
}