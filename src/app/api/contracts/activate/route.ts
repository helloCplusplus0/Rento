import { NextRequest, NextResponse } from 'next/server'

import {
  createSuccessResponse,
  parseRequestBody,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { contractLifecycleService } from '@/lib/domain/contracts'
import { ErrorType } from '@/lib/error-logger'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'

/**
 * 合同激活API
 * POST /api/contracts/activate - 激活到期的PENDING合同
 * POST /api/contracts/activate - 手动激活指定合同 (带contractId参数)
 *
 * compat wrapper:
 * phase09-02 起正式业务真相下沉到 src/lib/domain/contracts，
 * 当前 Next 入口仅保留请求/响应兼容层，避免继续维护第二套激活逻辑。
 */

async function handleActivateContracts(
  request: NextRequest
): Promise<NextResponse> {
  const body = await parseRequestBody(request)

  // 如果提供了contractId，执行手动激活
  if (body.contractId) {
    const result = await contractLifecycleService.manualActivateContract(
      body.contractId
    )

    if (result.success) {
      await revalidateMutationPaths({
        scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
        detailPaths: [`/contracts/${body.contractId}`],
      })

      return createSuccessResponse({
        message: result.message,
        contractId: body.contractId,
      })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  }

  // 否则执行批量激活
  const result = await contractLifecycleService.activatePendingContracts()

  await revalidateMutationPaths({
    scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
  })

  return createSuccessResponse({
    message: `激活任务完成，成功激活 ${result.activated} 个合同`,
    activated: result.activated,
    errors: result.errors,
  })
}

export const POST = withApiErrorHandler(handleActivateContracts, {
  requireAuth: true,
  module: 'contracts-activate-api',
  errorType: ErrorType.SYSTEM_ERROR,
})
