'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Download } from 'lucide-react'

import { type BillStatsData, type DateRange } from '@/lib/bill-stats'
import { Button } from '@/components/ui/button'
import { BillCharts } from '@/components/business/BillCharts'
import { DateRangeSelector } from '@/components/business/DateRangeSelector'
import { StatsSummary } from '@/components/business/StatsSummary'
import { PageContainer } from '@/components/layout'

interface BillStatsPageProps {
  initialData: BillStatsData
  initialRange: DateRange
}

export function BillStatsPage({
  initialData,
  initialRange,
}: BillStatsPageProps) {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange>(initialRange)
  const [statsData, setStatsData] = useState<BillStatsData>(initialData)
  const [loading, setLoading] = useState(false)

  // 处理时间范围变化
  const handleDateRangeChange = async (newRange: DateRange) => {
    setLoading(true)
    try {
      // 更新URL参数
      const params = new URLSearchParams()
      params.set('start', newRange.startDate.toISOString().split('T')[0])
      params.set('end', newRange.endDate.toISOString().split('T')[0])
      if (newRange.preset) {
        params.set('range', newRange.preset)
      }

      // 使用router.push更新URL
      router.push(`/bills/stats?${params.toString()}`)

      // 获取新的统计数据
      const response = await fetch(
        `/api/bills/stats?${params.toString()}&comparison=true`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const newData = await response.json()

      setDateRange(newRange)
      setStatsData(newData)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // 可以添加错误提示
    } finally {
      setLoading(false)
    }
  }

  // 导出数据功能（预留）
  const handleExport = () => {
    // 实现数据导出功能
    console.log('Export data:', statsData)
    // 可以导出为CSV或Excel格式
  }

  return (
    <PageContainer title="账单统计" showBackButton>
      <div className="space-y-6 pb-6">
        {/* 页面说明和导出按钮 */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            账单统计分析
          </h2>
          <p className="mb-4 text-gray-600">查看收支统计、趋势分析和数据对比</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="mb-4"
          >
            <Download className="mr-2 h-4 w-4" />
            导出数据
          </Button>
        </div>

        {/* 时间范围选择器 */}
        <DateRangeSelector
          value={dateRange}
          onChange={handleDateRangeChange}
          loading={loading}
        />

        {/* 统计摘要 */}
        <StatsSummary data={statsData} loading={loading} />

        {/* 图表区域 */}
        <BillCharts data={statsData} loading={loading} />

        {/* 数据说明 */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-900">数据说明</h3>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>• 统计数据基于账单的到期日期进行计算</li>
            <li>• 收款率 = 已收金额 / 总应收金额</li>
            <li>• 同期对比基于相同时间长度的上一个周期</li>
            <li>• 图表数据实时更新，反映最新的账单状态</li>
          </ul>
        </div>
      </div>
    </PageContainer>
  )
}
