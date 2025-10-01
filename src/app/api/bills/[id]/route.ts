import { NextRequest } from 'next/server'

import { billQueries } from '@/lib/queries'

/**
 * 获取账单详情API
 * GET /api/bills/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bill = await billQueries.findById(id)

    if (!bill) {
      return Response.json({ error: 'Bill not found' }, { status: 404 })
    }

    // 转换 Decimal 类型为 number
    const billData = {
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
      contract: {
        ...bill.contract,
        monthlyRent: Number(bill.contract.monthlyRent),
        totalRent: Number(bill.contract.totalRent),
        deposit: Number(bill.contract.deposit),
        keyDeposit: bill.contract.keyDeposit
          ? Number(bill.contract.keyDeposit)
          : null,
        cleaningFee: bill.contract.cleaningFee
          ? Number(bill.contract.cleaningFee)
          : null,
      },
    }

    return Response.json(billData)
  } catch (error) {
    console.error('Failed to fetch bill:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * 更新账单API
 * PATCH /api/bills/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // 检查账单是否存在
    const existingBill = await billQueries.findById(id)
    if (!existingBill) {
      return Response.json({ error: 'Bill not found' }, { status: 404 })
    }

    // 权限检查：只有PENDING状态的账单才能编辑关键信息
    if (existingBill.status !== 'PENDING') {
      return Response.json(
        {
          error: 'Only pending bills can be edited',
          message: '只有待付款状态的账单才能编辑关键信息',
        },
        { status: 400 }
      )
    }

    // 提取可编辑的字段
    const { amount, pendingAmount, dueDate, period, remarks } = body

    // 构建更新数据
    const updateData: any = {}

    if (amount !== undefined) {
      // 验证金额
      if (amount <= 0) {
        return Response.json(
          { error: 'Amount must be greater than 0' },
          { status: 400 }
        )
      }
      updateData.amount = amount
    }

    if (pendingAmount !== undefined) {
      updateData.pendingAmount = pendingAmount
    }

    if (dueDate !== undefined) {
      // 验证日期格式
      const parsedDate = new Date(dueDate)
      if (isNaN(parsedDate.getTime())) {
        return Response.json(
          { error: 'Invalid due date format' },
          { status: 400 }
        )
      }
      updateData.dueDate = parsedDate
    }

    if (period !== undefined) {
      updateData.period = period
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks
    }

    // 更新账单
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

    return Response.json({
      success: true,
      message: 'Bill updated successfully',
      data: billData,
    })
  } catch (error) {
    console.error('Failed to update bill:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * 删除账单API
 * DELETE /api/bills/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 检查账单是否存在
    const existingBill = await billQueries.findById(id)
    if (!existingBill) {
      return Response.json({ error: 'Bill not found' }, { status: 404 })
    }

    // 检查是否可以删除
    // 规则：已收款的账单不允许删除（防止数据不一致）
    if (
      existingBill.status === 'PAID' &&
      Number(existingBill.receivedAmount) > 0
    ) {
      return Response.json(
        { error: 'Cannot delete paid bill with received amount' },
        { status: 400 }
      )
    }

    // 已完成的账单不允许删除
    if (existingBill.status === 'COMPLETED') {
      return Response.json(
        { error: 'Cannot delete completed bill' },
        { status: 400 }
      )
    }

    await billQueries.delete(id)

    return Response.json({
      success: true,
      message: 'Bill deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete bill:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
