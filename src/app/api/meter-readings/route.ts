import { NextRequest, NextResponse } from 'next/server'
import { meterReadingQueries } from '@/lib/queries'
import { 
  withApiErrorHandler, 
  parseQueryParams, 
  parsePaginationParams,
  createSuccessResponse,
  createPaginatedResponse,
  parseRequestBody,
  validateRequired
} from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'

// 服务端默认设置 - 避免客户端localStorage依赖
const getServerSettings = () => ({
  electricityPrice: 0.6,
  waterPrice: 3.5,
  usageAnomalyThreshold: 3.0,
  autoGenerateBills: true,
  requireReadingApproval: false
})

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
    startDate,
    endDate,
    status,
    meterType,
    search,
    operator,
    dateRange
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
      search: search as string,
      operator: operator as string,
      roomId: roomId as string
    }

    readings = await meterReadingQueries.findAll(filters)
  }

  // 转换数据类型
  const readingsData = readings.map((reading: any) => ({
    ...reading,
    previousReading: reading.previousReading ? Number(reading.previousReading) : null,
    currentReading: Number(reading.currentReading),
    usage: Number(reading.usage),
    unitPrice: Number(reading.unitPrice),
    amount: Number(reading.amount),
    // 确保日期字段正确转换为ISO字符串
    readingDate: reading.readingDate ? new Date(reading.readingDate).toISOString() : null,
    createdAt: reading.createdAt ? new Date(reading.createdAt).toISOString() : null,
    updatedAt: reading.updatedAt ? new Date(reading.updatedAt).toISOString() : null,
    meter: reading.meter ? {
      ...reading.meter,
      unitPrice: Number(reading.meter.unitPrice),
      room: reading.meter.room ? {
        ...reading.meter.room,
        rent: Number(reading.meter.room.rent),
        area: reading.meter.room.area ? Number(reading.meter.room.area) : null,
        building: reading.meter.room.building ? {
          ...reading.meter.room.building,
          totalRooms: Number(reading.meter.room.building.totalRooms)
        } : undefined
      } : undefined
    } : undefined
  }))

  // 获取总数用于分页
  const total = readingsData.length

  return createPaginatedResponse(readingsData, total, page, limit)
}

export const GET = withApiErrorHandler(handleGetMeterReadings, {
  module: 'meter-readings-api',
  errorType: ErrorType.DATABASE_ERROR
})

/**
 * 创建抄表记录
 * POST /api/meter-readings
 */
async function handlePostMeterReadings(request: NextRequest) {
  const body = await parseRequestBody(request)
  const { readings, validateOnly = false, aggregationMode = 'AGGREGATED' } = body

  validateRequired(body, ['readings'])
  
  if (!Array.isArray(readings) || readings.length === 0) {
    throw new Error('请提供有效的抄表数据数组')
  }

  const settings = getServerSettings()
  const results = []
  const warnings = []
  const errors = []

  // 处理每个抄表记录
  for (const readingData of readings) {
    try {
      validateRequired(readingData, ['meterId', 'currentReading'])

      // 获取仪表信息进行验证
      const { meterQueries } = await import('@/lib/queries')
      const meter = await meterQueries.findById(readingData.meterId)
      if (!meter) {
        errors.push({
          meterId: readingData.meterId,
          error: '仪表不存在'
        })
        continue
      }

      // 检查重复记录
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const existingReading = await meterReadingQueries.findAll({
        limit: 1,
        startDate: todayStart.toISOString(),
        endDate: todayEnd.toISOString()
      })
      
      const duplicateReading = existingReading.find(r => r.meterId === readingData.meterId)
      if (duplicateReading) {
        warnings.push({
          meterId: readingData.meterId,
          warning: `今日已存在该仪表的抄表记录，当前读数: ${duplicateReading.currentReading}`
        })
        continue
      }

      // 如果不是验证模式，创建记录
       if (!validateOnly) {
         // 计算用量和金额
         const usage = readingData.currentReading - (readingData.previousReading || 0)
         const unitPrice = readingData.unitPrice || meter.unitPrice || 0
         const amount = usage * unitPrice

         const createdReading = await meterReadingQueries.create({
           meterId: readingData.meterId,
           contractId: readingData.contractId,
           currentReading: readingData.currentReading,
           previousReading: readingData.previousReading || 0,
           usage,
           readingDate: readingData.readingDate || new Date(),
           unitPrice,
           amount,
           operator: readingData.operator || 'system',
           remarks: readingData.remarks
         })
         
         results.push(createdReading)
       }

    } catch (error) {
      errors.push({
        meterId: readingData.meterId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // 自动生成账单逻辑（简化版）
  if (settings.autoGenerateBills && results.length > 0) {
    try {
      const { generateAggregatedUtilityBill } = await import('@/lib/bill-aggregation')
      // 这里可以添加账单生成逻辑
    } catch (billError) {
      warnings.push({
        warning: '抄表记录已保存，但自动生成账单失败'
      })
    }
  }

  return createSuccessResponse({
    results,
    warnings,
    errors,
    summary: {
      total: readings.length,
      success: results.length,
      warnings: warnings.length,
      errors: errors.length
    }
  }, `成功处理 ${results.length} 个抄表记录${warnings.length > 0 ? `，${warnings.length} 个警告` : ''}${errors.length > 0 ? `，${errors.length} 个错误` : ''}`)
}

export const POST = withApiErrorHandler(handlePostMeterReadings, {
  module: 'meter-readings-api',
  errorType: ErrorType.BILL_GENERATION,
  enableFallback: true
})