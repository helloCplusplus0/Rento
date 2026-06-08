import { NextRequest, NextResponse } from 'next/server'

import {
  createPaginatedResponse,
  createSuccessResponse,
  parsePaginationParams,
  parseQueryParams,
  parseRequestBody,
  validateRequired,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import {
  isMeterReadingDomainValidationError,
  meterReadingDomainService,
} from '@/lib/domain/meters'
import { ErrorType } from '@/lib/error-logger'
import { getMeterReadingsPageClosureData } from '@/lib/page-closure-compat/meter-readings'

/**
 * phase13-04 page-closure compat:
 * GET /api/meter-readings
 *
 * Next 与 Hono 共同复用 shared compat helper，避免把 `server/routes/meter-readings.ts`
 * 误判为抄表历史列表已进入 phase14 正式 cutover。
 */
async function handleGetMeterReadings(request: NextRequest) {
  const queryParams = parseQueryParams(request)
  const searchParams = new URL(request.url).searchParams
  const hasExplicitPagination =
    searchParams.has('page') || searchParams.has('limit')
  const { page, limit } = hasExplicitPagination
    ? parsePaginationParams(request)
    : { page: undefined, limit: undefined }
  const data = await getMeterReadingsPageClosureData({
    page,
    limit,
    meterId: (queryParams.meterId as string) || undefined,
    contractId: (queryParams.contractId as string) || undefined,
    roomId: (queryParams.roomId as string) || undefined,
    recordType: (queryParams.recordType as string) || undefined,
    startDate: (queryParams.startDate as string) || undefined,
    endDate: (queryParams.endDate as string) || undefined,
    status: (queryParams.status as string) || undefined,
    meterType: (queryParams.meterType as string) || undefined,
    search: (queryParams.search as string) || undefined,
    operator: (queryParams.operator as string) || undefined,
    dateRange: (queryParams.dateRange as string) || undefined,
  })

  return createPaginatedResponse(
    data.data,
    data.pagination.total,
    data.pagination.page,
    data.pagination.limit
  )
}

export const GET = withApiErrorHandler(handleGetMeterReadings, {
  requireAuth: true,
  module: 'meter-readings-api',
  errorType: ErrorType.DATABASE_ERROR,
})

/**
 * 创建抄表记录
 * POST /api/meter-readings
 *
 * compat wrapper:
 * phase09-04 起正式抄表写入、recordType 语义、自动出账与 Serializable/P2034 事务边界
 * 统一下沉到 src/lib/domain/meters 与 server/routes/meter-readings.ts。
 * 当前 Next 入口仅保留旧请求/响应兼容层，不再维护第二套写入规则。
 */
async function handlePostMeterReadings(request: NextRequest) {
  const body = await parseRequestBody(request)
  validateRequired(body, ['readings'])

  try {
    const result = await meterReadingDomainService.createRegularMeterReadingBatch({
      readings: body.readings,
      validateOnly: body.validateOnly === true,
      aggregationMode: body.aggregationMode,
    })

    return createSuccessResponse(
      {
        ...result,
        compatMode: true,
        migrationHost: 'src/lib/domain/meters',
      },
      `成功处理 ${result.summary.success} 个抄表记录${result.summary.billsGenerated > 0 ? `，生成 ${result.summary.billsGenerated} 个账单` : ''}${result.summary.warnings > 0 ? `，${result.summary.warnings} 个警告` : ''}${result.summary.errors > 0 ? `，${result.summary.errors} 个错误` : ''}`
    )
  } catch (error) {
    if (isMeterReadingDomainValidationError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
          compatMode: true,
          migrationHost: 'src/lib/domain/meters',
        },
        { status: 400 }
      )
    }

    throw error
  }
}

export const POST = withApiErrorHandler(handlePostMeterReadings, {
  requireAuth: true,
  module: 'meter-readings-api',
  errorType: ErrorType.BILL_GENERATION,
  enableFallback: true,
})
