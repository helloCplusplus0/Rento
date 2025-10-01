'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle, Save } from 'lucide-react'

import { useSettings } from '@/hooks/useSettings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'

// 临时类型定义，后续会从实际API获取
interface Room {
  id: string
  roomNumber: string
  building: {
    name: string
  }
  meters: Meter[]
  activeContract?: {
    id: string
    contractNumber: string
    renter: any
    startDate: string
    endDate: string
    status: string
  } | null
}

interface Meter {
  id: string
  displayName: string
  meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  unitPrice: number
  unit: string
  lastReading?: number
  lastReadingDate?: Date
  contractId?: string | null // 关联的合同ID
  contractNumber?: string | null // 合同编号
  renterName?: string | null // 租客姓名
  contractStatus?: string | null // 合同状态
}

interface MeterReading {
  meterId: string
  currentReading: number
  readingDate: Date
  usage: number
  amount: number
  remarks?: string
}

/**
 * 批量抄表页面组件
 * 支持多房间多仪表的批量录入
 */
export function BatchMeterReadingPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const [rooms, setRooms] = useState<Room[]>([])
  const [readings, setReadings] = useState<Record<string, MeterReading>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const [aggregationMode, setAggregationMode] = useState<
    'AGGREGATED' | 'SINGLE'
  >('AGGREGATED')

  // 加载房间和仪表数据
  useEffect(() => {
    loadRoomsWithMeters()
  }, [])

  const loadRoomsWithMeters = async () => {
    try {
      setLoading(true)
      // 实际API调用 - 获取所有有仪表的房间
      const response = await fetch('/api/rooms?includeMeters=true')
      if (response.ok) {
        const roomsData = await response.json()
        // 只显示有仪表的房间
        const roomsWithMeters = roomsData.filter(
          (room: any) => room.meters && room.meters.length > 0
        )
        setRooms(roomsWithMeters)
      } else {
        console.error('Failed to load rooms with meters')
        setRooms([])
      }
    } catch (error) {
      console.error('加载房间数据失败:', error)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  // 处理读数变更
  const handleReadingChange = (meterId: string, currentReading: number) => {
    const meter = rooms.flatMap((r) => r.meters).find((m) => m.id === meterId)
    if (!meter) return

    const lastReading = Math.round(meter.lastReading || 0)
    const usage = currentReading - lastReading
    const amount = usage * meter.unitPrice

    // 简化验证逻辑 - 只检查基本规则
    const errors: Record<string, string> = {}

    // 1. 基本规则：本次读数不能小于上次读数
    if (currentReading < lastReading) {
      errors[meterId] = '本次读数不能小于上次读数'
    }

    // 2. 负数用量检查（已包含在上面的规则中）
    // 3. 移除复杂的异常用量检测，避免误判
    // 注释掉原有的异常检测逻辑：
    // } else if (usage > lastReading * settings.usageAnomalyThreshold) {
    //   errors[meterId] = `用量异常偏高（超过${settings.usageAnomalyThreshold}倍历史读数）`

    // 4. 可选：对于极大的用量给出友好提示（但不阻止提交）
    const warnings: Record<string, string> = {}
    if (usage > 1000) {
      // 用量超过1000的友好提示
      warnings[meterId] = '用量较大，请确认读数是否正确'
    }

    setValidationErrors((prev) => ({
      ...prev,
      [meterId]: errors[meterId] || '',
    }))

    setReadings((prev) => ({
      ...prev,
      [meterId]: {
        meterId,
        currentReading,
        readingDate: new Date(),
        usage,
        amount,
      },
    }))
  }

  // 提交批量抄表
  const handleSubmit = async () => {
    try {
      setSubmitting(true)

      // 验证所有读数
      const hasErrors = Object.values(validationErrors).some((error) => error)
      if (hasErrors) {
        alert('请修正所有错误后再提交')
        return
      }

      const readingsToSubmit = Object.values(readings).filter(
        (reading) => reading.currentReading > 0
      )

      if (readingsToSubmit.length === 0) {
        alert('请至少录入一个仪表读数')
        return
      }

      // 防止重复提交 - 禁用提交按钮
      const submitButton = document.querySelector(
        '[data-submit-button]'
      ) as HTMLButtonElement
      if (submitButton) {
        submitButton.disabled = true
        submitButton.textContent = '提交中...'
      }

      // 构建完整的抄表数据
      const submitData = readingsToSubmit.map((reading) => {
        const meter = rooms
          .flatMap((r) => r.meters)
          .find((m) => m.id === reading.meterId)
        const room = rooms.find((r) =>
          r.meters.some((m) => m.id === reading.meterId)
        )

        return {
          ...reading,
          meterId: reading.meterId,
          meterType: meter?.meterType,
          contractId: meter?.contractId || null, // 使用仪表关联的合同ID
          previousReading: Math.round(meter?.lastReading || 0),
          currentReading: reading.currentReading,
          usage: reading.usage,
          unitPrice: meter?.unitPrice || 0,
          amount: reading.amount,
          readingDate: reading.readingDate.toISOString(),
          period: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`,
          operator: '管理员', // TODO: 从用户会话获取
          remarks: reading.remarks || '',
        }
      })

      // 实际API调用 - 保存抄表记录
      const response = await fetch('/api/meter-readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readings: submitData,
          aggregationMode: aggregationMode, // 传入聚合模式
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 显示详细的成功信息
        let message = `✅ 成功录入 ${result.data.length} 个仪表读数`

        // 显示详细的警告信息
        if (result.warnings && result.warnings.length > 0) {
          message += `\n\n⚠️ 警告信息 (${result.warnings.length} 个):`
          result.warnings.forEach((warning: any, index: number) => {
            message += `\n${index + 1}. ${warning.warning}`
          })
        }

        // 显示详细的错误信息
        if (result.errors && result.errors.length > 0) {
          message += `\n\n❌ 错误信息 (${result.errors.length} 个):`
          result.errors.forEach((error: any, index: number) => {
            message += `\n${index + 1}. ${error.error}`
          })
        }

        message += `\n\n📝 提示: 数据已保存，即将跳转到抄表历史页面查看详情`

        alert(message)

        // 清空当前输入的数据，防止重复提交
        setReadings({})

        // 延迟跳转，让用户看到提示
        setTimeout(() => {
          router.push('/meter-readings/history')
        }, 1000)
      } else {
        throw new Error(result.error || '提交失败')
      }
    } catch (error) {
      console.error('提交抄表失败:', error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)

      // 恢复提交按钮状态
      const submitButton = document.querySelector(
        '[data-submit-button]'
      ) as HTMLButtonElement
      if (submitButton) {
        submitButton.disabled = false
        submitButton.textContent = '提交抄表'
      }
    }
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

  if (loading) {
    return (
      <PageContainer title="批量抄表" showBackButton>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">加载房间数据中...</div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="批量抄表"
      showBackButton
      actions={
        <Button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(readings).length === 0}
          className="flex items-center gap-2"
          data-submit-button="true"
        >
          <Save className="h-4 w-4" />
          {submitting ? '提交中...' : '提交抄表'}
        </Button>
      }
    >
      <div className="space-y-6 pb-6">
        {/* 操作说明和设置 */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-500" />
              <div className="text-sm text-gray-600">
                <p className="mb-1 font-medium">批量抄表说明：</p>
                <ul className="space-y-1 text-xs">
                  <li>• 请按实际仪表读数录入，系统会自动计算用量和费用</li>
                  <li>• 本次读数不能小于上次读数</li>
                  <li>• 用量异常偏高时会有警告提示</li>
                  <li>
                    •{' '}
                    {settings.autoGenerateBills
                      ? '提交后会自动生成水电费账单'
                      : '提交后需手动生成账单'}
                  </li>
                </ul>
              </div>
            </div>

            {/* 账单生成模式选择 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    账单生成模式
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    选择抄表后的账单生成策略
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAggregationMode('AGGREGATED')}
                    className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      aggregationMode === 'AGGREGATED'
                        ? 'border-blue-300 bg-blue-100 text-blue-800'
                        : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    聚合账单
                  </button>
                  <button
                    type="button"
                    onClick={() => setAggregationMode('SINGLE')}
                    className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      aggregationMode === 'SINGLE'
                        ? 'border-blue-300 bg-blue-100 text-blue-800'
                        : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    独立账单
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {aggregationMode === 'AGGREGATED'
                  ? '💡 同一房间的多个仪表将生成一个聚合账单，便于管理'
                  : '💡 每个仪表将生成独立的账单'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 紧凑表格式抄表界面 - 移动端优化 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>抄表录入</span>
              <div className="text-sm text-gray-500">
                共 {rooms.reduce((sum, r) => sum + r.meters.length, 0)} 个仪表
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* 移动端卡片式布局 */}
            <div className="block md:hidden">
              {rooms.map((room) =>
                room.meters.map((meter, index) => {
                  const reading = readings[meter.id]
                  const error = validationErrors[meter.id]
                  const hasReading = reading && reading.currentReading > 0

                  return (
                    <div key={meter.id} className="space-y-3 border-b p-4">
                      {/* 房间和仪表信息 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {room.roomNumber} - {room.building.name}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge
                              className={getMeterTypeColor(meter.meterType)}
                              variant="secondary"
                            >
                              {getMeterTypeLabel(meter.meterType)}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {meter.displayName}
                            </span>
                            {/* 优化：显示详细的合同关联状态 */}
                            {meter.contractId ? (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="default"
                                  className="bg-green-100 text-xs text-green-800"
                                >
                                  已关联合同
                                </Badge>
                                {meter.contractNumber && (
                                  <span className="text-xs text-gray-500">
                                    {meter.contractNumber}
                                  </span>
                                )}
                                {meter.renterName && (
                                  <span className="text-xs text-gray-500">
                                    • {meter.renterName}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-xs text-gray-600"
                              >
                                未关联合同
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {hasReading && !error ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : error ? (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border border-gray-300"></div>
                          )}
                        </div>
                      </div>

                      {/* 读数信息 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500">
                            上次读数
                          </label>
                          <div className="font-mono text-sm font-medium">
                            {Math.round(meter.lastReading || 0)} {meter.unit}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">
                            本次抄表
                          </label>
                          <input
                            type="number"
                            min={Math.round(meter.lastReading || 0)}
                            step="1"
                            placeholder="请输入"
                            className={`w-full rounded border px-2 py-1 text-center font-mono text-sm ${
                              error
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300'
                            }`}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              handleReadingChange(meter.id, value)
                            }}
                          />
                          {error && (
                            <div className="mt-1 text-xs text-red-600">
                              {error}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 计算结果 */}
                      {hasReading && !error && (
                        <div className="grid grid-cols-2 gap-4 border-t pt-2">
                          <div>
                            <label className="text-xs text-gray-500">
                              用量
                            </label>
                            <div className="font-mono text-sm font-medium text-blue-600">
                              {Math.round(reading.usage)} {meter.unit}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">
                              费用
                            </label>
                            <div className="font-mono text-sm font-medium text-green-600">
                              ¥{reading.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* 桌面端表格布局 */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-700">
                      房源
                    </th>
                    <th className="p-3 text-left font-medium text-gray-700">
                      仪表
                    </th>
                    <th className="p-3 text-center font-medium text-gray-700">
                      合同状态
                    </th>
                    <th className="p-3 text-right font-medium text-gray-700">
                      上次读数
                    </th>
                    <th className="p-3 text-center font-medium text-gray-700">
                      本次抄表
                    </th>
                    <th className="p-3 text-right font-medium text-gray-700">
                      用量
                    </th>
                    <th className="p-3 text-right font-medium text-gray-700">
                      费用
                    </th>
                    <th className="p-3 text-center font-medium text-gray-700">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) =>
                    room.meters.map((meter, index) => {
                      const reading = readings[meter.id]
                      const error = validationErrors[meter.id]
                      const hasReading = reading && reading.currentReading > 0
                      const isFirstMeterInRoom = index === 0

                      return (
                        <tr
                          key={meter.id}
                          className="border-b hover:bg-gray-50"
                        >
                          {/* 房源信息 - 只在第一个仪表行显示 */}
                          <td className="p-3">
                            {isFirstMeterInRoom && (
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-xs font-medium text-blue-600">
                                  未抄
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {room.roomNumber}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {room.building.name}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* 仪表信息 */}
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getMeterTypeColor(meter.meterType)}
                                variant="secondary"
                              >
                                {getMeterTypeLabel(meter.meterType)}
                              </Badge>
                              <span className="text-sm">
                                {meter.displayName}
                              </span>
                            </div>
                          </td>

                          {/* 合同关联状态 */}
                          <td className="p-3 text-center">
                            {meter.contractId ? (
                              <Badge
                                variant="default"
                                className="bg-green-100 text-xs text-green-800"
                              >
                                已关联合同
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="bg-red-100 text-xs text-red-800"
                              >
                                未关联合同
                              </Badge>
                            )}
                          </td>

                          {/* 上次读数 */}
                          <td className="p-3 text-right">
                            <div className="font-mono text-sm">
                              {Math.round(meter.lastReading || 0)}
                            </div>
                          </td>

                          {/* 本次抄表输入 */}
                          <td className="p-3">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min={Math.round(meter.lastReading || 0)}
                                step="1"
                                placeholder="请输入"
                                className={`w-24 rounded border px-2 py-1 text-center font-mono text-sm ${
                                  error
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-300'
                                }`}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0
                                  handleReadingChange(meter.id, value)
                                }}
                              />
                            </div>
                            {error && (
                              <div className="mt-1 text-center text-xs text-red-600">
                                异常
                              </div>
                            )}
                          </td>

                          {/* 用量 */}
                          <td className="p-3 text-right">
                            {hasReading && !error ? (
                              <div className="font-mono text-sm text-blue-600">
                                {Math.round(reading.usage)}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">-</div>
                            )}
                          </td>

                          {/* 费用 */}
                          <td className="p-3 text-right">
                            {hasReading && !error ? (
                              <div className="font-mono text-sm text-green-600">
                                {reading.amount.toFixed(2)}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">-</div>
                            )}
                          </td>

                          {/* 状态 */}
                          <td className="p-3 text-center">
                            {hasReading && !error ? (
                              <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                            ) : error ? (
                              <AlertTriangle className="mx-auto h-4 w-4 text-red-500" />
                            ) : (
                              <div className="mx-auto h-4 w-4 rounded-full border border-gray-300"></div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 汇总信息 */}
        {Object.keys(readings).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">抄表汇总</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(readings).length}
                  </div>
                  <div className="text-sm text-gray-500">已录入仪表</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ¥
                    {Object.values(readings)
                      .reduce((sum, r) => sum + r.amount, 0)
                      .toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">总费用</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.values(validationErrors).filter((e) => e).length}
                  </div>
                  <div className="text-sm text-gray-500">错误数量</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {rooms.reduce((sum, r) => sum + r.meters.length, 0)}
                  </div>
                  <div className="text-sm text-gray-500">总仪表数</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
