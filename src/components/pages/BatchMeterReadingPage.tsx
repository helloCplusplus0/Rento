'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Save } from 'lucide-react'

import { MeterTypeIcon } from '@/components/business/MeterTypeIcon'
import { useSettings } from '@/hooks/useSettings'
import { validateMeterReadingInput } from '@/lib/meter-utils'
import { batchMeterReadingMobileStyles } from '@/components/pages/batch-meter-reading-mobile-styles'
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
  meterNumber?: string
  meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  unitPrice: number
  unit: string
  isActive: boolean
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
  const [validationWarnings, setValidationWarnings] = useState<
    Record<string, string>
  >({})
  const [aggregationMode, setAggregationMode] = useState<
    'AGGREGATED' | 'SINGLE'
  >('AGGREGATED')

  const renderDesktopStatus = (
    hasReading: boolean,
    error?: string,
    warning?: string
  ) => {
    if (hasReading && !error) {
      return (
        <>
          <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
          <div className="text-xs leading-4 text-green-600">已录入</div>
        </>
      )
    }

    if (error) {
      return (
        <>
          <AlertTriangle className="mx-auto h-4 w-4 text-red-500" />
          <div className="text-xs leading-4 text-red-600">错误</div>
        </>
      )
    }

    if (warning) {
      return (
        <>
          <AlertTriangle className="mx-auto h-4 w-4 text-orange-500" />
          <div className="text-xs leading-4 text-orange-600">警告</div>
        </>
      )
    }

    return (
      <>
        <div className="mx-auto h-4 w-4 rounded-full border border-gray-300"></div>
        <div className="text-xs leading-4 text-gray-400">待录入</div>
      </>
    )
  }

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
        // 批量抄表只展示激活中的仪表，与合同抄表弹窗保持一致。
        const roomsWithMeters = roomsData
          .map((room: any) => ({
            ...room,
            meters: (room.meters || []).filter((meter: any) => meter.isActive),
          }))
          .filter((room: any) => room.meters.length > 0)
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
    const validation = validateMeterReadingInput({
      currentReading,
      previousReading: lastReading,
      unitPrice: meter.unitPrice,
      anomalyThreshold: settings.usageAnomalyThreshold,
    })

    setValidationErrors((prev) => ({
      ...prev,
      [meterId]: validation.error || '',
    }))
    setValidationWarnings((prev) => ({
      ...prev,
      [meterId]: validation.warning || '',
    }))

    if (currentReading > 0) {
      setReadings((prev) => ({
        ...prev,
        [meterId]: {
          meterId,
          currentReading,
          readingDate: new Date(),
          usage: validation.usage,
          amount: validation.amount,
        },
      }))
    } else {
      setReadings((prev) => {
        const nextReadings = { ...prev }
        delete nextReadings[meterId]
        return nextReadings
      })
    }
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

      const activeWarnings = Object.values(validationWarnings).filter(Boolean)
      if (activeWarnings.length > 0) {
        const confirmed = confirm(
          `检测到 ${activeWarnings.length} 条异常用量警告，是否仍要提交？`
        )
        if (!confirmed) return
      }

      const readingsToSubmit = Object.values(readings)

      if (readingsToSubmit.length === 0) {
        alert('请至少录入一个仪表读数')
        return
      }

      const submissionReadingDate = new Date().toISOString()
      const submissionPeriod = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`

      // 构建完整的抄表数据
      const submitData = readingsToSubmit.map((reading) => {
        const meter = rooms
          .flatMap((r) => r.meters)
          .find((m) => m.id === reading.meterId)

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
          // 聚合模式下同次提交共用同一个业务时间戳，保证正式抄表精确门禁稳定。
          readingDate: submissionReadingDate,
          period: submissionPeriod,
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
        const submissionResult = result.data
        const successCount = submissionResult?.results?.length || 0

        // 显示详细的成功信息
        let message = `✅ 成功录入 ${successCount} 个仪表读数`

        // 显示详细的警告信息
        if (submissionResult?.warnings && submissionResult.warnings.length > 0) {
          message += `\n\n⚠️ 警告信息 (${submissionResult.warnings.length} 个):`
          submissionResult.warnings.forEach((warning: any, index: number) => {
            message += `\n${index + 1}. ${warning.warning}`
          })
        }

        // 显示详细的错误信息
        if (submissionResult?.errors && submissionResult.errors.length > 0) {
          message += `\n\n❌ 错误信息 (${submissionResult.errors.length} 个):`
          submissionResult.errors.forEach((error: any, index: number) => {
            message += `\n${index + 1}. ${error.error}`
          })
        }

        if (submissionResult?.bills && submissionResult.bills.length > 0) {
          message += `\n\n💰 已自动生成 ${submissionResult.bills.length} 个水电费账单`
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
    }
  }

  const readingsCount = Object.keys(readings).length
  const hasValidationErrors = Object.values(validationErrors).some(Boolean)
  const warningCount = Object.values(validationWarnings).filter(Boolean).length
  const totalMeterCount = rooms.reduce((sum, room) => sum + room.meters.length, 0)
  const canChooseAggregation = settings.autoGenerateBills
  const currentModeHint = !settings.autoGenerateBills
    ? '当前未启用自动账单生成，本页提交后只保存抄表记录。'
    : aggregationMode === 'AGGREGATED'
      ? '同一房间的多个仪表将生成一个聚合账单，便于统一管理。'
      : '每个仪表将生成独立账单，便于逐表追踪费用。'

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
    <PageContainer title="批量抄表" showBackButton>
      <div className={batchMeterReadingMobileStyles.pageSection}>
        <Card className={batchMeterReadingMobileStyles.noteCard}>
          <CardContent className={batchMeterReadingMobileStyles.noteContent}>
            <div className={batchMeterReadingMobileStyles.noteRow}>
              <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-500" />
              <div>
                <p className={batchMeterReadingMobileStyles.noteTitle}>
                  批量抄表说明
                </p>
                <ul className={batchMeterReadingMobileStyles.noteList}>
                  <li>• 请按实际仪表读数录入，系统会自动计算用量和费用。</li>
                  <li>• 本次读数不能小于上次读数。</li>
                  <li>• 用量异常偏高时会给出警告，需确认后方可继续提交。</li>
                  <li>• 仅展示激活中的仪表，禁用仪表不会参与批量抄表。</li>
                  <li>
                    •{' '}
                    {settings.autoGenerateBills
                      ? '提交后会按当前账单策略自动生成水电费账单。'
                      : '当前关闭自动账单生成，提交后只保存抄表记录。'}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={batchMeterReadingMobileStyles.strategyCard}>
          <CardHeader className={batchMeterReadingMobileStyles.strategyHeader}>
            <div className={batchMeterReadingMobileStyles.cardHeaderRow}>
              <CardTitle className={batchMeterReadingMobileStyles.cardTitle}>
                账单生成策略
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className={batchMeterReadingMobileStyles.strategyContent}>
            {canChooseAggregation ? (
              <>
                <div className={batchMeterReadingMobileStyles.strategyRow}>
                  <div className={batchMeterReadingMobileStyles.strategyMeta}>
                    <p className={batchMeterReadingMobileStyles.strategyLabel}>
                      选择抄表后的账单生成方式
                    </p>
                    <p className={batchMeterReadingMobileStyles.strategyHint}>
                      该设置影响本次提交生成的水电账单形态。
                    </p>
                  </div>
                  <div className={batchMeterReadingMobileStyles.strategyActions}>
                    <Button
                      type="button"
                      variant={
                        aggregationMode === 'AGGREGATED' ? 'default' : 'outline'
                      }
                      onClick={() => setAggregationMode('AGGREGATED')}
                      className={batchMeterReadingMobileStyles.strategyButton}
                    >
                      聚合账单
                    </Button>
                    <Button
                      type="button"
                      variant={aggregationMode === 'SINGLE' ? 'default' : 'outline'}
                      onClick={() => setAggregationMode('SINGLE')}
                      className={batchMeterReadingMobileStyles.strategyButton}
                    >
                      独立账单
                    </Button>
                  </div>
                </div>
                <div className={batchMeterReadingMobileStyles.strategyFootnote}>
                  {currentModeHint}
                </div>
              </>
            ) : (
              <div className={batchMeterReadingMobileStyles.strategyInfoBox}>
                <p className={batchMeterReadingMobileStyles.strategyInfoText}>
                  {currentModeHint}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={batchMeterReadingMobileStyles.readingCard}>
          <CardHeader className={batchMeterReadingMobileStyles.readingHeader}>
            <CardTitle className={batchMeterReadingMobileStyles.readingTitleRow}>
              <span>抄表录入</span>
              <div className={batchMeterReadingMobileStyles.readingCountText}>
                共 {totalMeterCount} 个激活仪表
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className={batchMeterReadingMobileStyles.readingContent}>
            {/* 移动端卡片式布局 */}
            <div className={batchMeterReadingMobileStyles.mobileList}>
              {rooms.map((room) =>
                room.meters.map((meter, index) => {
                  const reading = readings[meter.id]
                  const error = validationErrors[meter.id]
                  const warning = validationWarnings[meter.id]
                  const hasReading = Boolean(reading)

                  return (
                    <div
                      key={meter.id}
                      className={batchMeterReadingMobileStyles.mobileItem}
                    >
                      <div className={batchMeterReadingMobileStyles.mobileItemHeader}>
                        <div>
                          <div className={batchMeterReadingMobileStyles.mobileRoomTitle}>
                            {room.roomNumber} - {room.building.name}
                          </div>
                          <div className={batchMeterReadingMobileStyles.mobileMetaRow}>
                            <div className={batchMeterReadingMobileStyles.meterInfoGroup}>
                              <MeterTypeIcon meterType={meter.meterType} />
                              <div className={batchMeterReadingMobileStyles.meterIdentity}>
                                <div
                                  className={
                                    batchMeterReadingMobileStyles.mobileMeterName
                                  }
                                >
                                  {meter.displayName}
                                </div>
                                {meter.meterNumber ? (
                                  <div
                                    className={
                                      batchMeterReadingMobileStyles.meterMetaRow
                                    }
                                  >
                                    <span
                                      className={
                                        batchMeterReadingMobileStyles.mobileContractMeta
                                      }
                                    >
                                      {meter.meterNumber}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            {meter.contractId ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="default"
                                  className="bg-green-100 text-xs text-green-800"
                                >
                                  已关联合同
                                </Badge>
                                {meter.contractNumber && (
                                  <span
                                    className={
                                      batchMeterReadingMobileStyles.mobileContractMeta
                                    }
                                  >
                                    {meter.contractNumber}
                                  </span>
                                )}
                                {meter.renterName && (
                                  <span
                                    className={
                                      batchMeterReadingMobileStyles.mobileContractMeta
                                    }
                                  >
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
                          ) : warning ? (
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border border-gray-300"></div>
                          )}
                        </div>
                      </div>

                      <div className={batchMeterReadingMobileStyles.mobileFieldsGrid}>
                        <div>
                          <label className={batchMeterReadingMobileStyles.mobileFieldLabel}>
                            上次读数
                          </label>
                          <div className={batchMeterReadingMobileStyles.mobileFieldValue}>
                            {Math.round(meter.lastReading || 0)} {meter.unit}
                          </div>
                        </div>
                        <div>
                          <label className={batchMeterReadingMobileStyles.mobileFieldLabel}>
                            本次抄表
                          </label>
                          <input
                            type="number"
                            min={Math.round(meter.lastReading || 0)}
                            step="1"
                            placeholder="请输入"
                            className={`${batchMeterReadingMobileStyles.mobileInput} ${
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
                            <div className={batchMeterReadingMobileStyles.fieldError}>{error}</div>
                          )}
                          {!error && warning && (
                            <div className={batchMeterReadingMobileStyles.fieldWarning}>
                              {warning}
                            </div>
                          )}
                        </div>
                      </div>

                      {hasReading && !error && (
                        <div className={batchMeterReadingMobileStyles.mobileResultGrid}>
                          <div>
                            <label className={batchMeterReadingMobileStyles.mobileFieldLabel}>
                              用量
                            </label>
                            <div className={batchMeterReadingMobileStyles.resultValueUsage}>
                              {Math.round(reading.usage)} {meter.unit}
                            </div>
                          </div>
                          <div>
                            <label className={batchMeterReadingMobileStyles.mobileFieldLabel}>
                              费用
                            </label>
                            <div className={batchMeterReadingMobileStyles.resultValueAmount}>
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
            <div className={batchMeterReadingMobileStyles.desktopTableWrap}>
              <table className="w-full">
                <thead className={batchMeterReadingMobileStyles.desktopTableHead}>
                  <tr>
                    <th className={batchMeterReadingMobileStyles.desktopTableHeadCell}>房源</th>
                    <th className={batchMeterReadingMobileStyles.desktopTableHeadCell}>仪表</th>
                    <th className={batchMeterReadingMobileStyles.desktopTableHeadCell}>
                      合同状态
                    </th>
                    <th className={batchMeterReadingMobileStyles.desktopTableHeadCellRight}>
                      上次读数
                    </th>
                    <th className={batchMeterReadingMobileStyles.desktopTableHeadCellCenter}>
                      本次抄表
                    </th>
                    <th className={batchMeterReadingMobileStyles.desktopTableHeadCellRight}>
                      用量
                    </th>
                    <th className={batchMeterReadingMobileStyles.desktopTableHeadCellRight}>
                      费用
                    </th>
                    <th className={batchMeterReadingMobileStyles.desktopTableHeadCellCenter}>
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) =>
                    room.meters.map((meter, index) => {
                      const reading = readings[meter.id]
                      const error = validationErrors[meter.id]
                      const warning = validationWarnings[meter.id]
                      const hasReading = Boolean(reading)
                      const isFirstMeterInRoom = index === 0

                      return (
                        <tr
                          key={meter.id}
                          className={batchMeterReadingMobileStyles.desktopRow}
                        >
                          <td className={batchMeterReadingMobileStyles.desktopCell}>
                            {isFirstMeterInRoom && (
                              <div className={batchMeterReadingMobileStyles.desktopRoomCell}>
                                <div
                                  className={
                                    batchMeterReadingMobileStyles.desktopRoomBadge
                                  }
                                >
                                  未抄
                                </div>
                                <div>
                                  <div
                                    className={
                                      batchMeterReadingMobileStyles.desktopRoomNumber
                                    }
                                  >
                                    {room.roomNumber}
                                  </div>
                                  <div
                                    className={
                                      batchMeterReadingMobileStyles.desktopRoomMeta
                                    }
                                  >
                                    {room.building.name}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          <td className={batchMeterReadingMobileStyles.desktopCell}>
                            <div className={batchMeterReadingMobileStyles.desktopMeterWrap}>
                              <MeterTypeIcon meterType={meter.meterType} />
                              <div className="min-w-0">
                                <div
                                  className={
                                    batchMeterReadingMobileStyles.desktopMeterName
                                  }
                                >
                                  {meter.displayName}
                                </div>
                                {meter.meterNumber ? (
                                  <div
                                    className={
                                      batchMeterReadingMobileStyles.desktopRoomMeta
                                    }
                                  >
                                    {meter.meterNumber}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className={batchMeterReadingMobileStyles.desktopCell}>
                            {meter.contractId ? (
                              <div className="space-y-1">
                                <Badge
                                  variant="default"
                                  className="bg-green-100 text-xs text-green-800"
                                >
                                  已关联合同
                                </Badge>
                                {(meter.contractNumber || meter.renterName) && (
                                  <div className="space-y-0.5">
                                    {meter.contractNumber ? (
                                      <div
                                        className={
                                          batchMeterReadingMobileStyles.desktopRoomMeta
                                        }
                                      >
                                        合同：{meter.contractNumber}
                                      </div>
                                    ) : null}
                                    {meter.renterName ? (
                                      <div
                                        className={
                                          batchMeterReadingMobileStyles.desktopRoomMeta
                                        }
                                      >
                                        租客：{meter.renterName}
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Badge
                                  variant="destructive"
                                  className="bg-red-100 text-xs text-red-800"
                                >
                                  未关联合同
                                </Badge>
                                <div
                                  className={
                                    batchMeterReadingMobileStyles.desktopRoomMeta
                                  }
                                >
                                  本次抄表不会自动关联合同
                                </div>
                              </div>
                            )}
                          </td>

                          <td className={batchMeterReadingMobileStyles.desktopCellRight}>
                            <div className={batchMeterReadingMobileStyles.mobileFieldValue}>
                              {Math.round(meter.lastReading || 0)}
                            </div>
                          </td>

                          <td className={batchMeterReadingMobileStyles.desktopCellCenter}>
                            <div className={batchMeterReadingMobileStyles.desktopInputWrap}>
                              <input
                                type="number"
                                min={Math.round(meter.lastReading || 0)}
                                step="1"
                                placeholder="请输入"
                                className={`${batchMeterReadingMobileStyles.desktopInput} ${
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
                              <div className={`${batchMeterReadingMobileStyles.fieldError} text-center`}>
                                {error}
                              </div>
                            )}
                            {!error && warning && (
                              <div
                                className={`${batchMeterReadingMobileStyles.fieldWarning} text-center`}
                              >
                                {warning}
                              </div>
                            )}
                          </td>

                          <td className={batchMeterReadingMobileStyles.desktopCellRight}>
                            {hasReading && !error ? (
                              <div className={batchMeterReadingMobileStyles.resultValueUsage}>
                                {Math.round(reading.usage)}
                              </div>
                            ) : (
                              <div className={batchMeterReadingMobileStyles.desktopMuted}>-</div>
                            )}
                          </td>

                          <td className={batchMeterReadingMobileStyles.desktopCellRight}>
                            {hasReading && !error ? (
                              <div className={batchMeterReadingMobileStyles.resultValueAmount}>
                                {reading.amount.toFixed(2)}
                              </div>
                            ) : (
                              <div className={batchMeterReadingMobileStyles.desktopMuted}>-</div>
                            )}
                          </td>

                          <td className={batchMeterReadingMobileStyles.desktopCellCenter}>
                            <div className="space-y-1 text-center">
                              {renderDesktopStatus(hasReading, error, warning)}
                            </div>
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

        {Object.keys(readings).length > 0 && (
          <Card className={batchMeterReadingMobileStyles.card}>
            <CardHeader className={batchMeterReadingMobileStyles.cardHeader}>
              <CardTitle className={batchMeterReadingMobileStyles.cardTitle}>
                抄表汇总
              </CardTitle>
            </CardHeader>
            <CardContent className={batchMeterReadingMobileStyles.cardContent}>
              <div className={batchMeterReadingMobileStyles.summaryCard}>
                <div className={batchMeterReadingMobileStyles.summaryMetaRow}>
                  <div className={batchMeterReadingMobileStyles.summaryMetaBlock}>
                    <div className="text-lg font-semibold leading-5 text-blue-600 sm:text-xl">
                      {readingsCount}
                    </div>
                    <div className={batchMeterReadingMobileStyles.summaryMetaLabel}>
                      已录入仪表
                    </div>
                  </div>
                  <div className={batchMeterReadingMobileStyles.summaryMetaBlock}>
                    <div className="text-lg font-semibold leading-5 text-green-600 sm:text-xl">
                      ¥
                      {Object.values(readings)
                        .reduce((sum, r) => sum + r.amount, 0)
                        .toFixed(2)}
                    </div>
                    <div className={batchMeterReadingMobileStyles.summaryMetaLabel}>
                      总费用
                    </div>
                  </div>
                  <div className={batchMeterReadingMobileStyles.summaryMetaBlock}>
                    <div className="text-lg font-semibold leading-5 text-orange-600 sm:text-xl">
                      {Object.values(validationErrors).filter((e) => e).length}
                    </div>
                    <div className={batchMeterReadingMobileStyles.summaryMetaLabel}>
                      错误数量
                    </div>
                  </div>
                  <div className={batchMeterReadingMobileStyles.summaryMetaBlock}>
                    <div className="text-lg font-semibold leading-5 text-amber-600 sm:text-xl">
                      {warningCount}
                    </div>
                    <div className={batchMeterReadingMobileStyles.summaryMetaLabel}>
                      警告数量
                    </div>
                  </div>
                  <div className={batchMeterReadingMobileStyles.summaryMetaBlock}>
                    <div className="text-lg font-semibold leading-5 text-purple-600 sm:text-xl">
                      {totalMeterCount}
                    </div>
                    <div className={batchMeterReadingMobileStyles.summaryMetaLabel}>
                      总仪表数
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm leading-5 text-gray-600">
                  {settings.autoGenerateBills
                    ? `提交后将按“${aggregationMode === 'AGGREGATED' ? '聚合账单' : '独立账单'}”策略自动生成账单。`
                    : '提交后将保存本次抄表记录，账单需后续手动生成。'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={batchMeterReadingMobileStyles.actionRow}>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || readingsCount === 0 || hasValidationErrors}
            className={batchMeterReadingMobileStyles.actionButton}
            data-submit-button="true"
          >
            <Save className="h-4 w-4" />
            {submitting ? '提交中...' : `提交抄表${readingsCount > 0 ? ` (${readingsCount})` : ''}`}
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}
