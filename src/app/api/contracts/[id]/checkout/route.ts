import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  parseRequestBody,
  validateRequired,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { getOptionalSession } from '@/lib/auth/guard'
import { contractDomainService } from '@/lib/domain/contracts'
import { ErrorType } from '@/lib/error-logger'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'

/**
 * compat wrapper:
 * phase09-05 起退租结算的正式事务编排迁入 src/lib/domain/contracts，
 * 当前旧 Next 入口只负责请求适配、会话透传与页面缓存失效。
 * 退出条件：前端与调用方全部切到统一 Hono 宿主后移除。
 */
async function handleCheckoutCompat(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params
  const body = await parseRequestBody(request)

  validateRequired(body, ['checkoutDate', 'checkoutReason'])
  if (!Array.isArray(body.settlementItems) || body.settlementItems.length === 0) {
    throw new Error('缺少正式结算明细，请刷新页面后重试')
  }

  const session = await getOptionalSession(request)
  const result = await contractDomainService.checkoutContract({
    contractId,
    checkoutDate: body.checkoutDate,
    checkoutReason: body.checkoutReason,
    damageAssessment: body.damageAssessment,
    finalMeterReadings: body.finalMeterReadings,
    remarks: body.remarks,
    settlementItems: body.settlementItems,
    operator: session?.username ?? '管理员',
  })

  await revalidateMutationPaths({
    scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters', 'meters'],
    detailPaths: [
      `/contracts/${contractId}`,
      `/rooms/${result.contract.roomId}`,
      `/renters/${result.contract.renterId}`,
    ],
  })

  return createSuccessResponse(
    {
      contractId,
      contract: result.contract,
      settlement: result.settlement,
      meterProcessing: result.meterProcessing,
      settlementBillId: result.settlementBillId,
      oldBills: result.oldBills,
      factSnapshot: result.factSnapshot,
      consistency: result.consistency,
      compatMode: true,
      migrationHost: 'src/lib/domain/contracts',
    },
    '退租成功'
  )
}

export const POST = withApiErrorHandler(handleCheckoutCompat, {
  requireAuth: true,
  module: 'checkout-contract-api',
  errorType: ErrorType.VALIDATION_ERROR,
  enableFallback: true,
})
