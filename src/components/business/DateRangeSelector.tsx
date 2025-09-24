'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { calculateDateRange, type DateRange } from '@/lib/bill-stats'

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
  loading?: boolean
}

export function DateRangeSelector({ value, onChange, loading }: DateRangeSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(value.preset || 'month')
  
  const presets = [
    { label: '今日', value: 'today' },
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' },
    { label: '本季度', value: 'quarter' },
    { label: '本年', value: 'year' }
  ]
  
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    const range = calculateDateRange(preset)
    onChange(range)
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* 预设时间范围 */}
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={selectedPreset === preset.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetChange(preset.value)}
                disabled={loading}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          {/* 当前选择的时间范围显示 */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {formatDate(value.startDate)} 至 {formatDate(value.endDate)}
              </span>
            </div>
            {loading && (
              <div className="text-xs text-blue-600">
                加载中...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}