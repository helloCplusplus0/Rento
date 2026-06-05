import { NextRequest } from 'next/server'

import { contractDomainService } from '@/lib/domain/contracts'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'

/**
 * compat wrapper:
 * phase09-05 起合同补账单关联编排迁入 src/lib/domain/contracts，
 * 当前旧 Next 入口只负责请求适配与缓存失效。
 * 退出条件：前端与调用方全部切到统一 Hono 宿主后移除。
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return Response.json({ error: '合同ID不能为空' }, { status: 400 })
    }

    const result = await contractDomainService.generateContractBills(id, {
      mode: 'auto',
    })

    await revalidateMutationPaths({
      scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
      detailPaths: [`/contracts/${id}`],
    })

    return Response.json({
      success: true,
      message:
        result.generationMode === 'GENERATE_BASE'
          ? `成功为合同 ${id} 生成 ${result.generatedBills.length} 个基础账单`
          : `成功为合同 ${id} 补齐 ${result.generatedBills.length} 个缺失租金账单`,
      compatMode: true,
      migrationHost: 'src/lib/domain/contracts',
      ...result,
    })
  } catch (error) {
    console.error('合同补账单失败:', error)

    return Response.json(
      {
        success: false,
        error: '合同补账单失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
