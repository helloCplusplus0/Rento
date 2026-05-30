'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Save, X } from 'lucide-react'

import { MeterTypeIcon } from '@/components/business/MeterTypeIcon'
import { useSettings } from '@/hooks/useSettings'
import { validateMeterReadingInput } from '@/lib/meter-utils'
import { meterReadingEntryMobileStyles } from '@/components/business/meter-reading-entry-mobile-styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// 临时类型定义
interface Meter {
  id: string
  displayName: string
  meterNumber?: string
  meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  unitPrice: number
  unit: string
  lastReading?: number
  lastReadingDate?: Date
}

interface MeterReading {
  meterId: string
  currentReading: number
  readingDate: Date
  usage: number
  amount: number
  remarks?: string
}

interface SingleMeterReadingModalProps {
  contractId: string
  roomId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (readings: MeterReading[]) => void
}

/**
 * 合同抄表弹窗组件
 * 参考批量抄表设计，同时显示该合同房间的所有仪表，支持批量录入
 */
export function SingleMeterReadingModal({
  contractId,
  roomId,
  isOpen,
  onClose,
  onSuccess,
}: SingleMeterReadingModalProps) {
  const { settings } = useSettings()
  const [meters, setMeters] = useState<Meter[]>([])
  const [readings, setReadings] = useState<Record<string, MeterReading>>({})
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const [validationWarnings, setValidationWarnings] = useState<
    Record<string, string>
  >({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 加载房间仪表数据
  useEffect(() => {
    if (isOpen && roomId) {
      loadRoomMeters()
    }
  }, [isOpen, roomId])

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setReadings({})
      setValidationErrors({})
      setValidationWarnings({})
    }
  }, [isOpen])

  const loadRoomMeters = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/rooms/${roomId}/meters`)

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const activeMeters = result.data.filter(
            (meter: any) => meter.isActive
          )
          setMeters(activeMeters)
        } else {
          console.warn('获取仪表数据失败:', result)
          setMeters([])
        }
      } else {
        console.error('API调用失败:', response.status, response.statusText)
        setMeters([])
      }
    } catch (error) {
      console.error('加载仪表数据失败:', error)
      setMeters([])
    } finally {
      setLoading(false)
    }
  }

  // 处理读数变更
  const handleReadingChange = (meterId: string, currentReading: number) => {
    const meter = meters.find((m) => m.id === meterId)
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
        const newReadings = { ...prev }
        delete newReadings[meterId]
        return newReadings
      })
    }
  }

  // 处理关闭
  const handleClose = () => {
    setReadings({})
    setValidationErrors({})
    setValidationWarnings({})
    onClose()
  }

  // 提交抄表
  const handleSubmit = async () => {
    const readingsToSubmit = Object.values(readings).filter(
      (reading) => reading.currentReading > 0
    )

    if (readingsToSubmit.length === 0) {
      alert('请至少录入一个仪表读数')
      return
    }

    // 检查是否有验证错误
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

    try {
      setSubmitting(true)
      const submissionReadingDate = new Date().toISOString()
      const submissionPeriod = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`

      // 构建提交数据
      const submitData = readingsToSubmit.map((reading) => {
        const meter = meters.find((m) => m.id === reading.meterId)
        return {
          meterId: reading.meterId,
          contractId: contractId,
          previousReading: Math.round(meter?.lastReading || 0),
          currentReading: reading.currentReading,
          usage: reading.usage,
          // 同次提交固定同一个 readingDate，避免正式抄表唯一门禁失去稳定锚点。
          readingDate: submissionReadingDate,
          period: submissionPeriod,
          unitPrice: meter?.unitPrice || 0,
          amount: reading.amount,
          operator: '系统用户',
          remarks: reading.remarks || undefined,
        }
      })

      // 调用抄表API
      const response = await fetch('/api/meter-readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readings: submitData,
          aggregationMode: 'AGGREGATED', // 聚合模式
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 修复：正确访问API返回的数据结构
          const successCount =
            result.data?.results?.length || result.data?.length || 0
          let message = `✅ 成功录入 ${successCount} 个仪表读数`

          if (result.data?.warnings && result.data.warnings.length > 0) {
            message += `\n\n⚠️ 警告信息 (${result.data.warnings.length} 个):`
            result.data.warnings.forEach((warning: any, index: number) => {
              message += `\n${index + 1}. ${warning.warning}`
            })
          }

          if (result.data?.bills && result.data.bills.length > 0) {
            message += `\n\n💰 已自动生成 ${result.data.bills.length} 个水电费账单`
          }

          alert(message)

          // 调用成功回调
          onSuccess?.(readingsToSubmit)
          handleClose()
        } else {
          alert(`提交失败：${result.error || '未知错误'}`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(`提交失败：${errorData.error || '网络错误'}`)
      }
    } catch (error) {
      console.error('提交抄表失败:', error)
      alert('提交失败，请检查网络连接后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const readingsCount = Object.keys(readings).length
  const hasValidationErrors = Object.values(validationErrors).some(Boolean)
  const totalAmount = Object.values(readings).reduce(
    (sum, r) => sum + r.amount,
    0
  )
  const warningCount = Object.values(validationWarnings).filter(Boolean).length

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>合同抄表录入</span>
            {readingsCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                已录入 {readingsCount} 个仪表
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            为该合同房间的所有仪表录入当前读数，系统将自动计算用量和费用
            {settings.autoGenerateBills
              ? '，并按固定聚合策略生成账单'
              : '。当前仅保存抄表记录，不自动生成账单'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">加载仪表数据中...</div>
          </div>
        ) : meters.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>该房间暂无配置仪表</p>
            <p className="mt-2 text-sm">请先为房间配置仪表后再进行抄表</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 仪表列表 */}
            <div className="space-y-2">
              {meters.map((meter) => {
                const reading = readings[meter.id]
                const error = validationErrors[meter.id]
                const warning = validationWarnings[meter.id]
                const hasReading = reading && reading.currentReading > 0

                return (
                  <Card
                    key={meter.id}
                    className={`${meterReadingEntryMobileStyles.meterCard} ${
                      hasReading && !error
                        ? 'border-green-200 bg-green-50'
                        : error
                          ? 'border-red-200 bg-red-50'
                          : ''
                    }`}
                  >
                    <CardContent
                      className={meterReadingEntryMobileStyles.meterCardContent}
                    >
                      <div className={meterReadingEntryMobileStyles.meterCardHeader}>
                        <div className={meterReadingEntryMobileStyles.meterInfoGroup}>
                          <MeterTypeIcon meterType={meter.meterType} />
                          <div className={meterReadingEntryMobileStyles.meterIdentity}>
                            <div className={meterReadingEntryMobileStyles.meterName}>
                              {meter.displayName}
                            </div>
                            <div className={meterReadingEntryMobileStyles.meterMetaRow}>
                              {meter.meterNumber ? (
                                <span className={meterReadingEntryMobileStyles.meterMeta}>
                                  {meter.meterNumber}
                                </span>
                              ) : null}
                              <span className={meterReadingEntryMobileStyles.meterMeta}>
                                ¥{meter.unitPrice}/{meter.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {hasReading && !error ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : error ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : warning ? (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                          )}
                        </div>
                      </div>

                      <div className={meterReadingEntryMobileStyles.fieldsGrid}>
                        <div>
                          <label className={meterReadingEntryMobileStyles.fieldLabel}>
                            上次读数
                          </label>
                          <div className={meterReadingEntryMobileStyles.fieldValue}>
                            {Math.round(meter.lastReading || 0)} {meter.unit}
                          </div>
                          {meter.lastReadingDate && (
                            <div className={meterReadingEntryMobileStyles.meterMeta}>
                              {meter.lastReadingDate instanceof Date
                                ? meter.lastReadingDate.toLocaleDateString()
                                : new Date(
                                    meter.lastReadingDate
                                  ).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className={meterReadingEntryMobileStyles.fieldLabel}>
                            本次读数 *
                          </label>
                          <input
                            type="number"
                            min={Math.round(meter.lastReading || 0)}
                            step="1"
                            placeholder="请输入"
                            className={`${meterReadingEntryMobileStyles.input} ${
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

                        {hasReading && (
                          <>
                            <div>
                              <label className={meterReadingEntryMobileStyles.fieldLabel}>
                                用量
                              </label>
                              <div
                                className={meterReadingEntryMobileStyles.resultValueUsage}
                              >
                                {reading.usage.toFixed(1)} {meter.unit}
                              </div>
                            </div>

                            <div>
                              <label className={meterReadingEntryMobileStyles.fieldLabel}>
                                费用
                              </label>
                              <div
                                className={meterReadingEntryMobileStyles.resultValueAmount}
                              >
                                ¥{reading.amount.toFixed(2)}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {error && (
                        <div className={meterReadingEntryMobileStyles.errorRow}>
                          <AlertTriangle className="h-3 w-3" />
                          <span>{error}</span>
                        </div>
                      )}
                      {!error && warning && (
                        <div className={meterReadingEntryMobileStyles.warningRow}>
                          <AlertTriangle className="h-3 w-3" />
                          <span>{warning}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* 汇总信息 */}
            {readingsCount > 0 && (
              <Card className={meterReadingEntryMobileStyles.summaryCard}>
                <CardContent className={meterReadingEntryMobileStyles.summaryContent}>
                  <div className={meterReadingEntryMobileStyles.summaryRow}>
                    <div className={meterReadingEntryMobileStyles.summaryText}>
                      <span className="font-medium">抄表汇总：</span>
                      已录入 {readingsCount} 个仪表，总费用 ¥
                      {totalAmount.toFixed(2)}
                    </div>
                    <div className="text-right">
                      <div className={meterReadingEntryMobileStyles.summaryHint}>
                        {settings.autoGenerateBills
                          ? '将按固定聚合策略生成账单'
                          : '当前仅保存抄表记录'}
                      </div>
                      {warningCount > 0 && (
                        <div className="mt-1 text-xs leading-5 text-orange-600">
                          {warningCount} 条异常用量警告待确认
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                <X className="mr-1 h-4 w-4" />
                取消
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={readingsCount === 0 || submitting || hasValidationErrors}
                className="flex items-center gap-1"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    提交抄表 ({readingsCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
