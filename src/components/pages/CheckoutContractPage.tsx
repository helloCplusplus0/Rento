'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Calculator,
  FileText,
} from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/format'
import {
  formatClientApiError,
  readClientApiError,
} from '@/lib/client-api-error'
import { cn } from '@/lib/utils'
import type { ContractWithDetailsForClient } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  applyCheckoutSettlementSubmission,
  calculateCheckoutSettlement,
  createCheckoutSettlementSubmissionItems,
  type CheckoutSettlementLineItem,
} from '@/lib/checkout-settlement'
import {
  checkoutContractMobileStyles,
  checkoutSettlementToneStyles,
} from './checkout-contract-mobile-styles'
import {
  goBackWithHost,
  navigateWithHost,
  type PageHostNavigation,
} from './page-host-navigation'

type CheckoutContractWithMeters = ContractWithDetailsForClient & {
  room: ContractWithDetailsForClient['room'] & {
    meters: Array<{
      id: string
      meterNumber: string
      displayName: string
      meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
      unitPrice: number
      unit: string
      location: string | null
      latestReading: number | null
    }>
  }
}

interface CheckoutContractPageProps {
  contract: CheckoutContractWithMeters
  navigation?: PageHostNavigation
}

interface SettlementAdjustmentDraft {
  adjustedAmount: number
  adjustmentReason: string
}

const METER_TYPE_LABELS = {
  ELECTRICITY: '电表',
  COLD_WATER: '冷水表',
  HOT_WATER: '热水表',
  GAS: '燃气表',
} as const

export function CheckoutContractPage({
  contract,
  navigation,
}: CheckoutContractPageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settlementAdjustments, setSettlementAdjustments] = useState<
    Record<string, SettlementAdjustmentDraft>
  >({})

  // 表单数据
  const [formData, setFormData] = useState({
    checkoutDate: new Date().toISOString().split('T')[0],
    checkoutReason: '',
    damageAssessment: 0,
    finalMeterReadings: {} as Record<string, number>, // 最终抄表读数
    remarks: '',
  })

  const settlement = useMemo(() => {
    if (!formData.checkoutDate) {
      return null
    }

    return calculateCheckoutSettlement(contract, {
      checkoutDate: formData.checkoutDate,
      damageAssessment: formData.damageAssessment,
    })
  }, [contract, formData.checkoutDate, formData.damageAssessment])

  useEffect(() => {
    if (!settlement) {
      setSettlementAdjustments({})
      return
    }

    setSettlementAdjustments((prev) => {
      const next: Record<string, SettlementAdjustmentDraft> = {}

      for (const item of [
        ...settlement.lineItems.refund,
        ...settlement.lineItems.charge,
      ]) {
        if (!item.editable) {
          continue
        }

        next[item.id] = {
          adjustedAmount:
            prev[item.id]?.adjustedAmount ?? item.originalAmount,
          adjustmentReason: prev[item.id]?.adjustmentReason ?? '',
        }
      }

      return next
    })
  }, [settlement])

  const finalSettlement = useMemo(() => {
    if (!settlement) {
      return null
    }

    const submissionItems = createCheckoutSettlementSubmissionItems(
      settlement,
      Object.fromEntries(
        Object.entries(settlementAdjustments).map(([itemId, adjustment]) => [
          itemId,
          {
            adjustedAmount: adjustment.adjustedAmount,
            adjustmentReason: adjustment.adjustmentReason,
          },
        ])
      )
    )

    return applyCheckoutSettlementSubmission(settlement, submissionItems, {
      requireReasonForAdjusted: false,
    })
  }, [settlement, settlementAdjustments])

  const roomMeters = contract.room.meters || []

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setError(null)
  }

  const handleSettlementAmountChange = (
    item: CheckoutSettlementLineItem,
    value: string
  ) => {
    const parsed = Number.parseFloat(value)
    const nextAmount = Number.isFinite(parsed)
      ? Math.min(
          item.maxAdjustableAmount,
          Math.max(item.minAdjustableAmount, parsed)
        )
      : item.minAdjustableAmount

    setSettlementAdjustments((prev) => ({
      ...prev,
      [item.id]: {
        adjustedAmount: Number(nextAmount.toFixed(2)),
        adjustmentReason: prev[item.id]?.adjustmentReason ?? '',
      },
    }))
    setError(null)
  }

  const handleSettlementReasonChange = (itemId: string, value: string) => {
    setSettlementAdjustments((prev) => ({
      ...prev,
      [itemId]: {
        adjustedAmount: prev[itemId]?.adjustedAmount ?? 0,
        adjustmentReason: value,
      },
    }))
    setError(null)
  }

  const handleFinalMeterReadingChange = (meterId: string, value: string) => {
    const trimmedValue = value.trim()

    setFormData((prev) => {
      if (!trimmedValue) {
        const { [meterId]: _removed, ...restReadings } = prev.finalMeterReadings
        return {
          ...prev,
          finalMeterReadings: restReadings,
        }
      }

      const parsed = Number.parseFloat(trimmedValue)
      if (!Number.isFinite(parsed)) {
        return prev
      }

      return {
        ...prev,
        finalMeterReadings: {
          ...prev.finalMeterReadings,
          [meterId]: parsed,
        },
      }
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 基础验证
    if (!formData.checkoutDate || !formData.checkoutReason.trim()) {
      setError('请填写退租日期和退租原因')
      return
    }

    const checkoutDate = new Date(formData.checkoutDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (checkoutDate < today) {
      setError('退租日期不能早于当前日期')
      return
    }

    if (checkoutDate > new Date(contract.endDate)) {
      setError('退租日期不能晚于合同结束日期')
      return
    }

    if (!settlement || !finalSettlement) {
      setError('当前结算预览尚未生成，请稍后重试')
      return
    }

    if (roomMeters.length > 0) {
      const missingMeters = roomMeters.filter(
        (meter) => formData.finalMeterReadings[meter.id] === undefined
      )
      if (missingMeters.length > 0) {
        setError(
          `请填写以下仪表的最终读数：${missingMeters
            .map((meter) => meter.displayName)
            .join('、')}`
        )
        return
      }

      const invalidMeter = roomMeters.find((meter) => {
        const finalReading = formData.finalMeterReadings[meter.id]

        if (!Number.isFinite(finalReading) || finalReading < 0) {
          return true
        }

        return (
          meter.latestReading !== null &&
          finalReading < meter.latestReading
        )
      })

      if (invalidMeter) {
        const latestReadingLabel =
          invalidMeter.latestReading !== null
            ? `，且不能小于最近读数 ${invalidMeter.latestReading}`
            : ''
        setError(`仪表“${invalidMeter.displayName}”的最终读数无效${latestReadingLabel}`)
        return
      }
    }

    let validatedSettlement
    try {
      validatedSettlement = applyCheckoutSettlementSubmission(
        settlement,
        createCheckoutSettlementSubmissionItems(
          settlement,
          Object.fromEntries(
            Object.entries(settlementAdjustments).map(([itemId, adjustment]) => [
              itemId,
              {
                adjustedAmount: adjustment.adjustedAmount,
                adjustmentReason: adjustment.adjustmentReason,
              },
            ])
          )
        ),
        {
          requireReasonForAdjusted: true,
        }
      )
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : '正式结算明细校验失败'
      )
      return
    }

    setLoading(true)
    setError(null)

    try {
      const finalMeterReadingsPayload = Object.fromEntries(
        roomMeters
          .filter((meter) => formData.finalMeterReadings[meter.id] !== undefined)
          .map((meter) => [meter.id, formData.finalMeterReadings[meter.id]])
      )

      const response = await fetch(`/api/contracts/${contract.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          finalMeterReadings: finalMeterReadingsPayload,
          settlementItems: validatedSettlement.submissionItems,
        }),
      })

      if (!response.ok) {
        const apiError = await readClientApiError(response, '退租失败')
        throw new Error(
          formatClientApiError(apiError, {
            defaultTitle: '退租失败',
            includeCode: true,
          })
        )
      }

      // 退租成功后直接替换当前路由，避免在成功态重渲染与页面跳转并发时触发
      // App Router 的 RSC 请求中断噪音。
      navigateWithHost(navigation, `/contracts/${contract.id}`, {
        replace: true,
      })
    } catch (error) {
      console.error('退租失败:', error)
      setError(error instanceof Error ? error.message : '退租失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const contractSummaryItems = [
    {
      key: 'room',
      label: '房间',
      value: `${contract.room.building.name} - ${contract.room.roomNumber}`,
      valueClassName: checkoutContractMobileStyles.fieldValue,
      className: undefined,
    },
    {
      key: 'renter',
      label: '租客',
      value: contract.renter.name,
      valueClassName: checkoutContractMobileStyles.fieldValue,
      className: undefined,
    },
    {
      key: 'period',
      label: '合同期限',
      value: `${formatDate(contract.startDate)} 至 ${formatDate(contract.endDate)}`,
      valueClassName: checkoutContractMobileStyles.fieldValue,
      className: checkoutContractMobileStyles.contractSummaryWideItem,
    },
    {
      key: 'monthlyRent',
      label: '月租金',
      value: formatCurrency(contract.monthlyRent),
      valueClassName: checkoutContractMobileStyles.fieldValueAccent,
      className: undefined,
    },
  ] as const

  return (
    <PageContainer title="退租合同" showBackButton>
      <div className={checkoutContractMobileStyles.pageSection}>
        {/* 原合同信息展示 */}
        <Card className={checkoutContractMobileStyles.card}>
          <CardHeader className={checkoutContractMobileStyles.cardHeader}>
            <CardTitle className={checkoutContractMobileStyles.cardTitle}>
              <FileText className={checkoutContractMobileStyles.titleIcon} />
              合同信息
            </CardTitle>
          </CardHeader>
          <CardContent className={checkoutContractMobileStyles.cardContent}>
            <div className={checkoutContractMobileStyles.contractSummaryGrid}>
              {contractSummaryItems.map((item) => (
                <div
                  key={item.key}
                  className={cn(
                    checkoutContractMobileStyles.contractSummaryItem,
                    item.className
                  )}
                >
                  <span className={checkoutContractMobileStyles.fieldLabel}>
                    {item.label}
                  </span>
                  <span className={item.valueClassName}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 退租表单 */}
        <Card className={checkoutContractMobileStyles.card}>
          <CardHeader className={checkoutContractMobileStyles.cardHeader}>
            <CardTitle className={checkoutContractMobileStyles.cardTitle}>
              退租信息
            </CardTitle>
          </CardHeader>
          <CardContent className={checkoutContractMobileStyles.cardContent}>
            <form
              onSubmit={handleSubmit}
              className={checkoutContractMobileStyles.formStack}
            >
              <div className={checkoutContractMobileStyles.formGrid}>
                <div className={checkoutContractMobileStyles.formField}>
                  <Label
                    htmlFor="checkoutDate"
                    className={checkoutContractMobileStyles.formLabel}
                  >
                    退租日期 *
                  </Label>
                  <Input
                    id="checkoutDate"
                    type="date"
                    value={formData.checkoutDate}
                    onChange={(e) =>
                      handleInputChange('checkoutDate', e.target.value)
                    }
                    disabled={loading}
                    className={checkoutContractMobileStyles.input}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(contract.endDate).toISOString().split('T')[0]}
                  />
                </div>
                <div className={checkoutContractMobileStyles.formField}>
                  <Label
                    htmlFor="damageAssessment"
                    className={checkoutContractMobileStyles.formLabel}
                  >
                    损坏赔偿金额
                  </Label>
                  <Input
                    id="damageAssessment"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.damageAssessment}
                    onChange={(e) =>
                      handleInputChange(
                        'damageAssessment',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={loading}
                    className={checkoutContractMobileStyles.input}
                    placeholder="0.00"
                  />
                  <p className={checkoutContractMobileStyles.helperText}>
                    房屋损坏需要赔偿的金额
                  </p>
                </div>
              </div>

              <div className={checkoutContractMobileStyles.formField}>
                <Label
                  htmlFor="checkoutReason"
                  className={checkoutContractMobileStyles.formLabel}
                >
                  退租原因 *
                </Label>
                <Textarea
                  id="checkoutReason"
                  value={formData.checkoutReason}
                  onChange={(e) =>
                    handleInputChange('checkoutReason', e.target.value)
                  }
                  disabled={loading}
                  className={checkoutContractMobileStyles.textarea}
                  placeholder="请填写退租原因..."
                  rows={3}
                />
              </div>

              <div className={checkoutContractMobileStyles.formField}>
                <Label
                  htmlFor="remarks"
                  className={checkoutContractMobileStyles.formLabel}
                >
                  备注
                </Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  disabled={loading}
                  className={checkoutContractMobileStyles.textarea}
                  placeholder="其他需要说明的事项..."
                  rows={2}
                />
              </div>

              {roomMeters.length > 0 && (
                <div className={checkoutContractMobileStyles.formField}>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className={checkoutContractMobileStyles.formLabel}>
                        最终抄表读数 *
                      </Label>
                      <p className={checkoutContractMobileStyles.helperText}>
                        退租提交会为每个在用仪表写入 `CHECKOUT_FINAL` 终抄记录，并按实际用量进入结算。
                      </p>
                    </div>
                    <div className="space-y-3">
                      {roomMeters.map((meter) => (
                        <div
                          key={meter.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {meter.displayName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {METER_TYPE_LABELS[meter.meterType]} · {meter.meterNumber}
                                {meter.location ? ` · ${meter.location}` : ''}
                              </p>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                              <p>单价 ¥{meter.unitPrice}/{meter.unit}</p>
                              <p>
                                最近读数：
                                {meter.latestReading !== null
                                  ? `${meter.latestReading} ${meter.unit}`
                                  : '暂无历史'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Input
                              id={`final-meter-reading-${meter.id}`}
                              type="number"
                              min={
                                meter.latestReading !== null
                                  ? String(meter.latestReading)
                                  : '0'
                              }
                              step="0.01"
                              value={formData.finalMeterReadings[meter.id] ?? ''}
                              onChange={(event) =>
                                handleFinalMeterReadingChange(
                                  meter.id,
                                  event.target.value
                                )
                              }
                              disabled={loading}
                              className={checkoutContractMobileStyles.input}
                              placeholder="请输入最终读数"
                            />
                            <span className="min-w-10 text-sm text-slate-500">
                              {meter.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className={checkoutContractMobileStyles.errorAlert}>
                  <AlertCircle className={checkoutContractMobileStyles.errorIcon} />
                  <span className={checkoutContractMobileStyles.errorText}>
                    {error}
                  </span>
                </div>
              )}

              {/* 结算预览 */}
              {finalSettlement && (
                <div className={checkoutContractMobileStyles.previewSection}>
                  <Separator />
                  <h3 className={checkoutContractMobileStyles.previewTitle}>
                    <Calculator
                      className={checkoutContractMobileStyles.previewTitleIcon}
                    />
                    结算预览
                  </h3>

                  <div className={checkoutContractMobileStyles.previewGrid}>
                    {/* 应退项目 */}
                    <div
                      className={cn(
                        checkoutContractMobileStyles.previewPanel,
                        checkoutSettlementToneStyles.refund.panel
                      )}
                    >
                      <h4
                        className={cn(
                          checkoutContractMobileStyles.previewPanelTitle,
                          checkoutSettlementToneStyles.refund.title
                        )}
                      >
                        应退项目
                      </h4>
                      <div className={checkoutContractMobileStyles.previewList}>
                        {finalSettlement.lineItems.refund.length === 0 && (
                          <div className={checkoutContractMobileStyles.emptyState}>
                            暂无应退项目
                          </div>
                        )}
                        {finalSettlement.lineItems.refund.map((item) => (
                          <div
                            key={item.id}
                            className={checkoutContractMobileStyles.previewItem}
                          >
                            <div
                              className={
                                checkoutContractMobileStyles.previewItemHeader
                              }
                            >
                              <div
                                className={
                                  checkoutContractMobileStyles.previewItemHeading
                                }
                              >
                                <span
                                  className={
                                    checkoutContractMobileStyles.previewItemName
                                  }
                                >
                                  {item.name}
                                </span>
                                {item.editable ? (
                                  <Badge
                                    className={
                                      checkoutContractMobileStyles.editableBadge
                                    }
                                  >
                                    可受限编辑
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">系统计算项</Badge>
                                )}
                              </div>
                              <span
                                className={cn(
                                  checkoutContractMobileStyles.previewItemAmount,
                                  checkoutSettlementToneStyles.refund.amount
                                )}
                              >
                                {formatCurrency(item.adjustedAmount)}
                              </span>
                            </div>
                            <div
                              className={checkoutContractMobileStyles.formulaBox}
                            >
                              <span className={checkoutContractMobileStyles.formulaLabel}>
                                计算公式：
                              </span>
                              {item.formula}
                            </div>
                            {item.editable ? (
                              <div
                                className={checkoutContractMobileStyles.editableBox}
                              >
                                <div className={checkoutContractMobileStyles.formField}>
                                  <Label
                                    htmlFor={`adjustedRefundAmount-${item.id}`}
                                    className={
                                      checkoutContractMobileStyles.formLabel
                                    }
                                  >
                                    本次纳入退租结算金额
                                  </Label>
                                  <Input
                                    id={`adjustedRefundAmount-${item.id}`}
                                    type="number"
                                    min={item.minAdjustableAmount}
                                    max={item.maxAdjustableAmount}
                                    step="0.01"
                                    value={
                                      settlementAdjustments[item.id]?.adjustedAmount ??
                                      item.originalAmount
                                    }
                                    onChange={(event) =>
                                      handleSettlementAmountChange(item, event.target.value)
                                    }
                                    disabled={loading}
                                    className={checkoutContractMobileStyles.input}
                                  />
                                  <p
                                    className={
                                      checkoutContractMobileStyles.rangeText
                                    }
                                  >
                                    允许范围：{formatCurrency(item.minAdjustableAmount)} ~{' '}
                                    {formatCurrency(item.maxAdjustableAmount)}
                                  </p>
                                </div>
                                <div
                                  className={
                                    checkoutContractMobileStyles.compactReasonField
                                  }
                                >
                                  <Label
                                    htmlFor={`refundAdjustmentReason-${item.id}`}
                                    className={
                                      checkoutContractMobileStyles.compactReasonLabel
                                    }
                                  >
                                    调整原因
                                  </Label>
                                  <Textarea
                                    id={`refundAdjustmentReason-${item.id}`}
                                    value={
                                      settlementAdjustments[item.id]?.adjustmentReason ?? ''
                                    }
                                    onChange={(event) =>
                                      handleSettlementReasonChange(
                                        item.id,
                                        event.target.value
                                      )
                                    }
                                    disabled={loading}
                                    className={
                                      checkoutContractMobileStyles.compactReasonTextarea
                                    }
                                    placeholder="如与原始应退金额不同，请填写调整原因"
                                    rows={2}
                                  />
                                  {item.isAdjusted &&
                                    !settlementAdjustments[item.id]?.adjustmentReason.trim() && (
                                      <p
                                        className={
                                          checkoutContractMobileStyles.adjustedError
                                        }
                                      >
                                        已调整金额时，提交前必须填写调整原因
                                      </p>
                                    )}
                                </div>
                                {item.isAdjusted && (
                                  <div
                                    className={
                                      checkoutContractMobileStyles.adjustedText
                                    }
                                  >
                                    原始金额 {formatCurrency(item.originalAmount)}，当前结算金额{' '}
                                    {formatCurrency(item.adjustedAmount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              item.lockedReason && (
                                <div
                                  className={checkoutContractMobileStyles.lockedText}
                                >
                                  {item.lockedReason}
                                </div>
                              )
                            )}
                          </div>
                        ))}

                        <div className={checkoutContractMobileStyles.subtotalRow}>
                          <div
                            className={checkoutContractMobileStyles.subtotalInner}
                          >
                            <span>应退小计</span>
                            <span className={checkoutSettlementToneStyles.refund.subtotal}>
                              {formatCurrency(finalSettlement.refundItems.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 应收项目 */}
                    <div
                      className={cn(
                        checkoutContractMobileStyles.previewPanel,
                        checkoutSettlementToneStyles.charge.panel
                      )}
                    >
                      <h4
                        className={cn(
                          checkoutContractMobileStyles.previewPanelTitle,
                          checkoutSettlementToneStyles.charge.title
                        )}
                      >
                        应收项目
                      </h4>
                      <div className={checkoutContractMobileStyles.previewList}>
                        {finalSettlement.lineItems.charge.length === 0 && (
                          <div className={checkoutContractMobileStyles.emptyState}>
                            暂无应收项目
                          </div>
                        )}
                        {finalSettlement.lineItems.charge.map((item) => (
                          <div
                            key={item.id}
                            className={checkoutContractMobileStyles.previewItem}
                          >
                            <div
                              className={
                                checkoutContractMobileStyles.previewItemHeader
                              }
                            >
                              <div
                                className={
                                  checkoutContractMobileStyles.previewItemHeading
                                }
                              >
                                <span
                                  className={
                                    checkoutContractMobileStyles.previewItemName
                                  }
                                >
                                  {item.name}
                                </span>
                                {item.editable ? (
                                  <Badge
                                    className={
                                      checkoutContractMobileStyles.editableBadge
                                    }
                                  >
                                    可受限编辑
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">系统计算项</Badge>
                                )}
                              </div>
                              <span
                                className={cn(
                                  checkoutContractMobileStyles.previewItemAmount,
                                  checkoutSettlementToneStyles.charge.amount
                                )}
                              >
                                {formatCurrency(item.adjustedAmount)}
                              </span>
                            </div>
                            <div
                              className={checkoutContractMobileStyles.formulaBox}
                            >
                              <span className={checkoutContractMobileStyles.formulaLabel}>
                                计算公式：
                              </span>
                              {item.formula}
                            </div>
                            {item.billId && (
                              <div className={checkoutContractMobileStyles.billMetaSection}>
                                <div>
                                  <span
                                    className={
                                      checkoutContractMobileStyles.billMetaLabel
                                    }
                                  >
                                    账单状态：
                                  </span>
                                  {item.billStatus === 'OVERDUE' ? '逾期' : '待处理'}
                                </div>
                                <div className={checkoutContractMobileStyles.billMetaAmountsRow}>
                                  <div
                                    className={
                                      checkoutContractMobileStyles.billMetaAmountItem
                                    }
                                  >
                                    <span
                                      className={
                                        checkoutContractMobileStyles.billMetaLabel
                                      }
                                    >
                                      已收金额：
                                    </span>
                                    {formatCurrency(item.billReceivedAmount ?? 0)}
                                  </div>
                                  <div
                                    className={
                                      checkoutContractMobileStyles.billMetaAmountItem
                                    }
                                  >
                                    <span
                                      className={
                                        checkoutContractMobileStyles.billMetaLabel
                                      }
                                    >
                                      当前待收：
                                    </span>
                                    {formatCurrency(item.billPendingAmount ?? 0)}
                                  </div>
                                </div>
                              </div>
                            )}
                            {item.editable ? (
                              <div
                                className={checkoutContractMobileStyles.editableBox}
                              >
                                <div className={checkoutContractMobileStyles.formField}>
                                  <Label
                                    htmlFor={`adjustedAmount-${item.id}`}
                                    className={
                                      checkoutContractMobileStyles.formLabel
                                    }
                                  >
                                    本次纳入退租结算金额
                                  </Label>
                                  <Input
                                    id={`adjustedAmount-${item.id}`}
                                    type="number"
                                    min={item.minAdjustableAmount}
                                    max={item.maxAdjustableAmount}
                                    step="0.01"
                                    value={settlementAdjustments[item.id]?.adjustedAmount ?? item.originalAmount}
                                    onChange={(event) =>
                                      handleSettlementAmountChange(item, event.target.value)
                                    }
                                    disabled={loading}
                                    className={checkoutContractMobileStyles.input}
                                  />
                                  <p
                                    className={
                                      checkoutContractMobileStyles.rangeText
                                    }
                                  >
                                    允许范围：{formatCurrency(item.minAdjustableAmount)} ~{' '}
                                    {formatCurrency(item.maxAdjustableAmount)}
                                  </p>
                                </div>
                                <div
                                  className={
                                    checkoutContractMobileStyles.compactReasonField
                                  }
                                >
                                  <Label
                                    htmlFor={`adjustmentReason-${item.id}`}
                                    className={
                                      checkoutContractMobileStyles.compactReasonLabel
                                    }
                                  >
                                    调整原因
                                  </Label>
                                  <Textarea
                                    id={`adjustmentReason-${item.id}`}
                                    value={
                                      settlementAdjustments[item.id]?.adjustmentReason ?? ''
                                    }
                                    onChange={(event) =>
                                      handleSettlementReasonChange(
                                        item.id,
                                        event.target.value
                                      )
                                    }
                                    disabled={loading}
                                    className={
                                      checkoutContractMobileStyles.compactReasonTextarea
                                    }
                                    placeholder="如与原始待收金额不同，请填写调整原因"
                                    rows={2}
                                  />
                                  {item.isAdjusted && !settlementAdjustments[item.id]?.adjustmentReason.trim() && (
                                    <p
                                      className={
                                        checkoutContractMobileStyles.adjustedError
                                      }
                                    >
                                      已调整金额时，提交前必须填写调整原因
                                    </p>
                                  )}
                                </div>
                                {item.isAdjusted && (
                                  <div
                                    className={
                                      checkoutContractMobileStyles.adjustedText
                                    }
                                  >
                                    原始金额 {formatCurrency(item.originalAmount)}，当前结算金额{' '}
                                    {formatCurrency(item.adjustedAmount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              item.lockedReason && (
                                <div
                                  className={checkoutContractMobileStyles.lockedText}
                                >
                                  {item.lockedReason}
                                </div>
                              )
                            )}
                          </div>
                        ))}

                        <div className={checkoutContractMobileStyles.subtotalRow}>
                          <div
                            className={checkoutContractMobileStyles.subtotalInner}
                          >
                            <span>应收小计</span>
                            <span className={checkoutSettlementToneStyles.charge.subtotal}>
                              {formatCurrency(finalSettlement.chargeItems.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 退租结算说明 */}
                  <div className={checkoutContractMobileStyles.noteBox}>
                    <div className={checkoutContractMobileStyles.noteRow}>
                      <AlertCircle
                        className={checkoutContractMobileStyles.noteIcon}
                      />
                      <div className={checkoutContractMobileStyles.noteText}>
                        <p className={checkoutContractMobileStyles.noteHeading}>
                          退租结算说明：
                        </p>
                        <ul className={checkoutContractMobileStyles.noteList}>
                          <li>
                            • 点击"确认退租"将一次性结清所有合同权利和义务
                          </li>
                          <li>• 当前预览即最终落库结算口径，确认后将按此金额生成退租结算账单</li>
                          <li>• 应退项目允许按 `0 ~ 原始应退金额` 受限调整，并记录调整原因</li>
                          <li>• 旧未付账单支持按 `0 ~ pendingAmount` 受限调整本次纳入结算金额</li>
                          <li>• 若旧账单已发生部分收款，系统会保留既有已收事实并记录人工调整原因</li>
                          <li>• 最终结算可线上确认或线下处理</li>
                          <li>• 退租完成后合同状态将变更为已终止</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 结算汇总 */}
                  <div
                    className={cn(
                      checkoutContractMobileStyles.summaryCard,
                      checkoutSettlementToneStyles.summary[
                        finalSettlement.summary.settlementType
                      ]
                    )}
                  >
                    <h4 className={checkoutContractMobileStyles.summaryTitle}>
                      结算汇总
                    </h4>
                    <div className={checkoutContractMobileStyles.summaryList}>
                      <div className={checkoutContractMobileStyles.summaryRow}>
                        <span>总应退金额</span>
                        <span className={checkoutSettlementToneStyles.refund.amount}>
                          ¥{finalSettlement.summary.totalRefund.toFixed(2)}
                        </span>
                      </div>
                      <div className={checkoutContractMobileStyles.summaryRow}>
                        <span>总应收金额</span>
                        <span className={checkoutSettlementToneStyles.charge.amount}>
                          ¥{finalSettlement.summary.totalCharge.toFixed(2)}
                        </span>
                      </div>
                      <div className={checkoutContractMobileStyles.summaryNetBlock}>
                        <div
                          className={checkoutContractMobileStyles.summaryNetRow}
                        >
                          <span>净结算金额</span>
                          <span
                            className={
                              checkoutSettlementToneStyles.summaryAmount[
                                finalSettlement.summary.settlementType
                              ]
                            }
                          >
                            {finalSettlement.summary.netAmount >= 0 ? '+' : ''}¥
                            {finalSettlement.summary.netAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className={checkoutContractMobileStyles.actionsCard}>
                <div className={checkoutContractMobileStyles.actionsRow}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      goBackWithHost(navigation, `/contracts/${contract.id}`)
                    }
                    disabled={loading}
                    className={checkoutContractMobileStyles.actionButton}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={checkoutContractMobileStyles.actionSubmitButton}
                  >
                    {loading ? '处理中...' : '确认退租并结清所有账单'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
