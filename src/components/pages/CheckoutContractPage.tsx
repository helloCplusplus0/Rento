'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Calculator,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  Home,
  User,
} from 'lucide-react'

import { formatCurrency, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { PageContainer } from '@/components/layout'
import {
  applyCheckoutSettlementSubmission,
  calculateCheckoutSettlement,
  createCheckoutSettlementSubmissionItems,
  type AppliedCheckoutSettlementLineItem,
  type CheckoutSettlementLineItem,
} from '@/lib/checkout-settlement'

// 合同详情类型定义
interface ContractWithDetailsForClient {
  id: string
  contractNumber: string
  roomId: string
  renterId: string
  startDate: Date
  endDate: Date
  monthlyRent: number
  totalRent: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  status: string
  room: {
    id: string
    roomNumber: string
    floorNumber: number
    building: {
      id: string
      name: string
      address: string | null
    }
  }
  renter: {
    id: string
    name: string
    phone: string
  }
  bills: Array<{
    id: string
    billNumber: string
    type: string
    amount: number
    receivedAmount: number
    pendingAmount: number
    status: string
  }>
}

interface CheckoutContractPageProps {
  contract: ContractWithDetailsForClient
}

interface SettlementAdjustmentDraft {
  adjustedAmount: number
  adjustmentReason: string
}

export function CheckoutContractPage({ contract }: CheckoutContractPageProps) {
  const router = useRouter()
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
      const response = await fetch(`/api/contracts/${contract.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          settlementItems: validatedSettlement.submissionItems,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '退租失败')
      }

      // 退租成功后直接替换当前路由，避免在成功态重渲染与页面跳转并发时触发
      // App Router 的 RSC 请求中断噪音。
      router.replace(`/contracts/${contract.id}`)
    } catch (error) {
      console.error('退租失败:', error)
      setError(error instanceof Error ? error.message : '退租失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title="退租合同" showBackButton>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* 原合同信息展示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              合同信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">房间:</span>
                <span className="font-medium">
                  {contract.room.building.name} - {contract.room.roomNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">租客:</span>
                <span className="font-medium">{contract.renter.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">合同期限:</span>
                <span className="font-medium">
                  {formatDate(contract.startDate)} 至{' '}
                  {formatDate(contract.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">月租金:</span>
                <span className="font-medium">
                  {formatCurrency(contract.monthlyRent)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 退租表单 */}
        <Card>
          <CardHeader>
            <CardTitle>退租信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="checkoutDate">退租日期 *</Label>
                  <Input
                    id="checkoutDate"
                    type="date"
                    value={formData.checkoutDate}
                    onChange={(e) =>
                      handleInputChange('checkoutDate', e.target.value)
                    }
                    disabled={loading}
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(contract.endDate).toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="damageAssessment">损坏赔偿金额</Label>
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
                    className="mt-1"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    房屋损坏需要赔偿的金额
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="checkoutReason">退租原因 *</Label>
                <Textarea
                  id="checkoutReason"
                  value={formData.checkoutReason}
                  onChange={(e) =>
                    handleInputChange('checkoutReason', e.target.value)
                  }
                  disabled={loading}
                  className="mt-1"
                  placeholder="请填写退租原因..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="remarks">备注</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  disabled={loading}
                  className="mt-1"
                  placeholder="其他需要说明的事项..."
                  rows={2}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* 结算预览 */}
              {finalSettlement && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="flex items-center gap-2 font-medium">
                    <Calculator className="h-4 w-4" />
                    结算预览
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* 应退项目 */}
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <h4 className="mb-3 font-semibold text-red-800">
                        应退项目
                      </h4>
                      <div className="space-y-3">
                        {finalSettlement.lineItems.refund.length === 0 && (
                          <div className="text-sm text-gray-500">暂无应退项目</div>
                        )}
                        {finalSettlement.lineItems.refund.map((item) => (
                          <div key={item.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {item.name}
                                </span>
                                {item.editable ? (
                                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                    可受限编辑
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">系统计算项</Badge>
                                )}
                              </div>
                              <span className="font-medium text-red-600">
                                {formatCurrency(item.adjustedAmount)}
                              </span>
                            </div>
                            <div className="rounded border bg-white p-2 text-xs text-gray-600">
                              <span className="font-medium">计算公式：</span>
                              {item.formula}
                            </div>
                            {item.editable ? (
                              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <div>
                                  <Label htmlFor={`adjustedRefundAmount-${item.id}`}>
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
                                    className="mt-1"
                                  />
                                  <p className="mt-1 text-xs text-amber-700">
                                    允许范围：{formatCurrency(item.minAdjustableAmount)} ~{' '}
                                    {formatCurrency(item.maxAdjustableAmount)}
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor={`refundAdjustmentReason-${item.id}`}>
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
                                    className="mt-1"
                                    placeholder="如与原始应退金额不同，请填写调整原因"
                                    rows={2}
                                  />
                                  {item.isAdjusted &&
                                    !settlementAdjustments[item.id]?.adjustmentReason.trim() && (
                                      <p className="mt-1 text-xs text-red-600">
                                        已调整金额时，提交前必须填写调整原因
                                      </p>
                                    )}
                                </div>
                                {item.isAdjusted && (
                                  <div className="text-xs text-amber-700">
                                    原始金额 {formatCurrency(item.originalAmount)}，当前结算金额{' '}
                                    {formatCurrency(item.adjustedAmount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              item.lockedReason && (
                                <div className="text-xs text-gray-500">
                                  {item.lockedReason}
                                </div>
                              )
                            )}
                          </div>
                        ))}

                        <div className="border-t pt-2 font-semibold">
                          <div className="flex justify-between">
                            <span>应退小计</span>
                            <span className="text-red-600">
                              {formatCurrency(finalSettlement.refundItems.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 应收项目 */}
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <h4 className="mb-3 font-semibold text-green-800">
                        应收项目
                      </h4>
                      <div className="space-y-3">
                        {finalSettlement.lineItems.charge.length === 0 && (
                          <div className="text-sm text-gray-500">暂无应收项目</div>
                        )}
                        {finalSettlement.lineItems.charge.map((item) => (
                          <div key={item.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {item.name}
                                </span>
                                {item.editable ? (
                                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                    可受限编辑
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">系统计算项</Badge>
                                )}
                              </div>
                              <span className="font-medium text-green-600">
                                {formatCurrency(item.adjustedAmount)}
                              </span>
                            </div>
                            <div className="rounded border bg-white p-2 text-xs text-gray-600">
                              <span className="font-medium">计算公式：</span>
                              {item.formula}
                            </div>
                            {item.billId && (
                              <div className="grid grid-cols-1 gap-2 rounded border border-dashed bg-white p-3 text-xs text-gray-600 md:grid-cols-3">
                                <div>
                                  <span className="font-medium">账单状态：</span>
                                  {item.billStatus === 'OVERDUE' ? '逾期' : '待处理'}
                                </div>
                                <div>
                                  <span className="font-medium">已收金额：</span>
                                  {formatCurrency(item.billReceivedAmount ?? 0)}
                                </div>
                                <div>
                                  <span className="font-medium">当前待收：</span>
                                  {formatCurrency(item.billPendingAmount ?? 0)}
                                </div>
                              </div>
                            )}
                            {item.editable ? (
                              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <div>
                                  <Label htmlFor={`adjustedAmount-${item.id}`}>
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
                                    className="mt-1"
                                  />
                                  <p className="mt-1 text-xs text-amber-700">
                                    允许范围：{formatCurrency(item.minAdjustableAmount)} ~{' '}
                                    {formatCurrency(item.maxAdjustableAmount)}
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor={`adjustmentReason-${item.id}`}>
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
                                    className="mt-1"
                                    placeholder="如与原始待收金额不同，请填写调整原因"
                                    rows={2}
                                  />
                                  {item.isAdjusted && !settlementAdjustments[item.id]?.adjustmentReason.trim() && (
                                    <p className="mt-1 text-xs text-red-600">
                                      已调整金额时，提交前必须填写调整原因
                                    </p>
                                  )}
                                </div>
                                {item.isAdjusted && (
                                  <div className="text-xs text-amber-700">
                                    原始金额 {formatCurrency(item.originalAmount)}，当前结算金额{' '}
                                    {formatCurrency(item.adjustedAmount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              item.lockedReason && (
                                <div className="text-xs text-gray-500">
                                  {item.lockedReason}
                                </div>
                              )
                            )}
                          </div>
                        ))}

                        <div className="border-t pt-2 font-semibold">
                          <div className="flex justify-between">
                            <span>应收小计</span>
                            <span className="text-green-600">
                              {formatCurrency(finalSettlement.chargeItems.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 退租结算说明 */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <div className="text-sm text-blue-800">
                        <p className="mb-1 font-medium">退租结算说明：</p>
                        <ul className="space-y-1 text-xs">
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
                    className={`rounded-lg border-2 p-4 ${
                      finalSettlement.summary.settlementType === 'CHARGE'
                        ? 'border-green-300 bg-green-100'
                        : finalSettlement.summary.settlementType === 'REFUND'
                          ? 'border-red-300 bg-red-100'
                          : 'border-gray-300 bg-gray-100'
                    }`}
                  >
                    <h4 className="mb-3 text-lg font-bold">结算汇总</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>总应退金额</span>
                        <span className="text-red-600">
                          ¥{finalSettlement.summary.totalRefund.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>总应收金额</span>
                        <span className="text-green-600">
                          ¥{finalSettlement.summary.totalCharge.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t-2 pt-2">
                        <div className="flex justify-between text-xl font-bold">
                          <span>净结算金额</span>
                          <span
                            className={
                              finalSettlement.summary.settlementType === 'CHARGE'
                                ? 'text-green-600'
                                : finalSettlement.summary.settlementType === 'REFUND'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
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

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? '处理中...' : '确认退租并结清所有账单'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
