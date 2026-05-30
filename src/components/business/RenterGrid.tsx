'use client'

import { renterListMobileStyles } from '@/components/business/renter-list-mobile-styles'
import { Skeleton } from '@/components/ui/skeleton'

import { RenterCard } from './RenterCard'

interface RenterGridProps {
  renters: any[]
  onRenterClick?: (renter: any) => void
  loading?: boolean
}

export function RenterGrid({
  renters,
  onRenterClick,
  loading = false,
}: RenterGridProps) {
  if (loading) {
    return (
      <div className={renterListMobileStyles.listGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
          >
            <div className="mb-3 flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-5/6" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (renters.length === 0) {
    return (
      <div className={renterListMobileStyles.emptyState}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
        <h3 className={renterListMobileStyles.emptyTitle}>暂无租客</h3>
        <p className={renterListMobileStyles.emptyText}>还没有添加任何租客信息</p>
      </div>
    )
  }

  return (
    <div className={renterListMobileStyles.listGrid}>
      {renters.map((renter) => (
        <RenterCard key={renter.id} renter={renter} onClick={onRenterClick} />
      ))}
    </div>
  )
}
