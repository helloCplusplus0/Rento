'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Download,
  Edit,
  RefreshCw,
  Search,
  Wrench,
} from 'lucide-react'

import { MeterTypeIcon } from '@/components/business/MeterTypeIcon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageContainer } from '@/components/layout'
import { meterReadingHistoryMobileStyles } from '@/components/pages/meter-reading-history-mobile-styles'

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
    meterNumber?: string
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

interface StatusCheckResult {
  success: boolean
  data: {
    isConsistent: boolean
    inconsistencies: number
    details: {
      orphanedReadings: number
      inconsistentReadings: number
    }
    orphanedReadings: Array<{
      id: string
      meterName: string
      meterType: string
      status: string
      isBilled: boolean
      roomInfo?: {
        buildingName?: string
        roomNumber?: string
      }
    }>
    inconsistentReadings: Array<{
      id: string
      meterName: string
      meterType: string
      status: string
      isBilled: boolean
      billDetailsCount: number
      roomInfo?: {
        buildingName?: string
        roomNumber?: string
      }
    }>
    statistics?: {
      summary: {
        totalReadings: number
        totalBilled: number
        billedPercentage: number
        recentChanges: number
      }
    }
  }
  message: string
}

interface RepairResult {
  success: boolean
  data: {
    repairedOrphaned: number
    repairedInconsistent: number
    errors: string[]
    preRepairInconsistencies: number
    postRepairInconsistencies: number
    fullyRepaired: boolean
  }
  message: string
}

/**
 * 抄表历史页面组件
 * 提供抄表历史查询、筛选和管理功能
 */
export function MeterReadingHistoryPage() {
  const [readings, setReadings] = useState<MeterReadingHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const [checkResult, setCheckResult] = useState<StatusCheckResult | null>(null)
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null)
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

  const handleCheck = async () => {
    setChecking(true)
    setRepairResult(null)

    try {
      const response = await fetch('/api/meter-readings/status-check')
      const data = await response.json()
      setCheckResult(data)
    } catch (error) {
      console.error('状态检查失败:', error)
      alert('状态检查失败，请稍后重试')
    } finally {
      setChecking(false)
    }
  }

  const handleRepair = async () => {
    setRepairing(true)

    try {
      const response = await fetch('/api/meter-readings/repair-status', {
        method: 'POST',
      })
      const data = await response.json()
      setRepairResult(data)

      if (data.success) {
        setTimeout(() => {
          handleCheck()
        }, 1000)
      }
    } catch (error) {
      console.error('状态修复失败:', error)
      alert('状态修复失败，请稍后重试')
    } finally {
      setRepairing(false)
    }
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
      PENDING: 'border-orange-200 bg-orange-50 text-orange-700',
      CONFIRMED: 'border-green-200 bg-green-50 text-green-700',
      BILLED: 'border-blue-200 bg-blue-50 text-blue-700',
      CANCELLED: 'border-gray-200 bg-gray-50 text-gray-600',
    }
    return (
      colors[status as keyof typeof colors] ||
      'border-gray-200 bg-gray-50 text-gray-600'
    )
  }

  const getRecordTypeBadge = (reading: MeterReadingHistory) => {
    const { label, className } = resolveRecordTypeBadgeConfig(reading)

    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    )
  }

  const summaryStats = useMemo(
    () => ({
      totalRecords: readings.length,
      totalAmount: readings.reduce((sum, reading) => sum + reading.amount, 0),
      pendingCount: readings.filter((reading) => reading.status === 'PENDING')
        .length,
      billedCount: readings.filter((reading) => reading.isBilled).length,
    }),
    [readings]
  )

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
    <PageContainer title="抄表历史" showBackButton>
      <div className={meterReadingHistoryMobileStyles.pageSection}>
        <div className={meterReadingHistoryMobileStyles.actionsGrid}>
          <Button
            variant="outline"
            className={meterReadingHistoryMobileStyles.actionButton}
            onClick={handleExport}
          >
            <Download data-icon="inline-start" />
            导出记录
          </Button>
          <Button
            variant="outline"
            className={meterReadingHistoryMobileStyles.actionButton}
            onClick={handleCheck}
            disabled={checking || repairing}
          >
            <RefreshCw
              data-icon="inline-start"
              className={checking ? 'animate-spin' : undefined}
            />
            {checking ? '检查中...' : '检查状态'}
          </Button>
          {checkResult && !checkResult.data.isConsistent ? (
            <Button
              className={meterReadingHistoryMobileStyles.actionButton}
              onClick={handleRepair}
              disabled={checking || repairing}
            >
              <Wrench data-icon="inline-start" />
              {repairing ? '修复中...' : '自动修复'}
            </Button>
          ) : null}
        </div>

        {checkResult ? (
          <div className={meterReadingHistoryMobileStyles.statusPanel}>
            <div className={meterReadingHistoryMobileStyles.statusPanelHeader}>
              <div>
                <div className={meterReadingHistoryMobileStyles.statusPanelTitle}>
                  抄表状态一致性检查
                </div>
                <div className={meterReadingHistoryMobileStyles.statusPanelText}>
                  {checkResult.message}
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  checkResult.data.isConsistent
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                }
              >
                {checkResult.data.isConsistent ? (
                  <CheckCircle data-icon="inline-start" />
                ) : (
                  <AlertCircle data-icon="inline-start" />
                )}
                {checkResult.data.isConsistent ? '状态一致' : '存在异常'}
              </Badge>
            </div>

            {checkResult.data.statistics?.summary ? (
              <div className={meterReadingHistoryMobileStyles.statusPanelSection}>
                <div className={meterReadingHistoryMobileStyles.statusPanelList}>
                  <div>
                    总抄表记录：{checkResult.data.statistics.summary.totalReadings}
                  </div>
                  <div>
                    已生成账单：
                    {checkResult.data.statistics.summary.totalBilled} 条（
                    {checkResult.data.statistics.summary.billedPercentage}%）
                  </div>
                  <div>
                    最近 7 天变更：
                    {checkResult.data.statistics.summary.recentChanges} 条
                  </div>
                </div>
              </div>
            ) : null}

            {!checkResult.data.isConsistent ? (
              <div className={meterReadingHistoryMobileStyles.statusPanelSection}>
                <div className={meterReadingHistoryMobileStyles.statusPanelText}>
                  孤立记录 {checkResult.data.details.orphanedReadings} 条，不一致记录{' '}
                  {checkResult.data.details.inconsistentReadings} 条。
                </div>
                <div className={meterReadingHistoryMobileStyles.issueList}>
                  {checkResult.data.orphanedReadings.map((reading) => (
                    <div
                      key={reading.id}
                      className={meterReadingHistoryMobileStyles.issueCard}
                    >
                      <div className={meterReadingHistoryMobileStyles.issueTitleRow}>
                        <div className={meterReadingHistoryMobileStyles.issueTitle}>
                          {reading.meterName}
                        </div>
                        <Badge
                          variant="outline"
                          className="border-yellow-200 bg-yellow-100 text-yellow-700"
                        >
                          孤立记录
                        </Badge>
                      </div>
                      <div className={meterReadingHistoryMobileStyles.issueMeta}>
                        {reading.roomInfo?.buildingName} - {reading.roomInfo?.roomNumber}
                      </div>
                      <div className={meterReadingHistoryMobileStyles.issueText}>
                        状态：{reading.status}，已生成账单：
                        {reading.isBilled ? '是' : '否'}
                      </div>
                    </div>
                  ))}
                  {checkResult.data.inconsistentReadings.map((reading) => (
                    <div
                      key={reading.id}
                      className={meterReadingHistoryMobileStyles.issueCard}
                    >
                      <div className={meterReadingHistoryMobileStyles.issueTitleRow}>
                        <div className={meterReadingHistoryMobileStyles.issueTitle}>
                          {reading.meterName}
                        </div>
                        <Badge
                          variant="outline"
                          className="border-yellow-200 bg-yellow-100 text-yellow-700"
                        >
                          状态不一致
                        </Badge>
                      </div>
                      <div className={meterReadingHistoryMobileStyles.issueMeta}>
                        {reading.roomInfo?.buildingName} - {reading.roomInfo?.roomNumber}
                      </div>
                      <div className={meterReadingHistoryMobileStyles.issueText}>
                        状态：{reading.status}，已生成账单：
                        {reading.isBilled ? '是' : '否'}，账单明细：
                        {reading.billDetailsCount} 条
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {repairResult ? (
          <div className={meterReadingHistoryMobileStyles.statusPanel}>
            <div className={meterReadingHistoryMobileStyles.statusPanelHeader}>
              <div>
                <div className={meterReadingHistoryMobileStyles.statusPanelTitle}>
                  自动修复结果
                </div>
                <div className={meterReadingHistoryMobileStyles.statusPanelText}>
                  {repairResult.message}
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  repairResult.success
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }
              >
                {repairResult.success ? (
                  <CheckCircle data-icon="inline-start" />
                ) : (
                  <AlertCircle data-icon="inline-start" />
                )}
                {repairResult.success ? '修复完成' : '修复失败'}
              </Badge>
            </div>
            <div className={meterReadingHistoryMobileStyles.statusPanelList}>
              <div>
                修复前不一致记录：{repairResult.data.preRepairInconsistencies} 条
              </div>
              <div>
                修复后不一致记录：{repairResult.data.postRepairInconsistencies} 条
              </div>
              <div>孤立记录修复：{repairResult.data.repairedOrphaned} 条</div>
              <div>不一致记录修复：{repairResult.data.repairedInconsistent} 条</div>
            </div>
          </div>
        ) : null}

        <Card className={meterReadingHistoryMobileStyles.toolbarCard}>
          <CardContent className="p-0">
            <div className={meterReadingHistoryMobileStyles.toolbarStack}>
              <div className={meterReadingHistoryMobileStyles.toolbarRow}>
                <div className={meterReadingHistoryMobileStyles.searchWrap}>
                  <Search className={meterReadingHistoryMobileStyles.searchIcon} />
                  <Input
                    placeholder="搜索房间号、租客姓名或备注..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange('search', e.target.value)
                    }
                    className={meterReadingHistoryMobileStyles.searchInput}
                  />
                </div>
                <div className={meterReadingHistoryMobileStyles.filtersRow}>
                  <Select
                    value={filters.recordType}
                    onValueChange={(value) =>
                      handleFilterChange('recordType', value)
                    }
                  >
                    <SelectTrigger
                      className={meterReadingHistoryMobileStyles.selectTrigger}
                    >
                      <SelectValue placeholder="记录类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部记录</SelectItem>
                      <SelectItem value="REGULAR_READING">正常抄表</SelectItem>
                      <SelectItem value="INITIAL_BASELINE">初始底数</SelectItem>
                      <SelectItem value="CHECKOUT_FINAL">退租结算</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.meterType}
                    onValueChange={(value) =>
                      handleFilterChange('meterType', value)
                    }
                  >
                    <SelectTrigger
                      className={meterReadingHistoryMobileStyles.selectTrigger}
                    >
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

                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger
                      className={meterReadingHistoryMobileStyles.selectTrigger}
                    >
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

                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) =>
                      handleFilterChange('dateRange', value)
                    }
                  >
                    <SelectTrigger
                      className={meterReadingHistoryMobileStyles.selectTrigger}
                    >
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
              <div className={meterReadingHistoryMobileStyles.resultText}>
                当前筛选结果：共 {summaryStats.totalRecords} 条记录，待确认{' '}
                {summaryStats.pendingCount} 条，已关联账单 {summaryStats.billedCount}{' '}
                条。
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={meterReadingHistoryMobileStyles.statsGrid}>
          <Card className={meterReadingHistoryMobileStyles.statsCard}>
            <CardContent className={meterReadingHistoryMobileStyles.statsContent}>
              <div className={meterReadingHistoryMobileStyles.statsInner}>
                <div>
                  <div className={meterReadingHistoryMobileStyles.statsLabel}>
                    当前记录数
                  </div>
                  <div className="mt-0.5 text-xl font-bold leading-6 text-blue-600 sm:mt-1 sm:text-2xl">
                    {summaryStats.totalRecords}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={meterReadingHistoryMobileStyles.statsCard}>
            <CardContent className={meterReadingHistoryMobileStyles.statsContent}>
              <div className={meterReadingHistoryMobileStyles.statsInner}>
                <div>
                  <div className={meterReadingHistoryMobileStyles.statsLabel}>
                    当前费用合计
                  </div>
                  <div className="mt-0.5 text-xl font-bold leading-6 text-green-600 sm:mt-1 sm:text-2xl">
                    ¥{summaryStats.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={meterReadingHistoryMobileStyles.statsCard}>
            <CardContent className={meterReadingHistoryMobileStyles.statsContent}>
              <div className={meterReadingHistoryMobileStyles.statsInner}>
                <div>
                  <div className={meterReadingHistoryMobileStyles.statsLabel}>
                    待确认
                  </div>
                  <div className="mt-0.5 text-xl font-bold leading-6 text-orange-600 sm:mt-1 sm:text-2xl">
                    {summaryStats.pendingCount}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={meterReadingHistoryMobileStyles.statsCard}>
            <CardContent className={meterReadingHistoryMobileStyles.statsContent}>
              <div className={meterReadingHistoryMobileStyles.statsInner}>
                <div>
                  <div className={meterReadingHistoryMobileStyles.statsLabel}>
                    已关联账单
                  </div>
                  <div className="mt-0.5 text-xl font-bold leading-6 text-purple-600 sm:mt-1 sm:text-2xl">
                    {summaryStats.billedCount}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {readings.length === 0 ? (
          <Card className={meterReadingHistoryMobileStyles.emptyState}>
            <CardContent className="py-10">
              <div className={meterReadingHistoryMobileStyles.emptyTitle}>
                暂无抄表记录
              </div>
              <div className={meterReadingHistoryMobileStyles.emptyText}>
                可以调整搜索条件或筛选项后重试。
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={meterReadingHistoryMobileStyles.listStack}>
            {readings.map((reading) => (
              <Card key={reading.id} className={meterReadingHistoryMobileStyles.card}>
                <CardContent className={meterReadingHistoryMobileStyles.cardContent}>
                  <div className={meterReadingHistoryMobileStyles.cardHeader}>
                    <div className={meterReadingHistoryMobileStyles.cardLeading}>
                      <div className={meterReadingHistoryMobileStyles.cardTitleRow}>
                        <MeterTypeIcon meterType={reading.meterType} />
                        <div className={meterReadingHistoryMobileStyles.cardTitle}>
                          {reading.meter?.displayName ||
                            `${getMeterTypeLabel(reading.meterType)}表`}
                        </div>
                      </div>
                      <div className={meterReadingHistoryMobileStyles.cardMeta}>
                        {reading.meter?.meterNumber
                          ? `${reading.meter.meterNumber} · `
                          : ''}
                        {reading.meter?.room?.building?.name} -{' '}
                        {reading.meter?.room?.roomNumber}
                        {reading.contract?.renter?.name ? (
                          <span> • {reading.contract.renter.name}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className={meterReadingHistoryMobileStyles.badgeRow}>
                      {getRecordTypeBadge(reading)}
                      <Badge variant="outline" className={getStatusColor(reading.status)}>
                        {getStatusLabel(reading.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className={meterReadingHistoryMobileStyles.summaryGrid}>
                    <div className={meterReadingHistoryMobileStyles.summaryItem}>
                      <div className={meterReadingHistoryMobileStyles.summaryLabel}>
                        上次读数
                      </div>
                      <div className={meterReadingHistoryMobileStyles.summaryValue}>
                        {reading.previousReading || 0}
                      </div>
                    </div>
                    <div className={meterReadingHistoryMobileStyles.summaryItem}>
                      <div className={meterReadingHistoryMobileStyles.summaryLabel}>
                        本次读数
                      </div>
                      <div className={meterReadingHistoryMobileStyles.summaryValue}>
                        {reading.currentReading}
                      </div>
                    </div>
                    <div className={meterReadingHistoryMobileStyles.summaryItem}>
                      <div className={meterReadingHistoryMobileStyles.summaryLabel}>
                        用量
                      </div>
                      <div
                        className={
                          meterReadingHistoryMobileStyles.summaryValueUsage
                        }
                      >
                        {reading.usage}
                      </div>
                    </div>
                    <div className={meterReadingHistoryMobileStyles.summaryItem}>
                      <div className={meterReadingHistoryMobileStyles.summaryLabel}>
                        费用
                      </div>
                      <div
                        className={
                          meterReadingHistoryMobileStyles.summaryValueAmount
                        }
                      >
                        ¥{reading.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className={meterReadingHistoryMobileStyles.footerRow}>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {new Date(reading.readingDate).toLocaleDateString()}
                      </span>
                    </div>
                    {reading.operator ? <div>操作员：{reading.operator}</div> : null}
                    {reading.isBilled ? <div>已关联账单</div> : null}
                  </div>

                  {reading.remarks ? (
                    <div className={meterReadingHistoryMobileStyles.remarkBox}>
                      <div className={meterReadingHistoryMobileStyles.remarkText}>
                        <span className="font-medium">备注：</span>
                        {reading.remarks}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-2 flex justify-end">
                    <div className={meterReadingHistoryMobileStyles.cardActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(reading)}
                        disabled={reading.status === 'BILLED'}
                        className={meterReadingHistoryMobileStyles.cardActionButton}
                        title={
                          reading.status === 'BILLED'
                            ? '已生成账单的记录不可编辑'
                            : '编辑抄表记录'
                        }
                      >
                        <Edit />
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
