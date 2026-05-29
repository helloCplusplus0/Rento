'use client'

import { useMemo } from 'react'
import { Calendar, CreditCard, FileText } from 'lucide-react'

import {
  getBillDisplayLabel,
  getBillVisualConfig,
} from '@/lib/bill-display'
import { formatCurrency } from '@/lib/format'
import { buildContractRentBillPlan } from '@/lib/contract-payment-cycle'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ContractFormData {
  startDate: string
  endDate: string
  monthlyRent: number
  deposit: number
  keyDeposit?: number
  cleaningFee?: number
  paymentMethod?: string
}

interface ContractBillPreviewProps {
  contractData: ContractFormData
  className?: string
}

interface PreviewBill {
  id: string
  type: 'DEPOSIT' | 'RENT' | 'OTHER'
  itemLabel?: string
  remarks?: string
  billNumber: string
  amount: number
  dueDate: Date
  period: string
  description: string
}

/**
 * 合同账单预览组件
 * 展示合同创建时将自动生成的所有账单
 */
export function ContractBillPreview({
  contractData,
  className,
}: ContractBillPreviewProps) {
  // 生成预览账单数据
  const previewBills = useMemo(() => {
    const bills: PreviewBill[] = []
    const startDate = new Date(contractData.startDate)
    const endDate = new Date(contractData.endDate)
    const contractNumber = `CT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}XXXXXX`

    // 1. 押金账单
    if (contractData.deposit > 0) {
      bills.push({
        id: 'deposit',
        type: 'DEPOSIT',
        billNumber: `BILL${contractNumber.slice(-3)}D${Date.now().toString().slice(-6)}`,
        amount: contractData.deposit,
        dueDate: startDate,
        period: `${startDate.toISOString().slice(0, 10)} 至 ${endDate.toISOString().slice(0, 10)}`,
        description: '押金账单 - 合同生效时收取',
      })
    }

    // 2. 钥匙押金账单
    if (contractData.keyDeposit && contractData.keyDeposit > 0) {
      bills.push({
        id: 'keyDeposit',
        type: 'OTHER',
        billNumber: `BILL${contractNumber.slice(-3)}O${Date.now().toString().slice(-6)}`,
        amount: contractData.keyDeposit,
        dueDate: startDate,
        period: `${startDate.toISOString().slice(0, 10)} 至 ${endDate.toISOString().slice(0, 10)}`,
        description: '钥匙押金 - 合同生效时收取',
        itemLabel: '钥匙押金',
        remarks: '钥匙押金 - 合同自动生成',
      })
    }

    // 3. 卫生费账单
    if (contractData.cleaningFee && contractData.cleaningFee > 0) {
      bills.push({
        id: 'cleaningFee',
        type: 'OTHER',
        billNumber: `BILL${contractNumber.slice(-3)}O${Date.now().toString().slice(-6)}`,
        amount: contractData.cleaningFee,
        dueDate: startDate,
        period: `${startDate.toISOString().slice(0, 10)} 至 ${endDate.toISOString().slice(0, 10)}`,
        description: '卫生费 - 合同生效时收取',
        itemLabel: '卫生费',
        remarks: '卫生费 - 合同自动生成',
      })
    }

    // 4. 生成租金账单
    const rentBills = generateRentBillsPreview(contractData, contractNumber)
    bills.push(...rentBills)

    return bills.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }, [contractData])

  // 计算统计信息
  const stats = useMemo(() => {
    const totalAmount = previewBills.reduce((sum, bill) => sum + bill.amount, 0)
    const firstPaymentAmount = previewBills
      .filter((bill) => {
        const firstMonth = new Date(contractData.startDate)
        firstMonth.setMonth(firstMonth.getMonth() + 1)
        return bill.dueDate <= firstMonth
      })
      .reduce((sum, bill) => sum + bill.amount, 0)

    return {
      totalBills: previewBills.length,
      totalAmount,
      firstPaymentAmount,
      rentBills: previewBills.filter((bill) => bill.type === 'RENT').length,
      otherBills: previewBills.filter((bill) => bill.type !== 'RENT').length,
    }
  }, [previewBills, contractData.startDate])

  if (previewBills.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          账单预览
        </CardTitle>
        <p className="text-sm text-gray-600">
          合同创建后将自动生成以下 {stats.totalBills} 个账单
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalBills}
            </p>
            <p className="text-xs text-gray-600">总账单数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalAmount)}
            </p>
            <p className="text-xs text-gray-600">总金额</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.firstPaymentAmount)}
            </p>
            <p className="text-xs text-gray-600">首次缴费</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {stats.rentBills}
            </p>
            <p className="text-xs text-gray-600">租金账单</p>
          </div>
        </div>

        <Separator />

        {/* 账单列表 */}
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {previewBills.map((bill, index) => (
            <div
              key={bill.id + index}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
            >
              {(() => {
                const visualConfig = getBillVisualConfig(bill)
                const Icon = visualConfig.icon

                return (
                  <>
              {/* 账单图标 */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${visualConfig.iconClassName}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

              {/* 账单信息 */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {bill.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getBillDisplayLabel(bill)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {bill.dueDate.toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {bill.billNumber}
                        </span>
                      </div>
                    </div>

              {/* 金额 */}
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {formatCurrency(bill.amount)}
                      </p>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          首期
                        </Badge>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          ))}
        </div>

        {/* 提示信息 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>提示：</strong>
            这些账单将在合同创建成功后自动生成，您可以在合同详情页面查看和管理所有账单。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 生成租金账单预览
 */
function generateRentBillsPreview(
  contractData: ContractFormData,
  contractNumber: string
): PreviewBill[] {
  const rentBillPlan = buildContractRentBillPlan(
    new Date(contractData.startDate),
    new Date(contractData.endDate),
    contractData.monthlyRent,
    contractData.paymentMethod
  )

  return rentBillPlan.periods.map((period) => {
    return {
      id: `rent-${period.index}`,
      type: 'RENT',
      billNumber: `BILL${contractNumber.slice(-3)}R${Date.now().toString().slice(-6)}`,
      amount: rentBillPlan.rentAmountPerPeriod,
      dueDate: period.dueDate,
      period: period.periodLabel,
      description: `${rentBillPlan.paymentCycleLabel}租金账单 - 第${period.index}期`,
    }
  })
}
