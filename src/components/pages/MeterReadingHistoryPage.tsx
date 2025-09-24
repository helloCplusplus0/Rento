'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Download, Edit, Trash2, Calendar } from 'lucide-react'
import { ReadingStatusChecker } from '@/components/business/ReadingStatusChecker'

// 临时类型定义
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
    operator: ''
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
      if (filters.meterType && filters.meterType !== 'all') queryParams.append('meterType', filters.meterType)
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status)
      if (filters.dateRange && filters.dateRange !== 'all') queryParams.append('dateRange', filters.dateRange)
      if (filters.operator && filters.operator !== 'all') queryParams.append('operator', filters.operator)
      
      const response = await fetch(`/api/meter-readings?${queryParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setReadings(data.readings || [])
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
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // 处理编辑
  const handleEdit = (reading: MeterReadingHistory) => {
    // TODO: 打开编辑弹窗
    console.log('编辑抄表记录:', reading.id)
  }

  // 处理删除
  const handleDelete = async (reading: MeterReadingHistory) => {
    if (!confirm('确定要删除这条抄表记录吗？删除后无法恢复。')) {
      return
    }

    try {
      const response = await fetch(`/api/meter-readings/${reading.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        alert('抄表记录删除成功')
        // 重新加载数据
        loadReadingHistory()
      } else {
        alert(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除抄表记录失败:', error)
      alert('删除失败，请重试')
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
      GAS: '燃气表'
    }
    return labels[type as keyof typeof labels] || type
  }

  // 获取仪表类型颜色
  const getMeterTypeColor = (type: string) => {
    const colors = {
      ELECTRICITY: 'bg-yellow-100 text-yellow-800',
      COLD_WATER: 'bg-blue-100 text-blue-800',
      HOT_WATER: 'bg-red-100 text-red-800',
      GAS: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // 获取状态显示名称
  const getStatusLabel = (status: string) => {
    const labels = {
      PENDING: '待确认',
      CONFIRMED: '已确认',
      BILLED: '已生成账单',
      CANCELLED: '已取消'
    }
    return labels[status as keyof typeof labels] || status
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-orange-100 text-orange-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      BILLED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出
        </Button>
      }
    >
      <div className="space-y-6 pb-6">
        {/* 状态一致性检查器 */}
        <ReadingStatusChecker />

        {/* 筛选区域 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索房间号、租客姓名"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 仪表类型 */}
              <Select value={filters.meterType} onValueChange={(value) => handleFilterChange('meterType', value)}>
                <SelectTrigger>
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

              {/* 状态 */}
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
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

              {/* 时间范围 */}
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="抄表时间" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部时间</SelectItem>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="quarter">本季度</SelectItem>
                  <SelectItem value="year">本年度</SelectItem>
                </SelectContent>
              </Select>

              {/* 操作员筛选 */}
              <Select value={filters.operator || 'all'} onValueChange={(value) => handleFilterChange('operator', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="操作员" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部操作员</SelectItem>
                  <SelectItem value="管理员">管理员</SelectItem>
                  <SelectItem value="系统">系统</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{readings.length}</div>
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
                  {readings.filter(r => r.status === 'PENDING').length}
                </div>
                <div className="text-sm text-gray-500">待确认</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {readings.filter(r => r.status === 'BILLED').length}
                </div>
                <div className="text-sm text-gray-500">已生成账单</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 抄表记录列表 */}
        {readings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">暂无抄表记录</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {readings.map(reading => (
              <Card key={reading.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* 头部信息 - 房间和仪表信息 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getMeterTypeColor(reading.meterType)}>
                          {getMeterTypeLabel(reading.meterType)}
                        </Badge>
                        <Badge className={getStatusColor(reading.status)}>
                          {getStatusLabel(reading.status)}
                        </Badge>
                        <span className="font-medium text-lg">
                          {reading.meter?.room?.building?.name} - {reading.meter?.room?.roomNumber}
                        </span>
                        <span className="text-gray-600">
                          {reading.meter?.displayName || getMeterTypeLabel(reading.meterType)}
                        </span>
                        {reading.contract?.renter?.name && (
                          <span className="text-gray-500">租客: {reading.contract.renter.name}</span>
                        )}
                      </div>

                      {/* 核心抄表数据 */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded">
                        <div>
                          <span className="text-gray-500">上次读数：</span>
                          <span className="font-medium block">{reading.previousReading || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">本次读数：</span>
                          <span className="font-medium block">{reading.currentReading}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">用量：</span>
                          <span className="font-medium text-blue-600 block">{reading.usage}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">费用：</span>
                          <span className="font-medium text-green-600 block">¥{reading.amount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* 抄表时间和操作信息 */}
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>抄表时间: {new Date(reading.readingDate).toLocaleDateString()}</span>
                        </div>
                        {reading.operator && (
                          <div>
                            <span>操作员: {reading.operator}</span>
                          </div>
                        )}
                      </div>

                      {/* 备注信息 */}
                      {reading.remarks && (
                        <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                          <span className="font-medium">备注: </span>
                          {reading.remarks}
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 - 只保留删除功能 */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(reading)}
                        disabled={reading.status === 'BILLED'}
                        className="text-red-600 hover:text-red-700"
                        title={reading.status === 'BILLED' ? '已生成账单的记录不可删除' : '删除抄表记录'}
                      >
                        <Trash2 className="w-4 h-4" />
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