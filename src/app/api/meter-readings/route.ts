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
import { meterReadingQueries } from '@/lib/queries'

/**
 * 获取抄表记录列表
 * GET /api/meter-readings
 */
async function handleGetMeterReadings(request: NextRequest) {
  const queryParams = parseQueryParams(request)
  const { page, limit, offset } = parsePaginationParams(request)

  // 解析查询参数
  const {
    meterId,
    contractId,
    roomId,
    recordType,
    startDate,
    endDate,
    status,
    meterType,
    search,
    operator,
    dateRange,
  } = queryParams

  let readings: any[]

  if (meterId) {
    // 按仪表查询
    readings = await meterReadingQueries.findByMeter(meterId as string, limit)
  } else if (contractId) {
    // 按合同查询
    readings = await meterReadingQueries.findByContract(contractId as string)
  } else {
    // 处理时间范围筛选
    let actualStartDate: string | undefined
    let actualEndDate: string | undefined

    if (dateRange && dateRange !== 'all') {
      const now = new Date()
      switch (dateRange) {
        case 'today':
          actualStartDate = now.toISOString().split('T')[0]
          actualEndDate = actualStartDate
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          actualStartDate = weekAgo.toISOString().split('T')[0]
          actualEndDate = now.toISOString().split('T')[0]
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          actualStartDate = monthAgo.toISOString().split('T')[0]
          actualEndDate = now.toISOString().split('T')[0]
          break
      }
    } else {
      actualStartDate = startDate as string
      actualEndDate = endDate as string
    }

    // 构建查询条件
    const filters = {
      startDate: actualStartDate,
      endDate: actualEndDate,
      status: status as string,
      meterType: meterType as string,
      recordType: recordType as string,
      search: search as string,
      operator: operator as string,
      roomId: roomId as string,
    }

    readings = await meterReadingQueries.findAll(filters)
  }

  // 转换数据类型
  const readingsData = readings.map((reading: any) => ({
    ...reading,
    previousReading: reading.previousReading
      ? Number(reading.previousReading)
      : null,
    currentReading: Number(reading.currentReading),
    usage: Number(reading.usage),
    unitPrice: Number(reading.unitPrice),
    amount: Number(reading.amount),
    // 确保日期字段正确转换为ISO字符串
    readingDate: reading.readingDate
      ? new Date(reading.readingDate).toISOString()
      : null,
    createdAt: reading.createdAt
      ? new Date(reading.createdAt).toISOString()
      : null,
    updatedAt: reading.updatedAt
      ? new Date(reading.updatedAt).toISOString()
      : null,
    meter: reading.meter
      ? {
          ...reading.meter,
          unitPrice: Number(reading.meter.unitPrice),
          room: reading.meter.room
            ? {
                ...reading.meter.room,
                rent: Number(reading.meter.room.rent),
                area: reading.meter.room.area
                  ? Number(reading.meter.room.area)
                  : null,
                building: reading.meter.room.building
                  ? {
                      ...reading.meter.room.building,
                      totalRooms: Number(
                        reading.meter.room.building.totalRooms
                      ),
                    }
                  : undefined,
              }
            : undefined,
        }
      : undefined,
  }))

  // 获取总数用于分页
  const total = readingsData.length

  return createPaginatedResponse(readingsData, total, page, limit)
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
