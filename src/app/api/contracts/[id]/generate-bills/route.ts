import { NextRequest } from 'next/server'
import { generateBillsOnContractSigned } from '@/lib/auto-bill-generator'

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
      return Response.json(
        { error: '合同ID不能为空' },
        { status: 400 }
      )
    }

    // 调用自动生成账单函数
    const generatedBills = await generateBillsOnContractSigned(id)

    return Response.json({
      success: true,
      message: `成功为合同 ${id} 生成 ${generatedBills.length} 个账单`,
      bills: generatedBills.map(bill => ({
        id: bill.id,
        billNumber: bill.billNumber,
        type: bill.type,
        amount: Number(bill.amount),
        dueDate: bill.dueDate,
        status: bill.status,
        remarks: bill.remarks
      }))
    })

  } catch (error) {
    console.error('自动生成账单失败:', error)
    
    return Response.json(
      { 
        error: '自动生成账单失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}