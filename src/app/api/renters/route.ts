import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  parsePaginationParams,
  parseQueryParams,
  parseRequestBody,
  validateRequired,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { optimizedRenterQueries } from '@/lib/optimized-queries'
import { renterQueries } from '@/lib/queries'

/**
 * 获取租客列表API（支持搜索筛选）
 * GET /api/renters
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

  const result = await optimizedRenterQueries.findWithPagination(
    { page, limit },
    {
      search: (search as string) || undefined,
      contractStatus: (contractStatus as any) || undefined,
      hasActiveContract:
        hasActiveContract === true
          ? true
          : hasActiveContract === false
            ? false
            : undefined,
      buildingId: (buildingId as string) || undefined,
    },
    {
      field: sortField as 'name' | 'phone' | 'moveInDate' | 'createdAt',
      order: sortOrder as 'asc' | 'desc',
    }
  )

  const rentersData = result.data.map((renter) => ({
    ...renter,
    contracts: renter.contracts.map((contract: any) => ({
      ...contract,
      monthlyRent: Number(contract.monthlyRent),
      totalRent: Number(contract.totalRent),
      deposit: Number(contract.deposit),
      keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
      cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
    })),
  }))

  return createSuccessResponse({
    renters: rentersData,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasNext: result.hasNext,
    hasPrev: result.hasPrev,
  })
}

export const GET = withApiErrorHandler(handleGetRenters, {
  requireAuth: true,
  module: 'renters-api',
  errorType: ErrorType.DATABASE_ERROR,
})

/**
 * 创建租客API
 * POST /api/renters
 */
async function handlePostRenters(request: NextRequest) {
  const data = await parseRequestBody(request)

  // 基础字段验证
  validateRequired(data, ['name', 'phone'])

  // 检查手机号是否已存在
  const existingRenter = await renterQueries.findByPhone(data.phone)
  if (existingRenter) {
    throw new Error('手机号已存在')
  }

  // 处理日期字段
  const renterData = {
    ...data,
    moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
  }

  const renter = await renterQueries.create(renterData)

  await revalidateMutationPaths({
    scopes: ['dashboard', 'renters'],
    detailPaths: [`/renters/${renter.id}`],
  })

  return createSuccessResponse(renter, '租客创建成功')
}

export const POST = withApiErrorHandler(handlePostRenters, {
  requireAuth: true,
  module: 'renters-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
