'use client'

import {
  getBillDisplayLabel,
  getBillVisualConfig,
} from '@/lib/bill-display'
import type { BillDueSummaryWindow } from '@/lib/bill-due-summary'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ContractWithDetailsForClient } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { billDetailMobileStyles } from './bill-detail-mobile-styles'

type ContractBill = NonNullable<ContractWithDetailsForClient['bills']>[number]

interface BillDueSummaryCardProps {
  contract: ContractWithDetailsForClient
  selectedBills: ContractBill[]
  window: BillDueSummaryWindow
}

export function BillDueSummaryCard({
  contract,
  selectedBills,
  window,
}: BillDueSummaryCardProps) {
  const totals = selectedBills.reduce(
    (summary, bill) => ({
      amount: summary.amount + bill.amount,
      receivedAmount: summary.receivedAmount + bill.receivedAmount,
      pendingAmount: summary.pendingAmount + bill.pendingAmount,
    }),
    {
      amount: 0,
      receivedAmount: 0,
      pendingAmount: 0,
    }
  )

  const summaryStatusLabel = selectedBills.length === 0 ? '未选择' : '待付'

  return (
    <Card className={billDetailMobileStyles.card}>
      <CardHeader className={billDetailMobileStyles.cardHeader}>
        <div className={billDetailMobileStyles.cardHeaderRow}>
          <CardTitle className={billDetailMobileStyles.cardTitle}>
            账单信息
          </CardTitle>
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-blue-700 sm:text-xs">
            催缴汇总
          </span>
        </div>

        <div className={billDetailMobileStyles.summaryCard}>
          <div className={billDetailMobileStyles.summaryStatusRow}>
            <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 sm:text-sm">
              {summaryStatusLabel}
            </span>
          </div>

          <div className={billDetailMobileStyles.summaryAmountBlock}>
            <p className={billDetailMobileStyles.summaryAmountLabel}>
              本次应付金额
            </p>
            <p className={billDetailMobileStyles.summaryAmountValue}>
              {formatCurrency(totals.pendingAmount)}
            </p>
          </div>

          <div className={billDetailMobileStyles.summaryMetaRow}>
            <div className={billDetailMobileStyles.summaryMetaBlock}>
              <p className={billDetailMobileStyles.summaryMetaLabel}>账单总额</p>
              <p
                className={cn(
                  billDetailMobileStyles.summaryMetaValue,
                  'text-blue-600'
                )}
              >
                {formatCurrency(totals.amount)}
              </p>
            </div>
            <div className={billDetailMobileStyles.summaryMetaBlock}>
              <p className={billDetailMobileStyles.summaryMetaLabel}>已收金额</p>
              <p
                className={cn(
                  billDetailMobileStyles.summaryMetaValue,
                  'text-green-600'
                )}
              >
                {formatCurrency(totals.receivedAmount)}
              </p>
            </div>
            <div className={billDetailMobileStyles.summaryMetaBlock}>
              <p className={billDetailMobileStyles.summaryMetaLabel}>账单数量</p>
              <p
                className={cn(
                  billDetailMobileStyles.summaryMetaValue,
                  'text-purple-600'
                )}
              >
                {selectedBills.length} 张
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={billDetailMobileStyles.cardContent}>
        <div className={billDetailMobileStyles.fieldsGrid}>
          <div className={billDetailMobileStyles.fieldBlock}>
            <label className={billDetailMobileStyles.fieldLabel}>合同编号</label>
            <p className={billDetailMobileStyles.fieldValueMono}>
              {contract.contractNumber}
            </p>
          </div>
          <div className={billDetailMobileStyles.fieldBlock}>
            <label className={billDetailMobileStyles.fieldLabel}>租客姓名</label>
            <p className={billDetailMobileStyles.fieldValueStrong}>
              {contract.renter.name}
            </p>
          </div>
          <div
            className={cn(
              billDetailMobileStyles.fieldBlock,
              billDetailMobileStyles.fieldWide
            )}
          >
            <label className={billDetailMobileStyles.fieldLabel}>房间信息</label>
            <p className={billDetailMobileStyles.fieldValueStrong}>
              {contract.room.building.name} - {contract.room.roomNumber}
            </p>
          </div>
          <div className={billDetailMobileStyles.fieldBlock}>
            <label className={billDetailMobileStyles.fieldLabel}>支付周期</label>
            <p className="text-sm font-medium leading-6 text-blue-600">
              {window.paymentCycleLabel}
            </p>
          </div>
          <div className={billDetailMobileStyles.fieldBlock}>
            <label className={billDetailMobileStyles.fieldLabel}>到期日</label>
            <p className={billDetailMobileStyles.fieldValue}>
              {formatDate(window.endDate)}
            </p>
          </div>
          <div
            className={cn(
              billDetailMobileStyles.fieldBlock,
              billDetailMobileStyles.fieldWide
            )}
          >
            <label className={billDetailMobileStyles.fieldLabel}>账单周期</label>
            <p className="text-sm font-medium leading-6 text-blue-600">
              {window.periodLabel}
            </p>
          </div>
        </div>

        <div
          className={cn(
            billDetailMobileStyles.sectionBox,
            'px-0.5 sm:px-3'
          )}
        >
          <div className={billDetailMobileStyles.sectionHeader}>
            <h4 className={billDetailMobileStyles.sectionTitle}>账单明细</h4>
          </div>

          {selectedBills.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-gray-500">
              当前没有可展示的账单项目，请先在左侧选择本次需要汇总的账单。
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedBills.map((bill) => {
                const visualConfig = getBillVisualConfig(bill)
                const Icon = visualConfig.icon
                const hasReceivedAmount = bill.receivedAmount > 0
                const showOriginalAmount = bill.pendingAmount !== bill.amount
                const isFutureBill = new Date(bill.dueDate) > window.endDate

                return (
                  <div
                    key={bill.id}
                    className={cn(
                      billDetailMobileStyles.detailCard,
                      'border-gray-200 px-1 py-2 shadow-sm sm:px-2.5 sm:py-3'
                    )}
                  >
                    <div className={billDetailMobileStyles.detailCardHeader}>
                      <div className="flex min-w-0 w-full items-start gap-2 sm:flex-1">
                        <div
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9',
                            visualConfig.iconClassName
                          )}
                        >
                          <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-2 sm:gap-x-3">
                            <div className="min-w-0">
                              <h5 className="truncate text-sm font-semibold leading-5 text-gray-900 sm:leading-6">
                                {getBillDisplayLabel(bill)}
                              </h5>
                              <div className="mt-1">
                                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] font-medium leading-4 text-gray-600 sm:py-1">
                                  {bill.billNumber}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 justify-self-start self-start rounded-lg bg-emerald-50 px-2.5 py-1.5 text-left sm:min-w-[76px] sm:justify-self-auto sm:px-3 sm:py-2 sm:text-right">
                              <p className="text-lg font-semibold leading-5 tabular-nums text-emerald-700 sm:text-lg sm:leading-6">
                                {formatCurrency(bill.pendingAmount)}
                              </p>
                            </div>
                            <div className="col-span-2 mt-0.5 flex flex-col items-start gap-1 text-xs leading-5 text-gray-500 sm:mt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
                              <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 sm:py-1">
                                到期 {formatDate(bill.dueDate)}
                              </span>
                              {bill.period ? (
                                <span className="inline-flex w-full items-center rounded-full bg-gray-50 px-2 py-0.5 text-left sm:w-auto sm:py-1">
                                  {bill.period}
                                </span>
                              ) : null}
                              {isFutureBill ? (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-amber-700 sm:py-1">
                                  未来期
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {showOriginalAmount || hasReceivedAmount ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-dashed border-gray-200 pt-2 text-xs leading-5 text-gray-500 sm:pt-2.5">
                        {showOriginalAmount ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                            <span className="text-[11px] leading-4 text-gray-500">
                              原额
                            </span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(bill.amount)}
                            </span>
                          </span>
                        ) : null}
                        {hasReceivedAmount ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                            <span className="text-[11px] leading-4 text-gray-500">
                              已收
                            </span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(bill.receivedAmount)}
                            </span>
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
