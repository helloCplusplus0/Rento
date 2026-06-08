import { NextRequest, NextResponse } from 'next/server'

import {
  createSuccessResponse,
  parsePaginationParams,
  parseQueryParams,
  parseRequestBody,
  validateRequired,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import {
  createRenterPageClosureData,
  getRentersPageClosureData,
} from '@/lib/page-closure-compat/renters'

/**
 * phase13-04 page-closure compat:
 * Next 与 Hono 共同复用 shared compat helper，保持租客页面闭环期间
 * 只有一套 API 语义，而不是把 server/routes 视为 phase14 正式 cutover。
 */
async function handleGetRenters(request: NextRequest) {
  const queryParams = parseQueryParams(request)
  const { page, limit } = parsePaginationParams(request)
  const {
    search,
    contractStatus,
    hasActiveContract,
    buildingId,
    sortField = 'name',
    sortOrder = 'asc',
  } = queryParams

  const data = await getRentersPageClosureData({
    page,
    limit,
    search: (search as string) || undefined,
    contractStatus: (contractStatus as string) || undefined,
    hasActiveContract:
      hasActiveContract === true
        ? true
        : hasActiveContract === false
          ? false
          : undefined,
    buildingId: (buildingId as string) || undefined,
    sortField: sortField as 'name' | 'phone' | 'moveInDate' | 'createdAt',
    sortOrder: sortOrder as 'asc' | 'desc',
  })

  return createSuccessResponse(data)
}

export const GET = withApiErrorHandler(handleGetRenters, {
  requireAuth: true,
  module: 'renters-api',
  errorType: ErrorType.DATABASE_ERROR,
})

async function handlePostRenters(request: NextRequest) {
  const data = await parseRequestBody(request)
  validateRequired(data, ['name', 'phone'])

  const result = await createRenterPageClosureData(data)
  if ('error' in result) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      { status: result.status }
    )
  }

  return NextResponse.json(
    {
      success: true,
      data: result.data,
      message: result.message,
    },
    { status: result.status }
  )
}

export const POST = withApiErrorHandler(handlePostRenters, {
  requireAuth: true,
  module: 'renters-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
