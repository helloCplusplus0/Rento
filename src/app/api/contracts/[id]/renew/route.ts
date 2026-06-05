import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  parseRequestBody,
  validateRequired,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { contractDomainService } from '@/lib/domain/contracts'
import { ErrorType } from '@/lib/error-logger'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'

/**
 * compat wrapper:
 * phase09-05 起续租与补账单关联编排迁入 src/lib/domain/contracts，
 * 当前旧 Next 入口只负责请求适配与缓存失效。
 * 退出条件：前端与调用方全部切到统一 Hono 宿主后移除。
 */
async function handleRenewContractCompat(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: originalContractId } = await params
  const body = await parseRequestBody(request)

  const {
    newStartDate,
    newEndDate,
    newMonthlyRent,
    newDeposit,
    newKeyDeposit,
    newCleaningFee,
    paymentMethod,
    paymentTiming,
    signedBy,
    signedDate,
    remarks,
  } = body

  // 基础字段验证
  validateRequired(body, ['newStartDate', 'newEndDate', 'newMonthlyRent'])

  const result = await contractDomainService.renewContract({
    originalContractId,
    newStartDate,
    newEndDate,
    newMonthlyRent,
    newDeposit,
    newKeyDeposit,
    newCleaningFee,
    paymentMethod,
    paymentTiming,
    signedBy,
    signedDate,
    remarks,
  })

  await revalidateMutationPaths({
    scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
    detailPaths: [
      `/contracts/${originalContractId}`,
      `/contracts/${result.newContract.id}`,
      `/rooms/${result.newContract.roomId}`,
      `/renters/${result.newContract.renterId}`,
    ],
  })

  return createSuccessResponse(
    {
      ...result,
      compatMode: true,
      migrationHost: 'src/lib/domain/contracts',
    },
    result.billGeneration.success ? '续租成功' : '续租成功，补账单生成需人工复核'
  )
}

export const POST = withApiErrorHandler(handleRenewContractCompat, {
  requireAuth: true,
  module: 'renew-contract-api',
  errorType: ErrorType.VALIDATION_ERROR,
  enableFallback: true,
})
