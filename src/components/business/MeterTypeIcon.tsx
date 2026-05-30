'use client'

import { Droplets, Flame, Gauge, Zap } from 'lucide-react'

import type { MeterType } from '@/lib/meter-utils'

interface MeterTypeIconProps {
  meterType: MeterType | string
  className?: string
}

export function MeterTypeIcon({
  meterType,
  className = 'h-4 w-4',
}: MeterTypeIconProps) {
  switch (meterType) {
    case 'ELECTRICITY':
      return <Zap className={`${className} text-yellow-500`} />
    case 'COLD_WATER':
      return <Droplets className={`${className} text-blue-500`} />
    case 'HOT_WATER':
      return <Droplets className={`${className} text-red-500`} />
    case 'GAS':
      return <Flame className={`${className} text-orange-500`} />
    default:
      return <Gauge className={`${className} text-gray-500`} />
  }
}
