import { NextRequest, NextResponse } from 'next/server'
import { contractActivationService } from '@/lib/contract-activation'
import { withApiErrorHandler, createSuccessResponse, parseRequestBody } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'

/**
 * 合同激活API
 * POST /api/contracts/activate - 激活到期的PENDING合同
 * POST /api/contracts/activate - 手动激活指定合同 (带contractId参数)
 */

async function handleActivateContracts(request: NextRequest): Promise<NextResponse> {
  const body = await parseRequestBody(request)
  
  // 如果提供了contractId，执行手动激活
  if (body.contractId) {
    const result = await contractActivationService.manualActivateContract(body.contractId)
    
    if (result.success) {
      return createSuccessResponse({
        message: result.message,
        contractId: body.contractId
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
  }
  
  // 否则执行批量激活
  const result = await contractActivationService.activatePendingContracts()
  
  return createSuccessResponse({
    message: `激活任务完成，成功激活 ${result.activated} 个合同`,
    activated: result.activated,
    errors: result.errors
  })
}

export const POST = withApiErrorHandler(handleActivateContracts, {
  module: 'contracts-activate-api',
  errorType: ErrorType.SYSTEM_ERROR
})