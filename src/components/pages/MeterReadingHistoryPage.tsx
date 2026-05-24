'use client'

import { useEffect, useState } from 'react'
import { Calendar, Download, Edit, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReadingStatusChecker } from '@/components/business/ReadingStatusChecker'
import { PageContainer } from '@/components/layout'

type MeterReadingRecordType =
  | 'INITIAL_BASELINE'
  | 'REGULAR_READING'
  | 'CHECKOUT_FINAL'

const RECORD_TYPE_BADGE_CONFIG = {
  INITIAL_BASELINE: {
    label: '初始底数',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  REGULAR_READING: {
    label: '正常抄表',
    className: 'border-green-200 bg-green-50 text-green-700',
  },
  CHECKOUT_FINAL: {
    label: '退租结算',
    className: 'border-purple-200 bg-purple-50 text-purple-700',
  },
} satisfies Record<
  MeterReadingRecordType,
  { label: string; className: string }
>

const LEGACY_INITIAL_BASELINE_REMARK_PATTERN =
  /合同创建|初始读数|初始底数|底数/i
const LEGACY_CHECKOUT_FINAL_REMARK_PATTERN = /退租|结算|checkout|final/i

function isKnownRecordType(value: unknown): value is MeterReadingRecordType {
  return typeof value === 'string' && value in RECORD_TYPE_BADGE_CONFIG
}

function resolveRecordTypeBadgeConfig(reading: Pick<
  MeterReadingHistory,
  'recordType' | 'remarks' | 'usage'
>) {
  if (isKnownRecordType(reading.recordType)) {
    return RECORD_TYPE_BADGE_CONFIG[reading.recordType]
  }

  const normalizedRemarks = reading.remarks?.trim() ?? ''

  // 仅在结构化字段缺失或异常时，才回退到存量兼容判断，避免重新依赖备注文本。
  if (
    reading.usage === 0 &&
    LEGACY_INITIAL_BASELINE_REMARK_PATTERN.test(normalizedRemarks)
  ) {
    return {
      label: '初始底数(兼容)',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    }
  }

  if (LEGACY_CHECKOUT_FINAL_REMARK_PATTERN.test(normalizedRemarks)) {
    return {
      label: '退租结算(兼容)',
      className: 'border-purple-200 bg-purple-50 text-purple-700',
    }
  }

  return {
    label: '未知类型',
    className: 'border-gray-200 bg-gray-50 text-gray-600',
  }
}

interface MeterReadingHistory {
  id: string
  meterId: string
  meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  previousReading: number
  currentReading: number
  usage: number
  unitPrice: number
  amount: number
  readingDate: string
  period?: string
  status: 'PENDING' | 'CONFIRMED' | 'BILLED' | 'CANCELLED'
  operator?: string
  remarks?: string
  recordType?: MeterReadingRecordType | string | null
  isBilled: boolean
  createdAt: string
  // 关联数据
  meter?: {
    displayName: string
    room?: {
      roomNumber: string
      building?: {
        name: string
      }
    }
  }
  contract?: {
    renter?: {
      name: string
    }
  }
}

interface FilterOptions {
  search: string
  meterType: string
  status: string
  dateRange: string
  operator?: string
  recordType: 'all' | MeterReadingRecordType
}

/**
 * 抄表历史页面组件
 * 提供抄表历史查询、筛选和管理功能
 */
export function MeterReadingHistoryPage() {
  const [readings, setReadings] = useState<MeterReadingHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    meterType: 'all',
    status: 'all',
    dateRange: 'all',
    operator: '',
    recordType: 'all', // 新增：默认显示所有记录
  })

  // 加载抄表历史数据
  useEffect(() => {
    loadReadingHistory()
  }, [filters])

  const loadReadingHistory = async () => {
    try {
      setLoading(true)
      // 实际API调用 - 获取抄表历史记录
      const queryParams = new URLSearchParams()
      if (filters.search) queryParams.append('search', filters.search)
      // 只有当值不是"all"时才添加到查询参数
      if (filters.meterType && filters.meterType !== 'all')
        queryParams.append('meterType', filters.meterType)
      if (filters.status && filters.status !== 'all')
        queryParams.append('status', filters.status)
      if (filters.dateRange && filters.dateRange !== 'all')
        queryParams.append('dateRange', filters.dateRange)
      if (filters.operator && filters.operator !== 'all')
        queryParams.append('operator', filters.operator)
      if (filters.recordType && filters.recordType !== 'all') {
        queryParams.append('recordType', filters.recordType)
      }

      const response = await fetch(
        `/api/meter-readings?${queryParams.toString()}`
      )
      if (response.ok) {
        const data = await response.json()
        setReadings(data.data || [])
      } else {
        console.error('Failed to load meter reading history')
        setReadings([])
      }
    } catch (error) {
      console.error('加载抄表历史失败:', error)
      setReadings([])
    } finally {
      setLoading(false)
    }
  }

  // 处理筛选变更
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // 处理编辑
  const handleEdit = (reading: MeterReadingHistory) => {
    // TODO: 打开编辑弹窗
    console.log('编辑抄表记录:', reading.id)
  }

  // 导出数据
  const handleExport = () => {
    // TODO: 实现数据导出
    console.log('导出抄表历史数据')
  }

  // 获取仪表类型显示名称
  const getMeterTypeLabel = (type: string) => {
    const labels = {
      ELECTRICITY: '电表',
      COLD_WATER: '冷水表',
      HOT_WATER: '热水表',
      GAS: '燃气表',
    }
    return labels[type as keyof typeof labels] || type
  }

  // 获取仪表类型颜色
  const getMeterTypeColor = (type: string) => {
    const colors = {
      ELECTRICITY: 'bg-yellow-100 text-yellow-800',
      COLD_WATER: 'bg-blue-100 text-blue-800',
      HOT_WATER: 'bg-red-100 text-red-800',
      GAS: 'bg-orange-100 text-orange-800',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // 获取状态显示名称
  const getStatusLabel = (status: string) => {
    const labels = {
      PENDING: '待确认',
      CONFIRMED: '已确认',
      BILLED: '已生成账单',
      CANCELLED: '已取消',
    }
    return labels[status as keyof typeof labels] || status
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-orange-100 text-orange-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      BILLED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getRecordTypeBadge = (reading: MeterReadingHistory) => {
    const { label, className } = resolveRecordTypeBadgeConfig(reading)

    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <PageContainer title="抄表历史" showBackButton>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">加载历史数据中...</div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="抄表历史"
      showBackButton
      actions={
        <Button
          onClick={handleExport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          导出
        </Button>
      }
    >
      <div className="space-y-6 pb-6">
        {/* 状态一致性检查器 */}
        <ReadingStatusChecker />

        {/* 筛选区域 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* 搜索框 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder="搜索房间号、租客姓名或备注..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange('search', e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 筛选选项 */}
              <div className="flex flex-wrap gap-2">
                {/* 记录类型筛选 */}
                <Select
                  value={filters.recordType}
                  onValueChange={(value) =>
                    handleFilterChange('recordType', value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="记录类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部记录</SelectItem>
                    <SelectItem value="REGULAR_READING">正常抄表</SelectItem>
                    <SelectItem value="INITIAL_BASELINE">初始底数</SelectItem>
                    <SelectItem value="CHECKOUT_FINAL">退租结算</SelectItem>
                  </SelectContent>
                </Select>

                {/* 仪表类型筛选 */}
                <Select
                  value={filters.meterType}
                  onValueChange={(value) =>
                    handleFilterChange('meterType', value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="仪表类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="ELECTRICITY">电表</SelectItem>
                    <SelectItem value="COLD_WATER">冷水表</SelectItem>
                    <SelectItem value="HOT_WATER">热水表</SelectItem>
                    <SelectItem value="GAS">燃气表</SelectItem>
                  </SelectContent>
                </Select>

                {/* 状态筛选 */}
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="PENDING">待确认</SelectItem>
                    <SelectItem value="CONFIRMED">已确认</SelectItem>
                    <SelectItem value="BILLED">已生成账单</SelectItem>
                    <SelectItem value="CANCELLED">已取消</SelectItem>
                  </SelectContent>
                </Select>

                {/* 时间范围筛选 */}
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) =>
                    handleFilterChange('dateRange', value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="时间范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部时间</SelectItem>
                    <SelectItem value="today">今天</SelectItem>
                    <SelectItem value="week">本周</SelectItem>
                    <SelectItem value="month">本月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-sm text-gray-600">
            当前阶段默认保留抄表历史事实，历史页不提供删除入口；如需处理错误记录，应通过受控修复流程完成。
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {readings.length}
                </div>
                <div className="text-sm text-gray-500">总记录数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ¥{readings.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">总费用</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {readings.filter((r) => r.status === 'PENDING').length}
                </div>
                <div className="text-sm text-gray-500">待确认</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {readings.filter((r) => r.status === 'BILLED').length}
                </div>
                <div className="text-sm text-gray-500">已生成账单</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 抄表记录列表 */}
        {readings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500">暂无抄表记录</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {readings.map((reading) => (
              <Card key={reading.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 头部信息 - 房间和仪表信息 */}
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getMeterTypeColor(reading.meterType)}
                            >
                              {getMeterTypeLabel(reading.meterType)}
                            </Badge>
                            {getRecordTypeBadge(reading)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {reading.meter?.displayName ||
                                `${getMeterTypeLabel(reading.meterType)}表`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reading.meter?.room?.building?.name} -{' '}
                              {reading.meter?.room?.roomNumber}
                              {reading.contract?.renter?.name && (
                                <span className="ml-2">
                                  • {reading.contract.renter.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(reading.status)}>
                            {getStatusLabel(reading.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* 核心抄表数据 */}
                      <div className="mb-2 grid grid-cols-2 gap-3 rounded bg-gray-50 p-2 text-sm sm:grid-cols-4">
                        <div>
                          <span className="text-gray-500">上次读数：</span>
                          <span className="block font-medium">
                            {reading.previousReading || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">本次读数：</span>
                          <span className="block font-medium">
                            {reading.currentReading}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">用量：</span>
                          <span className="block font-medium text-blue-600">
                            {reading.usage}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">费用：</span>
                          <span className="block font-medium text-green-600">
                            ¥{reading.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* 抄表时间和操作信息 */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(reading.readingDate).toLocaleDateString()}
                          </span>
                        </div>
                        {reading.operator && (
                          <div>
                            <span>操作员: {reading.operator}</span>
                          </div>
                        )}
                      </div>

                      {/* 备注信息 */}
                      {reading.remarks && (
                        <div className="mt-2 rounded bg-yellow-50 p-2 text-sm text-gray-600">
                          <span className="font-medium">备注: </span>
                          {reading.remarks}
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="ml-3 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(reading)}
                        disabled={reading.status === 'BILLED'}
                        className="h-8 w-8 p-0"
                        title={
                          reading.status === 'BILLED'
                            ? '已生成账单的记录不可编辑'
                            : '编辑抄表记录'
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
