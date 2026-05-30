'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, RotateCcw } from 'lucide-react'

import { getBillDisplayLabel } from '@/lib/bill-display'
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

const contractBillDueSummaryDialogStyles = {
  candidateCard: 'flex cursor-pointer gap-2.5 rounded-lg border p-2.5 transition-colors sm:p-3',
  candidateHeader: 'flex items-start justify-between gap-2',
  candidateMeta: 'mt-0.5 text-[11px] leading-4 text-gray-600 sm:text-sm sm:leading-5',
  candidateBadges: 'flex flex-wrap items-center gap-1.5',
  candidateDetailGrid:
    'mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] leading-4 sm:mt-2.5 sm:grid-cols-3 sm:text-sm sm:leading-5',
  candidateWideDetail: 'col-span-2 sm:col-span-1',
  candidateDetailLabel: 'text-gray-500',
  candidateDetailValue: 'mt-0.5 font-medium break-words text-gray-900',
  candidateDetailAccent: 'mt-0.5 font-medium break-all text-orange-600',
} as const

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

      <DialogContent className="max-w-[calc(100vw-0.75rem)] gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1200px)]">
        <div className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden">
          <DialogHeader className="shrink-0 border-b px-4 py-4 pr-11 text-left sm:px-6 sm:py-5 sm:pr-12">
            <DialogTitle className="text-base leading-6 sm:text-lg">
              本次应催缴账单汇总
            </DialogTitle>
            <DialogDescription className="text-xs leading-5 sm:text-sm">
              该流程只读取当前合同下的原始账单事实。默认按当前支付周期结束日进行预选，你可以在此基础上手动调整本次实际要催缴的账单集合。
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
              <Card className="min-w-0 overflow-hidden py-4 sm:py-6">
                <CardHeader className="space-y-3 px-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-sm leading-6 sm:text-base">
                        候选账单
                      </CardTitle>
                      <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
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
                      className="w-full shrink-0 sm:w-auto"
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      恢复默认
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 px-4 pt-0 sm:space-y-4 sm:px-6">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-700 sm:text-sm">
                    <div className="font-medium">
                      默认支付窗口：{selection.window.periodLabel}
                    </div>
                    <div className="mt-1">
                      支付周期：{selection.window.paymentCycleLabel}
                    </div>
                    <div className="mt-1">
                      {selection.window.selectionDescription}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600 sm:text-sm">
                    <div className="break-all">当前合同：{contract.contractNumber}</div>
                    <div className="mt-1">
                      预选截止日：{formatDate(selection.window.endDate)}
                    </div>
                    <div className="mt-1">
                      已选 {selectedBillIds.length} / {selection.candidateBills.length} 张
                    </div>
                  </div>

                  {selection.candidateBills.length === 0 ? (
                    <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-gray-500">
                      当前合同下没有待催缴的候选账单。
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selection.candidateBills.map((bill) => {
                        const checked = selectedBillSet.has(bill.id)
                        const isFutureBill =
                          new Date(bill.dueDate) > selection.window.endDate

                        return (
                          <label
                            key={bill.id}
                            className={`${contractBillDueSummaryDialogStyles.candidateCard} ${
                              checked
                                ? 'border-blue-200 bg-blue-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-blue-600"
                              checked={checked}
                              onChange={() => handleToggleBill(bill.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <div
                                className={
                                  contractBillDueSummaryDialogStyles.candidateHeader
                                }
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold leading-5 text-gray-900">
                                    {bill.billNumber}
                                  </div>
                                  <div
                                    className={
                                      contractBillDueSummaryDialogStyles.candidateMeta
                                    }
                                  >
                                    到期日 {formatDate(bill.dueDate)}
                                    {bill.period ? ` · ${bill.period}` : ''}
                                  </div>
                                </div>
                                <div
                                  className={
                                    contractBillDueSummaryDialogStyles.candidateBadges
                                  }
                                >
                                  <BillStatusBadge status={bill.status} />
                                  {isFutureBill ? (
                                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                                      未来期默认不选
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div
                                className={
                                  contractBillDueSummaryDialogStyles.candidateDetailGrid
                                }
                              >
                                <div
                                  className={contractBillDueSummaryDialogStyles.candidateWideDetail}
                                >
                                  <div
                                    className={
                                      contractBillDueSummaryDialogStyles.candidateDetailLabel
                                    }
                                  >
                                    账单类型
                                  </div>
                                  <div
                                    className={
                                      contractBillDueSummaryDialogStyles.candidateDetailValue
                                    }
                                  >
                                    {getBillDisplayLabel(bill)}
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className={
                                      contractBillDueSummaryDialogStyles.candidateDetailLabel
                                    }
                                  >
                                    原始应收
                                  </div>
                                  <div
                                    className={
                                      contractBillDueSummaryDialogStyles.candidateDetailValue
                                    }
                                  >
                                    {formatCurrency(bill.amount)}
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className={
                                      contractBillDueSummaryDialogStyles.candidateDetailLabel
                                    }
                                  >
                                    待催缴
                                  </div>
                                  <div
                                    className={
                                      contractBillDueSummaryDialogStyles.candidateDetailAccent
                                    }
                                  >
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
