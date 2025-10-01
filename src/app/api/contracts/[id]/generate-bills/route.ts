import { NextRequest } from 'next/server'

import { generateBillsOnContractSigned } from '@/lib/auto-bill-generator'
import type { FallbackResult } from '@/lib/fallback-manager'

/**
 * 账单数据接口
 */
interface BillData {
  id: string
  billNumber: string
  type: string
  amount: number | string
  dueDate: Date
  status: string
  remarks?: string
}

/**
 * 合同签订时自动生成账单API
 * POST /api/contracts/[id]/generate-bills
 *
 * 当合同状态变更为ACTIVE时，自动触发账单生成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return Response.json({ error: '合同ID不能为空' }, { status: 400 })
    }

    // 调用自动生成账单函数
    const generatedBills = await generateBillsOnContractSigned(id)

    // 检查返回结果类型
    if (!Array.isArray(generatedBills)) {
      // 如果是FallbackResult类型，处理回退结果
      const fallbackResult = generatedBills as FallbackResult
      if (fallbackResult.success && Array.isArray(fallbackResult.result)) {
        const bills = fallbackResult.result as BillData[]
        return Response.json({
          success: true,
          message: `成功为合同 ${id} 生成 ${bills.length} 个账单（通过回退机制）`,
          bills: bills.map((bill: BillData) => ({
            id: bill.id,
            billNumber: bill.billNumber,
            type: bill.type,
            amount: Number(bill.amount),
            dueDate: bill.dueDate,
            status: bill.status,
            remarks: bill.remarks,
          })),
        })
      } else {
        throw new Error(fallbackResult.error?.message || '账单生成失败')
      }
    }

    // 正常的账单数组结果
    const bills = generatedBills as BillData[]
    return Response.json({
      success: true,
      message: `成功为合同 ${id} 生成 ${bills.length} 个账单`,
      bills: bills.map((bill: BillData) => ({
        id: bill.id,
        billNumber: bill.billNumber,
        type: bill.type,
        amount: Number(bill.amount),
        dueDate: bill.dueDate,
        status: bill.status,
        remarks: bill.remarks,
      })),
    })
  } catch (error) {
    console.error('自动生成账单失败:', error)

    return Response.json(
      {
        success: false,
        error: '自动生成账单失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
