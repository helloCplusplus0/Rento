'use client'

import { Skeleton } from '@/components/ui/skeleton'

import { RenterCard } from './RenterCard'

interface RenterGridProps {
  renters: any[]
  onRenterClick?: (renter: any) => void
  onRenterEdit?: (renter: any) => void
  onRenterDelete?: (renter: any) => void
  loading?: boolean
}

export function RenterGrid({
  renters,
  onRenterClick,
  onRenterEdit,
  onRenterDelete,
  loading = false,
}: RenterGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-lg border p-4">
            <div className="mb-3 flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="mb-3 h-12 w-full" />
            <Skeleton className="mb-3 h-3 w-20" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (renters.length === 0) {
    return (
      <div className="py-12 text-center">
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
        <h3 className="mb-2 text-lg font-medium text-gray-900">暂无租客</h3>
        <p className="mb-4 text-gray-500">还没有添加任何租客信息</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {renters.map((renter) => (
        <RenterCard
          key={renter.id}
          renter={renter}
          onClick={onRenterClick}
          onEdit={onRenterEdit}
          onDelete={onRenterDelete}
        />
      ))}
    </div>
  )
}
