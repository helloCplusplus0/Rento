import { NextRequest } from 'next/server'

import { billQueries } from '@/lib/queries'

/**
 * 更新账单状态API
 * PATCH /api/bills/[id]/status
 *
 * 请求体:
 * {
 *   status: 'PENDING' | 'PAID' | 'OVERDUE' | 'COMPLETED',
 *   receivedAmount?: number,
 *   pendingAmount?: number,
 *   paidDate?: string,
 *   paymentMethod?: string,
 *   operator?: string,
 *   remarks?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      status,
      receivedAmount,
      pendingAmount,
      paidDate,
      paymentMethod,
      operator,
      remarks,
    } = body

    // 基础数据验证
    if (!status) {
      return Response.json({ error: 'Status is required' }, { status: 400 })
    }

    // 验证状态值
    const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status value' }, { status: 400 })
    }

    // 检查账单是否存在
    const existingBill = await billQueries.findById(id)
    if (!existingBill) {
      return Response.json({ error: 'Bill not found' }, { status: 404 })
    }

    const updateData: any = { status }

    // 根据状态添加相应字段
    if (status === 'PAID') {
      if (receivedAmount !== undefined) {
        // 验证收款金额
        if (receivedAmount < 0) {
          return Response.json(
            { error: 'Received amount cannot be negative' },
            { status: 400 }
          )
        }
        updateData.receivedAmount = receivedAmount
      }

      if (pendingAmount !== undefined) {
        updateData.pendingAmount = pendingAmount
      }

      if (paidDate) {
        updateData.paidDate = new Date(paidDate)
      }

      if (paymentMethod) {
        updateData.paymentMethod = paymentMethod
      }

      if (operator) {
        updateData.operator = operator
      }
    }

    if (remarks) {
      updateData.remarks = remarks
    }

    const updatedBill = await billQueries.update(id, updateData)

    // 转换 Decimal 类型为 number
    const billData = {
      ...updatedBill,
      amount: Number(updatedBill.amount),
      receivedAmount: Number(updatedBill.receivedAmount),
      pendingAmount: Number(updatedBill.pendingAmount),
      contract: {
        ...updatedBill.contract,
        monthlyRent: Number(updatedBill.contract.monthlyRent),
        totalRent: Number(updatedBill.contract.totalRent),
        deposit: Number(updatedBill.contract.deposit),
        keyDeposit: updatedBill.contract.keyDeposit
          ? Number(updatedBill.contract.keyDeposit)
          : null,
        cleaningFee: updatedBill.contract.cleaningFee
          ? Number(updatedBill.contract.cleaningFee)
          : null,
      },
    }

    return Response.json(billData)
  } catch (error) {
    console.error('Failed to update bill status:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
