'use client'

import {
  Calendar,
  CreditCard,
  Droplets,
  FileText,
  Home,
  ReceiptText,
} from 'lucide-react'

import type { BillDueSummaryWindow } from '@/lib/bill-due-summary'
import { formatCurrency, formatDate } from '@/lib/format'
import type { ContractWithDetailsForClient } from '@/types/database'

import { AggregatedBillTemplateCard } from './AggregatedBillTemplateCard'

type ContractBill = NonNullable<ContractWithDetailsForClient['bills']>[number]

interface BillDueSummaryCardProps {
  contract: ContractWithDetailsForClient
  selectedBills: ContractBill[]
  window: BillDueSummaryWindow
}

function getBillTypeLabel(type: ContractBill['type']): string {
  switch (type) {
    case 'RENT':
      return '租金'
    case 'DEPOSIT':
      return '押金'
    case 'UTILITIES':
      return '水电费'
    case 'OTHER':
      return '其他费用'
    default:
      return type
  }
}

function getBillTypeIcon(type: ContractBill['type']) {
  switch (type) {
    case 'RENT':
      return <Home className="h-4 w-4 text-blue-600" />
    case 'DEPOSIT':
      return <ReceiptText className="h-4 w-4 text-violet-600" />
    case 'UTILITIES':
      return <Droplets className="h-4 w-4 text-cyan-600" />
    case 'OTHER':
      return <FileText className="h-4 w-4 text-amber-600" />
    default:
      return <FileText className="h-4 w-4 text-gray-600" />
  }
}

function getBillTypeRowStyle(type: ContractBill['type']) {
  switch (type) {
    case 'RENT':
      return {
        containerClassName: 'bg-blue-50',
        amountClassName: 'text-blue-700',
      }
    case 'DEPOSIT':
      return {
        containerClassName: 'bg-violet-50',
        amountClassName: 'text-violet-700',
      }
    case 'UTILITIES':
      return {
        containerClassName: 'bg-cyan-50',
        amountClassName: 'text-cyan-700',
      }
    case 'OTHER':
      return {
        containerClassName: 'bg-amber-50',
        amountClassName: 'text-amber-700',
      }
    default:
      return {
        containerClassName: 'bg-gray-50',
        amountClassName: 'text-gray-700',
      }
  }
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
      notice={
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <div className="font-medium">本次账单周期：{window.periodLabel}</div>
          <div className="mt-1">
            请核对本次账单明细与对应金额，并按页面所列账单项目完成支付。
          </div>
        </div>
      }
      summarySlot={
        <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 p-4">
          <div className="mb-4 flex justify-center">
            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
              待支付
            </span>
          </div>

          <div className="border-y border-blue-200/50 py-3 text-center">
            <p className="mb-1 text-sm text-gray-600">本次应付金额</p>
            <p className="mb-2 text-4xl font-bold text-green-600">
              {formatCurrency(totals.pendingAmount)}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs text-gray-500">账单总额</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(totals.amount)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">已收金额</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(totals.receivedAmount)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">账单数量</p>
              <p className="text-lg font-semibold text-purple-600">
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
        const rowStyle = getBillTypeRowStyle(bill.type)

        return {
          id: bill.id,
          title: (
            <div className="break-all">
              {getBillTypeLabel(bill.type)} · {bill.billNumber}
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
          amount: formatCurrency(bill.pendingAmount),
          icon: getBillTypeIcon(bill.type),
          containerClassName: rowStyle.containerClassName,
          amountClassName: rowStyle.amountClassName,
        }
      })}
      emptyBreakdownText="当前没有可展示的账单项目，请先在左侧选择本次需要汇总的账单。"
      footer={
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          本页账单金额已按当前所选项目汇总，请以本页展示的账单明细和应付金额为准。
        </div>
      }
    />
  )
}
