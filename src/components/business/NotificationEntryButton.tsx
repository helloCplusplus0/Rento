'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'

import { cn } from '@/lib/utils'

interface NotificationEntryButtonProps {
  variant?: 'desktop' | 'hero'
  className?: string
}

const notificationEntryStyles = {
  desktop:
    'h-10 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  hero:
    'h-10 rounded-xl bg-white/15 px-3 text-sm font-medium text-white hover:bg-white/20',
} as const

/**
 * 统一通知入口
 * 保持桌面端与移动端使用同一入口表达，避免一端占位、一端缺席。
 */
export function NotificationEntryButton({
  variant = 'desktop',
  className,
}: NotificationEntryButtonProps) {
  return (
    <Link
      href="/notifications"
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
        notificationEntryStyles[variant],
        className
      )}
      aria-label="打开通知中心"
    >
      <Bell className="h-4 w-4" />
      <span>通知</span>
    </Link>
  )
}
