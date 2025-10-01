'use client'

import { useMemo } from 'react'
import {
  Calendar,
  CreditCard,
  FileText,
  Home,
  Key,
  Sparkles,
} from 'lucide-react'

import { formatCurrency } from '@/lib/format'
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
  billNumber: string
  amount: number
  dueDate: Date
  period: string
  description: string
  icon: React.ReactNode
  color: string
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
        icon: <Home className="h-4 w-4" />,
        color: 'bg-blue-500',
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
        icon: <Key className="h-4 w-4" />,
        color: 'bg-orange-500',
      })
    }

    // 3. 清洁费账单
    if (contractData.cleaningFee && contractData.cleaningFee > 0) {
      bills.push({
        id: 'cleaningFee',
        type: 'OTHER',
        billNumber: `BILL${contractNumber.slice(-3)}O${Date.now().toString().slice(-6)}`,
        amount: contractData.cleaningFee,
        dueDate: startDate,
        period: `${startDate.toISOString().slice(0, 10)} 至 ${endDate.toISOString().slice(0, 10)}`,
        description: '清洁费 - 合同生效时收取',
        icon: <Sparkles className="h-4 w-4" />,
        color: 'bg-green-500',
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
              {/* 账单图标 */}
              <div
                className={`h-10 w-10 rounded-full ${bill.color} flex items-center justify-center text-white`}
              >
                {bill.icon}
              </div>

              {/* 账单信息 */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {bill.description}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {bill.type === 'RENT'
                      ? '租金'
                      : bill.type === 'DEPOSIT'
                        ? '押金'
                        : '其他'}
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
  const bills: PreviewBill[] = []
  const startDate = new Date(contractData.startDate)
  const endDate = new Date(contractData.endDate)
  const paymentMethod = contractData.paymentMethod || '月付'

  // 解析支付周期
  const paymentCycle = parsePaymentCycle(paymentMethod)
  const rentAmount = calculateRentAmount(contractData.monthlyRent, paymentCycle)

  // 计算所有账单周期
  const periods = calculateAllBillPeriods(startDate, endDate, paymentCycle)

  periods.forEach((period, index) => {
    bills.push({
      id: `rent-${index}`,
      type: 'RENT',
      billNumber: `BILL${contractNumber.slice(-3)}R${Date.now().toString().slice(-6)}`,
      amount: rentAmount,
      dueDate: period.dueDate,
      period: `${period.periodStart.toISOString().slice(0, 10)} 至 ${period.periodEnd.toISOString().slice(0, 10)}`,
      description: `${paymentCycle}租金账单 - 第${index + 1}期`,
      icon: <Home className="h-4 w-4" />,
      color: 'bg-indigo-500',
    })
  })

  return bills
}

/**
 * 解析支付周期
 */
function parsePaymentCycle(paymentMethod: string): string {
  if (paymentMethod.includes('季') || paymentMethod.includes('三个月'))
    return '季付'
  if (paymentMethod.includes('半年') || paymentMethod.includes('六个月'))
    return '半年付'
  if (paymentMethod.includes('年') || paymentMethod.includes('十二个月'))
    return '年付'
  return '月付'
}

/**
 * 计算租金金额
 */
function calculateRentAmount(
  monthlyRent: number,
  paymentCycle: string
): number {
  switch (paymentCycle) {
    case '季付':
      return monthlyRent * 3
    case '半年付':
      return monthlyRent * 6
    case '年付':
      return monthlyRent * 12
    default:
      return monthlyRent
  }
}

/**
 * 计算所有账单周期
 */
function calculateAllBillPeriods(
  startDate: Date,
  endDate: Date,
  paymentCycle: string
) {
  const periods = []
  let currentStart = new Date(startDate)

  // 计算周期间隔（月数）
  const monthsInterval =
    paymentCycle === '季付'
      ? 3
      : paymentCycle === '半年付'
        ? 6
        : paymentCycle === '年付'
          ? 12
          : 1

  while (currentStart < endDate) {
    const currentEnd = new Date(currentStart)
    currentEnd.setMonth(currentEnd.getMonth() + monthsInterval)

    // 确保不超过合同结束日期
    if (currentEnd > endDate) {
      currentEnd.setTime(endDate.getTime())
    }

    // 到期日期通常是周期开始日期
    const dueDate = new Date(currentStart)

    periods.push({
      periodStart: new Date(currentStart),
      periodEnd: new Date(currentEnd),
      dueDate,
    })

    // 移动到下一个周期
    currentStart = new Date(currentEnd)
    currentStart.setDate(currentStart.getDate() + 1)
  }

  return periods
}
