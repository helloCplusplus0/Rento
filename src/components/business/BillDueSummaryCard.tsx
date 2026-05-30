'use client'

import {
  Calendar,
  CreditCard,
} from 'lucide-react'

import {
  getBillDisplayLabel,
  getBillVisualConfig,
} from '@/lib/bill-display'
import type { BillDueSummaryWindow } from '@/lib/bill-due-summary'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ContractWithDetailsForClient } from '@/types/database'

import { AggregatedBillTemplateCard } from './AggregatedBillTemplateCard'

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

  return (
    <AggregatedBillTemplateCard
      title="本次应催缴账单汇总"
      badgeText="账单汇总"
      badgeClassName="border-blue-200 bg-blue-50 text-blue-700"
      metaItems={[
        {
          label: '合同编号',
          value: <span className="break-all">{contract.contractNumber}</span>,
        },
        {
          label: '房间信息',
          value: (
            <span className="break-words">
              {contract.room.building.name} - {contract.room.roomNumber}
            </span>
          ),
        },
        {
          label: '租客姓名',
          value: contract.renter.name,
        },
        {
          label: '支付周期',
          value: window.paymentCycleLabel,
        },
      ]}
      metaGridClassName="grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4 sm:gap-y-3 lg:grid-cols-4"
      metaItemLayout="inline"
      notice={
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-700 sm:p-4 sm:text-sm">
          <div className="font-medium">本次账单周期：{window.periodLabel}</div>
          <div className="mt-1 break-words">
            请核对本次账单明细与对应金额，并按页面所列账单项目完成支付。
          </div>
        </div>
      }
      summarySlot={
        <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 p-3 sm:p-4">
          <div className="mb-3 flex justify-center">
            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 sm:text-sm">
              待支付
            </span>
          </div>

          <div className="border-y border-blue-200/50 py-2.5 text-center sm:py-3">
            <p className="mb-1 text-xs text-gray-600 sm:text-sm">本次应付金额</p>
            <p className="text-3xl leading-tight font-bold break-all text-green-600 sm:text-4xl">
              {formatCurrency(totals.pendingAmount)}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:mt-4 sm:gap-4">
            <div>
              <p className="mb-1 text-xs text-gray-500">账单总额</p>
              <p className="text-sm font-semibold break-all text-blue-600 sm:text-lg">
                {formatCurrency(totals.amount)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">已收金额</p>
              <p className="text-sm font-semibold break-all text-green-600 sm:text-lg">
                {formatCurrency(totals.receivedAmount)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">账单数量</p>
              <p className="text-sm font-semibold text-purple-600 sm:text-lg">
                {selectedBills.length} 张
              </p>
            </div>
          </div>
        </div>
      }
      summaryItems={[
        {
          label: '账单总额',
          value: formatCurrency(totals.amount),
          accentClassName: 'text-blue-600',
        },
        {
          label: '已收金额',
          value: formatCurrency(totals.receivedAmount),
          accentClassName: 'text-green-600',
        },
        {
          label: '本次应付',
          value: formatCurrency(totals.pendingAmount),
          accentClassName: 'text-orange-600',
        },
        {
          label: '已选账单',
          value: `${selectedBills.length} 张`,
          accentClassName: 'text-purple-600',
        },
      ]}
      breakdownTitle="账单明细"
      breakdownItems={selectedBills.map((bill) => {
        const visualConfig = getBillVisualConfig(bill)
        const Icon = visualConfig.icon

        return {
          id: bill.id,
          title: (
            <div className="break-words">
              {getBillDisplayLabel(bill)} · {bill.billNumber}
            </div>
          ),
          headerAside: (
            <div className="text-right">
              <div className="text-[11px] leading-4 text-gray-500 sm:text-xs sm:leading-5">
                待催缴
              </div>
              <div
                className={cn(
                  'text-sm font-semibold leading-5 break-all sm:text-base',
                  visualConfig.amountClassName
                )}
              >
                {formatCurrency(bill.pendingAmount)}
              </div>
            </div>
          ),
          description: (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  到期日 {formatDate(bill.dueDate)}
                </span>
                {bill.period ? (
                  <span className="inline-flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    {bill.period}
                  </span>
                ) : null}
              </div>
              <div className="text-xs">
                原账单 {formatCurrency(bill.amount)}，已收{' '}
                {formatCurrency(bill.receivedAmount)}
              </div>
            </div>
          ),
          amount: null,
          icon: <Icon className="h-4 w-4" />,
          containerClassName: visualConfig.containerClassName,
          amountClassName: visualConfig.amountClassName,
        }
      })}
      emptyBreakdownText="当前没有可展示的账单项目，请先在左侧选择本次需要汇总的账单。"
      breakdownListClassName="space-y-2.5"
      breakdownItemClassName="gap-2.5 p-2.5 sm:p-3"
      breakdownLeadingClassName="items-start gap-2"
      breakdownTitleClassName="text-sm font-semibold leading-5 text-gray-900 sm:text-sm"
      breakdownDescriptionClassName="text-[11px] leading-4 text-gray-500 sm:text-xs sm:leading-5"
      breakdownAmountClassName="text-sm font-medium leading-5 sm:text-base"
      footer={
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          本页账单金额已按当前所选项目汇总，请以本页展示的账单明细和应付金额为准。
        </div>
      }
    />
  )
}
