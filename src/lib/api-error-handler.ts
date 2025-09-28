/**
 * API路由统一错误处理中间件
 * 提供标准化的错误处理和日志记录
 */

import { NextRequest, NextResponse } from 'next/server'
import { ErrorLogger, ErrorType, ErrorSeverity } from './error-logger'
import { fallbackManager } from './fallback-manager'

/**
 * API错误处理装饰器
 */
export function withApiErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    module: string
    errorType?: ErrorType
    enableFallback?: boolean
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const logger = ErrorLogger.getInstance()
    const startTime = Date.now()
    
    try {
      // 记录请求开始
      logger.logInfo(`API请求开始: ${request.method} ${request.url}`, {
        module: options.module,
        method: request.method,
        url: request.url
      })

      const response = await handler(request, context)
      
      // 记录成功响应
      const duration = Date.now() - startTime
      logger.logInfo(`API请求成功: ${request.method} ${request.url}`, {
        module: options.module,
        method: request.method,
        url: request.url,
        status: response.status,
        duration
      })

      return response

    } catch (error) {
      const duration = Date.now() - startTime
      const errorType = options.errorType || ErrorType.SYSTEM_ERROR
      
      // 记录错误
      await logger.logError(
        errorType,
        ErrorSeverity.HIGH,
        `API请求失败: ${request.method} ${request.url} - ${error instanceof Error ? error.message : String(error)}`,
        {
          module: options.module,
          method: request.method,
          url: request.url,
          duration,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        },
        error instanceof Error ? error : undefined
      )

      // 尝试回退处理
      if (options.enableFallback) {
        try {
          const fallbackResult = await fallbackManager.handleError(
            error instanceof Error ? error : new Error(String(error)),
            {
              request,
              context,
              module: options.module
            }
          )

          if (fallbackResult.success) {
            return fallbackResult.result
          }
        } catch (fallbackError) {
          // 回退也失败了，继续执行默认错误处理
        }
      }

      // 返回标准化错误响应
      return createErrorResponse(error, request.method, request.url)
    }
  }
}

/**
 * 创建标准化错误响应
 */
function createErrorResponse(error: unknown, method: string, url: string): NextResponse {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // 根据错误类型返回不同的HTTP状态码
  let status = 500
  let userMessage = '服务器内部错误，请稍后重试'
  let errorType = 'SYSTEM_ERROR'

  if (errorMessage.includes('not found') || errorMessage.includes('不存在')) {
    status = 404
    userMessage = '请求的资源不存在'
    errorType = 'NOT_FOUND'
  } else if (errorMessage.includes('validation') || errorMessage.includes('验证')) {
    status = 400
    userMessage = '请求参数验证失败'
    errorType = 'VALIDATION_ERROR'
  } else if (errorMessage.includes('unauthorized') || errorMessage.includes('权限')) {
    status = 401
    userMessage = '权限不足'
    errorType = 'UNAUTHORIZED'
  } else if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
    status = 408
    userMessage = '请求超时，请重试'
    errorType = 'TIMEOUT'
  } else if (errorMessage.includes('未结清账单') || errorMessage.includes('账单')) {
    // 业务逻辑错误：未结清账单
    status = 400
    userMessage = errorMessage // 直接使用具体的错误消息
    errorType = 'BUSINESS_RULE_VIOLATION'
  } else if (errorMessage.includes('合同状态') || errorMessage.includes('房间状态')) {
    // 业务逻辑错误：状态不符合要求
    status = 400
    userMessage = errorMessage // 直接使用具体的错误消息
    errorType = 'BUSINESS_RULE_VIOLATION'
  } else if (errorMessage.includes('日期') || errorMessage.includes('金额') || errorMessage.includes('必须')) {
    // 数据验证错误
    status = 400
    userMessage = errorMessage // 直接使用具体的错误消息
    errorType = 'VALIDATION_ERROR'
  }

  return NextResponse.json(
    {
      success: false,
      error: userMessage,
      errorType,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString(),
      path: url,
      method
    },
    { status }
  )
}

/**
 * 验证请求参数的辅助函数
 */
export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field])
  if (missing.length > 0) {
    throw new Error(`缺少必填字段: ${missing.join(', ')}`)
  }
}

/**
 * 解析请求体的辅助函数
 */
export async function parseRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json()
    return body
  } catch (error) {
    throw new Error('请求体格式错误，请提供有效的JSON数据')
  }
}

/**
 * 解析查询参数的辅助函数
 */
export function parseQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const params: Record<string, string | number | boolean> = {}
  
  for (const [key, value] of searchParams.entries()) {
    // 尝试转换数字
    if (/^\d+$/.test(value)) {
      params[key] = parseInt(value, 10)
    }
    // 尝试转换布尔值
    else if (value === 'true' || value === 'false') {
      params[key] = value === 'true'
    }
    // 保持字符串
    else {
      params[key] = value
    }
  }
  
  return params
}

/**
 * 分页参数解析
 */
export function parsePaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit
  
  return { page, limit, offset }
}

/**
 * 成功响应辅助函数
 */
export function createSuccessResponse(data: any, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  })
}

/**
 * 分页响应辅助函数
 */
export function createPaginatedResponse(
  data: any[],
  total: number,
  page: number,
  limit: number
): NextResponse {
  const totalPages = Math.ceil(total / limit)
  
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  })
}