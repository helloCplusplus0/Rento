'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, RotateCcw } from 'lucide-react'

import {
  buildBillDueSummarySelection,
  type BillDueSummarySelection,
} from '@/lib/bill-due-summary'
import { formatCurrency, formatDate } from '@/lib/format'
import type { ContractWithDetailsForClient } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BillStatusBadge } from '@/components/ui/status-badge'

import { BillDueSummaryCard } from './BillDueSummaryCard'

interface ContractBillDueSummaryDialogProps {
  contract: ContractWithDetailsForClient
  trigger?: React.ReactNode
}

function buildSelectedBillMap(selectedBillIds: string[]) {
  return new Set(selectedBillIds)
}

export function ContractBillDueSummaryDialog({
  contract,
  trigger,
}: ContractBillDueSummaryDialogProps) {
  const [open, setOpen] = useState(false)
  const selection = useMemo<BillDueSummarySelection>(
    () => buildBillDueSummarySelection(contract),
    [contract]
  )
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>(
    selection.defaultSelectedBillIds
  )

  useEffect(() => {
    if (open) {
      setSelectedBillIds(selection.defaultSelectedBillIds)
    }
  }, [open, selection.defaultSelectedBillIds])

  const selectedBillSet = useMemo(
    () => buildSelectedBillMap(selectedBillIds),
    [selectedBillIds]
  )

  const selectedBills = useMemo(
    () =>
      selection.candidateBills.filter((bill) => selectedBillSet.has(bill.id)),
    [selection.candidateBills, selectedBillSet]
  )

  const handleToggleBill = (billId: string) => {
    setSelectedBillIds((currentIds) =>
      currentIds.includes(billId)
        ? currentIds.filter((currentId) => currentId !== billId)
        : [...currentIds, billId]
    )
  }

  const handleResetSelection = () => {
    setSelectedBillIds(selection.defaultSelectedBillIds)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            本次应催缴汇总
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-[calc(100%-1rem)] overflow-x-hidden overflow-y-auto sm:max-w-[min(96vw,1200px)]">
        <DialogHeader>
          <DialogTitle>本次应催缴账单汇总</DialogTitle>
          <DialogDescription>
            该流程只读取当前合同下的原始账单事实。默认按当前支付周期结束日进行预选，你可以在此基础上手动调整本次实际要催缴的账单集合。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">候选账单</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    默认仅预选本次支付窗口内及其之前仍未结清的原始账单，未来期账单保留候选但不会自动纳入。
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetSelection}
                  disabled={
                    selectedBillIds.length === selection.defaultSelectedBillIds.length &&
                    selectedBillIds.every((billId) =>
                      selection.defaultSelectedBillIds.includes(billId)
                    )
                  }
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  恢复默认
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <div className="font-medium">默认支付窗口：{selection.window.periodLabel}</div>
                <div className="mt-1">支付周期：{selection.window.paymentCycleLabel}</div>
                <div className="mt-1">{selection.window.selectionDescription}</div>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                <div>当前合同：{contract.contractNumber}</div>
                <div className="mt-1">
                  预选截止日：{formatDate(selection.window.endDate)}
                </div>
                <div className="mt-1">
                  已选 {selectedBillIds.length} / {selection.candidateBills.length} 张
                </div>
              </div>

              {selection.candidateBills.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-gray-500">
                  当前合同下没有待催缴的候选账单。
                </div>
              ) : (
                <div className="space-y-3">
                  {selection.candidateBills.map((bill) => {
                    const checked = selectedBillSet.has(bill.id)
                    const isFutureBill = new Date(bill.dueDate) > selection.window.endDate

                    return (
                      <label
                        key={bill.id}
                        className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                          checked
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 accent-blue-600"
                          checked={checked}
                          onChange={() => handleToggleBill(bill.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {bill.billNumber}
                              </div>
                              <div className="mt-1 text-sm text-gray-600">
                                到期日 {formatDate(bill.dueDate)}
                                {bill.period ? ` · ${bill.period}` : ''}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <BillStatusBadge status={bill.status} />
                              {isFutureBill ? (
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                                  未来期默认不选
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                            <div>
                              <div className="text-gray-500">账单类型</div>
                              <div className="font-medium">
                                {bill.type === 'RENT'
                                  ? '租金'
                                  : bill.type === 'DEPOSIT'
                                    ? '押金'
                                    : bill.type === 'UTILITIES'
                                      ? '水电费'
                                      : '其他费用'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">原始应收</div>
                              <div className="font-medium">
                                {formatCurrency(bill.amount)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">待催缴</div>
                              <div className="font-medium text-orange-600">
                                {formatCurrency(bill.pendingAmount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <BillDueSummaryCard
            contract={contract}
            selectedBills={selectedBills}
            window={selection.window}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
