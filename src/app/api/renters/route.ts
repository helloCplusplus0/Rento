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

  if (search || contractStatus || hasActiveContract || buildingId) {
    // 使用搜索功能
    const result = await renterQueries.searchRenters({
      query: (search as string) || undefined,
      filters: {
        contractStatus: (contractStatus as any) || null,
        hasActiveContract:
          hasActiveContract === true
            ? true
            : hasActiveContract === false
              ? false
              : undefined,
        buildingId: (buildingId as string) || null,
      },
      pagination: { page, limit },
      sort: {
        field: sortField as 'name' | 'phone' | 'moveInDate' | 'createdAt',
        order: sortOrder as 'asc' | 'desc',
      },
    })

    // 转换 Decimal 类型为 number
    const rentersData = {
      ...result,
      renters: result.renters.map((renter) => ({
        ...renter,
        contracts: renter.contracts.map((contract) => ({
          ...contract,
          monthlyRent: Number(contract.monthlyRent),
          totalRent: Number(contract.totalRent),
          deposit: Number(contract.deposit),
          keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
          cleaningFee: contract.cleaningFee
            ? Number(contract.cleaningFee)
            : null,
        })),
      })),
    }

    return createSuccessResponse(rentersData)
  } else {
    // 获取所有租客
    const renters = await renterQueries.findAll()

    // 转换 Decimal 类型为 number
    const rentersData = renters.map((renter) => ({
      ...renter,
      contracts: renter.contracts.map((contract) => ({
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
      total: rentersData.length,
      page: 1,
      limit: rentersData.length,
      totalPages: 1,
    })
  }
}

export const GET = withApiErrorHandler(handleGetRenters, {
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
  return createSuccessResponse(renter, '租客创建成功')
}

export const POST = withApiErrorHandler(handlePostRenters, {
  module: 'renters-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
