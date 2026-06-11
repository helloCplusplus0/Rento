'use client'

import { useEffect, useState } from 'react'
import { Droplets, ExternalLink, Flame, HelpCircle, Zap } from 'lucide-react'

import { getBillDisplayLabel } from '@/lib/bill-display'
import { formatCurrency, formatDate } from '@/lib/format'
import { pushWithHostNavigation } from '@/lib/host-navigation'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BillStatusBadge } from '@/components/ui/status-badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BillStatusExplanation } from '@/components/business/BillStatusExplanation'
import { billDetailMobileStyles } from '@/components/business/bill-detail-mobile-styles'

interface BillBasicInfoProps {
  bill: any
  utilityDetailsData?: UtilityBillDetailsData | null
  onOpenContract?: (contractId: string) => void
  onOpenRenter?: (renterId: string) => void
}

interface UtilityBillDetailsResponse {
  success?: boolean
  data?: UtilityBillDetailItem[]
  error?: string
  metadata?: {
    isLegacy?: boolean
  }
}

export interface UtilityBillDetailItem {
  id: string
  billId: string
  meterReadingId: string
  meterId?: string
  meterNumber?: string
  meterType: string
  meterName: string
  usage: number
  unitPrice: number
  amount: number
  unit: string
  previousReading: number | null
  currentReading: number
  readingDate: string
  priceSource: string
  createdAt: string
  updatedAt: string
}

export interface UtilityBillDetailsData {
  items: UtilityBillDetailItem[]
  isLegacy: boolean
  errorMessage: string | null
}

const detailLinkClassName =
  'group flex w-full items-start gap-1 text-left text-sm font-medium leading-6 text-blue-600 transition-colors hover:text-blue-800'

function getUtilityDetailMeterCode(detail: UtilityBillDetailItem) {
  if (detail.meterNumber?.trim()) {
    return detail.meterNumber.trim()
  }

  if (detail.meterId?.trim()) {
    return detail.meterId.trim().slice(-8).toUpperCase()
  }

  return null
}

function getUtilityDetailMeterVisuals(meterType: string) {
  switch (meterType) {
    case 'ELECTRICITY':
      return {
        icon: Zap,
        iconClassName: 'bg-amber-100 text-amber-700',
      }
    case 'COLD_WATER':
      return {
        icon: Droplets,
        iconClassName: 'bg-sky-100 text-sky-700',
      }
    case 'HOT_WATER':
      return {
        icon: Droplets,
        iconClassName: 'bg-cyan-100 text-cyan-700',
      }
    case 'GAS':
      return {
        icon: Flame,
        iconClassName: 'bg-orange-100 text-orange-700',
      }
    default:
      return {
        icon: Droplets,
        iconClassName: 'bg-gray-100 text-gray-600',
      }
  }
}

/**
 * 账单基本信息组件
 * 显示账单的核心信息，包括金额、日期、状态等
 * 支持不同类型账单的差异化展示
 */
export function BillBasicInfo({
  bill,
  utilityDetailsData,
  onOpenContract,
  onOpenRenter,
}: BillBasicInfoProps) {
  // 统一以服务端状态为准，避免与统计口径分叉
  const today = new Date()
  const dueDate = new Date(bill.dueDate)
  const isOverdue = bill.status === 'OVERDUE'
  const overdueDays = isOverdue
    ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <Card className={billDetailMobileStyles.card}>
      <CardHeader className={billDetailMobileStyles.cardHeader}>
        <div className={billDetailMobileStyles.cardHeaderRow}>
          <CardTitle className={billDetailMobileStyles.cardTitle}>
            账单信息
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={billDetailMobileStyles.headerActionButton}
              >
                <HelpCircle className="h-4 w-4" />
                状态说明
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-0.75rem)] overflow-x-hidden overflow-y-auto sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>账单状态说明</DialogTitle>
              </DialogHeader>
              <BillStatusExplanation />
            </DialogContent>
          </Dialog>
        </div>

        {/* 简化的账单核心信息区域 - 只保留金额和状态 */}
        <div className={billDetailMobileStyles.summaryCard}>
          {/* 顶部：状态 */}
          <div className={billDetailMobileStyles.summaryStatusRow}>
            <BillStatusBadge status={bill.status} />
          </div>

          {/* 中部：账单总金额 */}
          <div className={billDetailMobileStyles.summaryAmountBlock}>
            <p className={billDetailMobileStyles.summaryAmountLabel}>
              账单总金额
            </p>
            <p className={billDetailMobileStyles.summaryAmountValue}>
              {formatCurrency(bill.amount)}
            </p>
          </div>

          {/* 底部：已收/待收金额 */}
          <div className={billDetailMobileStyles.summaryMetaRow}>
            <div className={billDetailMobileStyles.summaryMetaBlock}>
              <p className={billDetailMobileStyles.summaryMetaLabel}>已收金额</p>
              <p
                className={cn(
                  billDetailMobileStyles.summaryMetaValue,
                  'text-green-600'
                )}
              >
                {formatCurrency(bill.receivedAmount)}
              </p>
            </div>
            <div className={billDetailMobileStyles.summaryMetaBlock}>
              <p className={billDetailMobileStyles.summaryMetaLabel}>待收金额</p>
              <p
                className={cn(
                  billDetailMobileStyles.summaryMetaValue,
                  'text-orange-600'
                )}
              >
                {formatCurrency(bill.pendingAmount)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={billDetailMobileStyles.cardContent}>
        {/* 根据账单类型显示不同内容 */}
        {bill.type === 'UTILITIES' ? (
          <UtilitiesBillDetails
            bill={bill}
            utilityDetailsData={utilityDetailsData}
            onOpenContract={onOpenContract}
            onOpenRenter={onOpenRenter}
          />
        ) : (
          <GeneralBillDetails
            bill={bill}
            onOpenContract={onOpenContract}
            onOpenRenter={onOpenRenter}
          />
        )}

        {isOverdue && (
          <div className={billDetailMobileStyles.warningBox}>
            <p className={billDetailMobileStyles.warningText}>
              ⚠️ 账单已逾期 {overdueDays} 天，请及时处理
            </p>
          </div>
        )}

        {bill.remarks && (
          <div className={billDetailMobileStyles.noteBlock}>
            <label className={billDetailMobileStyles.fieldLabel}>备注</label>
            <p className={billDetailMobileStyles.noteText}>
              {bill.remarks}
            </p>
          </div>
        )}

        <div className={billDetailMobileStyles.footerMetaGrid}>
          <div>
            <label className={billDetailMobileStyles.fieldLabel}>创建时间</label>
            <p className="text-xs leading-5 text-gray-500 sm:text-sm">
              {formatDate(bill.createdAt)}
            </p>
          </div>
          <div>
            <label className={billDetailMobileStyles.fieldLabel}>更新时间</label>
            <p className="text-xs leading-5 text-gray-500 sm:text-sm">
              {formatDate(bill.updatedAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 水电费账单明细组件
 */
function UtilitiesBillDetails({
  bill,
  utilityDetailsData,
  onOpenContract,
  onOpenRenter,
}: {
  bill: any
  utilityDetailsData?: UtilityBillDetailsData | null
  onOpenContract?: (contractId: string) => void
  onOpenRenter?: (renterId: string) => void
}) {
  const hasPreloadedDetails = utilityDetailsData !== undefined
  const [billDetailsData, setBillDetailsData] = useState<UtilityBillDetailsData>({
    items: utilityDetailsData?.items ?? [],
    isLegacy: utilityDetailsData?.isLegacy ?? false,
    errorMessage: utilityDetailsData?.errorMessage ?? null,
  })
  const [isLoading, setIsLoading] = useState(!hasPreloadedDetails)

  // 跳转到合同详情
  const handleContractClick = () => {
    if (onOpenContract) {
      onOpenContract(bill.contract.id)
      return
    }

    pushWithHostNavigation(`/contracts/${bill.contract.id}`)
  }

  // 跳转到租客详情
  const handleRenterClick = () => {
    if (onOpenRenter) {
      onOpenRenter(bill.contract.renter.id)
      return
    }

    pushWithHostNavigation(`/renters/${bill.contract.renter.id}`)
  }

  useEffect(() => {
    if (!hasPreloadedDetails) {
      return
    }

    setBillDetailsData({
      items: utilityDetailsData?.items ?? [],
      isLegacy: utilityDetailsData?.isLegacy ?? false,
      errorMessage: utilityDetailsData?.errorMessage ?? null,
    })
    setIsLoading(false)
  }, [hasPreloadedDetails, utilityDetailsData])

  useEffect(() => {
    if (hasPreloadedDetails) {
      return
    }

    let isCancelled = false

    const fetchBillDetails = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(`/api/bills/${bill.id}/details`)
        const result: UtilityBillDetailsResponse = await response.json()

        if (isCancelled) {
          return
        }

        if (response.ok && result.success !== false) {
          setBillDetailsData({
            items: result.data || [],
            isLegacy: Boolean(result.metadata?.isLegacy),
            errorMessage: null,
          })
          return
        }

        setBillDetailsData({
          items: [],
          isLegacy: Boolean(result.metadata?.isLegacy),
          errorMessage: result.error || '账单用量明细加载失败，请稍后重试。',
        })
      } catch (error) {
        if (isCancelled) {
          return
        }

        console.error('Error fetching bill details:', error)
        setBillDetailsData({
          items: [],
          isLegacy: false,
          errorMessage: '账单用量明细加载失败，请稍后重试。',
        })
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchBillDetails()

    return () => {
      isCancelled = true
    }
  }, [bill.id, hasPreloadedDetails])

  const getMeterTypeName = (meterType: string) => {
    const typeNames = {
      ELECTRICITY: '电费',
      COLD_WATER: '冷水费',
      HOT_WATER: '热水费',
      GAS: '燃气费',
    }
    return typeNames[meterType as keyof typeof typeNames] || '水电费'
  }

  if (isLoading) {
    return (
      <div className={billDetailMobileStyles.contentStack}>
        <div className={billDetailMobileStyles.sectionBox}>
          <h4 className="mb-3 text-sm font-semibold leading-6 text-gray-900">
            用量明细
          </h4>
          <div className="animate-pulse space-y-3">
            <div className={billDetailMobileStyles.detailCard}>
              <div className="mb-2 h-4 w-1/3 rounded bg-gray-200"></div>
              <div className="h-3 w-1/2 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const billDetails = billDetailsData.items
  const isLegacy = billDetailsData.isLegacy

  return (
    <div className={billDetailMobileStyles.contentStack}>
      {/* 账单基本信息 - 下沉到这里 */}
      <div className={billDetailMobileStyles.fieldsGrid}>
        <div className={billDetailMobileStyles.fieldBlock}>
          <label className={billDetailMobileStyles.fieldLabel}>账单编号</label>
          <p className={billDetailMobileStyles.fieldValueMono}>
            {bill.billNumber}
          </p>
        </div>
        <div className={billDetailMobileStyles.fieldBlock}>
          <label className={billDetailMobileStyles.fieldLabel}>账单类型</label>
          <p className={billDetailMobileStyles.fieldValue}>
            {getBillDisplayLabel(bill)}
          </p>
        </div>

        {/* 租客信息 - 可点击跳转 */}
        <div className={billDetailMobileStyles.fieldBlock}>
          <label className={billDetailMobileStyles.fieldLabel}>租客姓名</label>
          <button
            onClick={handleRenterClick}
            className={detailLinkClassName}
          >
            {bill.contract.renter.name}
            <ExternalLink className="mt-1 h-3 w-3 shrink-0 opacity-60 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
          </button>
        </div>

        {/* 房间信息 - 可点击跳转 */}
        <div className={billDetailMobileStyles.fieldBlock}>
          <label className={billDetailMobileStyles.fieldLabel}>房间信息</label>
          <button
            onClick={handleContractClick}
            className={detailLinkClassName}
          >
            {bill.contract.room.building.name} - {bill.contract.room.roomNumber}
            <ExternalLink className="mt-1 h-3 w-3 shrink-0 opacity-60 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
          </button>
        </div>

        {/* 合同编号 - 可点击跳转 */}
        <div className={billDetailMobileStyles.fieldBlock}>
          <label className={billDetailMobileStyles.fieldLabel}>合同编号</label>
          <button
            onClick={handleContractClick}
            className={billDetailMobileStyles.fieldLinkMono}
          >
            {bill.contract.contractNumber}
          </button>
        </div>

        <div
          className={cn(
            billDetailMobileStyles.fieldBlock,
            billDetailMobileStyles.fieldWide
          )}
        >
          <label className={billDetailMobileStyles.fieldLabel}>缴费周期</label>
          <p className="text-sm font-medium leading-6 text-blue-600">
            {bill.period || '2025年1月1日 至 2025年1月31日'}
          </p>
        </div>
        <div className={billDetailMobileStyles.fieldBlock}>
          <label className={billDetailMobileStyles.fieldLabel}>到期日期</label>
          <p className={billDetailMobileStyles.fieldValue}>
            {formatDate(bill.dueDate)}
          </p>
        </div>
        <div className={billDetailMobileStyles.fieldBlock}>
          <label className={billDetailMobileStyles.fieldLabel}>抄表日期</label>
          <p className={billDetailMobileStyles.fieldValue}>
            {billDetails.length > 0
              ? formatDate(billDetails[0].readingDate)
              : '2025年1月31日'}
          </p>
        </div>
      </div>

      {/* 水电费明细 */}
      <div className={billDetailMobileStyles.sectionBox}>
        <div className={billDetailMobileStyles.sectionHeader}>
          <h4 className={billDetailMobileStyles.sectionTitle}>
            用量明细
          </h4>
          {isLegacy && (
            <span className="rounded bg-orange-100 px-2 py-1 text-[11px] font-medium leading-4 text-orange-600 sm:text-xs">
              兼容模式
            </span>
          )}
        </div>

        {billDetailsData.errorMessage ? (
          <div className="py-4 text-center text-sm text-red-500">
            {billDetailsData.errorMessage}
          </div>
        ) : billDetails.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">
            暂无明细数据
          </div>
        ) : (
          <div className="space-y-3">
            {billDetails.map((detail, index) => (
              <div
                key={detail.id || index}
                className={cn(
                  billDetailMobileStyles.detailCard,
                  'border-gray-200 shadow-sm'
                )}
              >
                {(() => {
                  const visuals = getUtilityDetailMeterVisuals(detail.meterType)
                  const MeterIcon = visuals.icon
                  const meterCode = getUtilityDetailMeterCode(detail)

                  return (
                    <>
                      <div className={billDetailMobileStyles.detailCardHeader}>
                        <div className="flex min-w-0 w-full items-start gap-2 sm:flex-1">
                          <div
                            className={cn(
                              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9',
                              visuals.iconClassName
                            )}
                          >
                            <MeterIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:gap-3">
                              <div className="min-w-0">
                                <h5 className="truncate text-sm font-semibold leading-5 text-gray-900 sm:leading-6">
                                  {detail.meterName || getMeterTypeName(detail.meterType)}
                                </h5>
                              </div>
                              <div className="shrink-0 self-start rounded-lg bg-emerald-50 px-2.5 py-1.5 text-right sm:min-w-[76px] sm:px-3 sm:py-2">
                                <p className="text-lg font-semibold leading-5 tabular-nums text-emerald-700 sm:text-lg sm:leading-6">
                                  {formatCurrency(detail.amount)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1 text-xs leading-5 text-gray-500 sm:mt-1.5 sm:gap-1.5">
                              {meterCode ? (
                                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] font-medium leading-4 text-gray-600 sm:py-1">
                                  {meterCode}
                                </span>
                              ) : null}
                              <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 sm:py-1">
                                {formatCurrency(detail.unitPrice)}/{detail.unit || '度'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[auto_auto] items-center gap-x-2.5 gap-y-1 border-t border-dashed border-gray-200 pt-2 text-xs leading-5 text-gray-500 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1.5 sm:pt-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                          <span className="text-[11px] leading-4 text-gray-500">
                            用量
                          </span>
                          <span className="font-semibold text-gray-900">
                            {detail.usage} {detail.unit || '度'}
                          </span>
                        </span>
                        {detail.previousReading !== null ? (
                          <span className="col-span-2 inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] leading-4 text-gray-600 sm:col-auto">
                            <span>读数</span>
                            <span className="font-mono tabular-nums">
                              {detail.currentReading}
                            </span>
                            <span className="text-gray-400">-</span>
                            <span className="font-mono tabular-nums">
                              {detail.previousReading}
                            </span>
                          </span>
                        ) : null}
                        <span className="justify-self-end inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 sm:justify-self-auto">
                          <span className="text-[11px] leading-4 text-gray-500">
                            抄表
                          </span>
                          <span className="font-medium text-gray-700">
                            {formatDate(detail.readingDate)}
                          </span>
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 通用账单详情组件 (租金、押金、其他)
 */
function GeneralBillDetails({
  bill,
  onOpenContract,
  onOpenRenter,
}: {
  bill: any
  onOpenContract?: (contractId: string) => void
  onOpenRenter?: (renterId: string) => void
}) {

  // 跳转到合同详情
  const handleContractClick = () => {
    if (onOpenContract) {
      onOpenContract(bill.contract.id)
      return
    }

    pushWithHostNavigation(`/contracts/${bill.contract.id}`)
  }

  // 跳转到租客详情
  const handleRenterClick = () => {
    if (onOpenRenter) {
      onOpenRenter(bill.contract.renter.id)
      return
    }

    pushWithHostNavigation(`/renters/${bill.contract.renter.id}`)
  }

  // 生成缴费周期时间段 (模拟数据，实际应从数据库获取)
  const getBillingPeriod = () => {
    if (bill.period) return bill.period

    // 根据账单类型生成默认的缴费周期
    const dueDate = new Date(bill.dueDate)
    const startDate = new Date(dueDate)

    if (bill.type === 'RENT') {
      // 租金：通常是一个月的周期
      startDate.setMonth(dueDate.getMonth() - 1)
      return `${formatDate(startDate)} 至 ${formatDate(dueDate)}`
    } else if (bill.type === 'DEPOSIT') {
      // 押金：通常是合同开始时的一次性费用
      return `合同生效期间`
    } else {
      // 其他：默认一个月周期
      startDate.setMonth(dueDate.getMonth() - 1)
      return `${formatDate(startDate)} 至 ${formatDate(dueDate)}`
    }
  }

  return (
    <div className={billDetailMobileStyles.fieldsGrid}>
      <div className={billDetailMobileStyles.fieldBlock}>
        <label className={billDetailMobileStyles.fieldLabel}>账单编号</label>
        <p className={billDetailMobileStyles.fieldValueMono}>
          {bill.billNumber}
        </p>
      </div>
      <div className={billDetailMobileStyles.fieldBlock}>
        <label className={billDetailMobileStyles.fieldLabel}>账单类型</label>
        <p className={billDetailMobileStyles.fieldValue}>{getBillDisplayLabel(bill)}</p>
      </div>
      {/* 租客信息 - 可点击跳转 */}
      <div className={billDetailMobileStyles.fieldBlock}>
        <label className={billDetailMobileStyles.fieldLabel}>租客姓名</label>
        <button
          onClick={handleRenterClick}
          className={detailLinkClassName}
        >
          {bill.contract.renter.name}
          <ExternalLink className="mt-1 h-3 w-3 shrink-0 opacity-60 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
        </button>
      </div>
      {/* 房间信息 - 可点击跳转 */}
      <div className={billDetailMobileStyles.fieldBlock}>
        <label className={billDetailMobileStyles.fieldLabel}>房间信息</label>
        <button
          onClick={handleContractClick}
          className={detailLinkClassName}
        >
          {bill.contract.room.building.name} - {bill.contract.room.roomNumber}
          <ExternalLink className="mt-1 h-3 w-3 shrink-0 opacity-60 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
        </button>
      </div>
      {/* 合同编号 - 可点击跳转 */}
      <div className={billDetailMobileStyles.fieldBlock}>
        <label className={billDetailMobileStyles.fieldLabel}>合同编号</label>
        <button
          onClick={handleContractClick}
          className="text-left font-mono text-sm font-medium leading-6 text-blue-600 transition-colors hover:text-blue-800"
        >
          {bill.contract.contractNumber}
        </button>
      </div>
      <div
        className={cn(
          billDetailMobileStyles.fieldBlock,
          billDetailMobileStyles.fieldWide
        )}
      >
        <label className={billDetailMobileStyles.fieldLabel}>缴费周期</label>
        <p className="text-sm font-medium leading-6 text-blue-600">
          {getBillingPeriod()}
        </p>
      </div>
      <div className={billDetailMobileStyles.fieldBlock}>
        <label className={billDetailMobileStyles.fieldLabel}>到期日期</label>
        <p className={billDetailMobileStyles.fieldValue}>{formatDate(bill.dueDate)}</p>
      </div>
      <div></div> {/* 占位保持对齐 */}
      {bill.paidDate && (
        <>
          <div className={billDetailMobileStyles.fieldBlock}>
            <label className={billDetailMobileStyles.fieldLabel}>实际支付日期</label>
            <p className={billDetailMobileStyles.fieldValue}>
              {formatDate(bill.paidDate)}
            </p>
          </div>
          <div></div> {/* 占位保持对齐 */}
        </>
      )}
      {bill.paymentMethod && (
        <>
          <div className={billDetailMobileStyles.fieldBlock}>
            <label className={billDetailMobileStyles.fieldLabel}>支付方式</label>
            <p className={billDetailMobileStyles.fieldValue}>{bill.paymentMethod}</p>
          </div>
          <div></div> {/* 占位保持对齐 */}
        </>
      )}
      {bill.operator && (
        <>
          <div className={billDetailMobileStyles.fieldBlock}>
            <label className={billDetailMobileStyles.fieldLabel}>经办人</label>
            <p className={billDetailMobileStyles.fieldValueStrong}>{bill.operator}</p>
          </div>
          <div></div> {/* 占位保持对齐 */}
        </>
      )}
    </div>
  )
}
