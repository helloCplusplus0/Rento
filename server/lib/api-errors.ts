import { HTTPException } from 'hono/http-exception'

export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'PAYLOAD_TOO_LARGE',
  'TIMEOUT',
  'CORS_ORIGIN_DENIED',
  'NOT_IMPLEMENTED',
  'SYSTEM_ERROR',
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

export interface ApiErrorOptions {
  code: ApiErrorCode
  message: string
  status: number
  details?: unknown
  cause?: unknown
}

/**
 * Hono 新宿主的统一 API 错误类型。
 * phase08-03 只冻结最小错误语义，供认证、请求治理和后续领域路由复用。
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly details?: unknown
  readonly status: number

  constructor(options: ApiErrorOptions) {
    super(options.message, {
      cause: options.cause,
    })
    this.name = 'ApiError'
    this.code = options.code
    this.details = options.details
    this.status = options.status
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function validationError(message: string, details?: unknown) {
  return new ApiError({
    code: 'VALIDATION_ERROR',
    message,
    status: 400,
    details,
  })
}

export function unauthorizedError(message = '请先登录', details?: unknown) {
  return new ApiError({
    code: 'UNAUTHORIZED',
    message,
    status: 401,
    details,
  })
}

export function forbiddenError(message = '权限不足', details?: unknown) {
  return new ApiError({
    code: 'FORBIDDEN',
    message,
    status: 403,
    details,
  })
}

export function notFoundError(message = '请求的资源不存在', details?: unknown) {
  return new ApiError({
    code: 'NOT_FOUND',
    message,
    status: 404,
    details,
  })
}

export function payloadTooLargeError(
  message = '请求体过大',
  details?: unknown
) {
  return new ApiError({
    code: 'PAYLOAD_TOO_LARGE',
    message,
    status: 413,
    details,
  })
}

export function timeoutError(
  message = '请求超时，请稍后重试',
  details?: unknown
) {
  return new ApiError({
    code: 'TIMEOUT',
    message,
    status: 408,
    details,
  })
}

export function originDeniedError(origin: string, details?: unknown) {
  return new ApiError({
    code: 'CORS_ORIGIN_DENIED',
    message: '当前请求来源不在允许白名单中',
    status: 403,
    details: {
      origin,
      ...(typeof details === 'object' && details !== null ? details : {}),
    },
  })
}

export function notImplementedError(message: string, details?: unknown) {
  return new ApiError({
    code: 'NOT_IMPLEMENTED',
    message,
    status: 501,
    details,
  })
}

export function systemError(
  message = '服务器内部错误，请稍后重试',
  details?: unknown,
  cause?: unknown
) {
  return new ApiError({
    code: 'SYSTEM_ERROR',
    message,
    status: 500,
    details,
    cause,
  })
}

export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  if (error instanceof HTTPException) {
    return mapStatusToApiError(error.status, error.message || undefined, error)
  }

  if (error instanceof Error) {
    return normalizeErrorMessage(error)
  }

  return systemError('服务器内部错误，请稍后重试', error)
}

function normalizeErrorMessage(error: Error): ApiError {
  const message = error.message || 'Unknown error'

  if (includesAny(message, ['timeout', '超时'])) {
    return timeoutError('请求超时，请稍后重试', message)
  }

  if (includesAny(message, ['unauthorized', '请先登录'])) {
    return unauthorizedError('请先登录', message)
  }

  if (includesAny(message, ['forbidden', '权限不足'])) {
    return forbiddenError('权限不足', message)
  }

  if (includesAny(message, ['validation', 'json', '必填', '必须', '格式'])) {
    return validationError(message)
  }

  if (includesAny(message, ['payload', 'body too large', '请求体过大'])) {
    return payloadTooLargeError('请求体过大', message)
  }

  return systemError('服务器内部错误，请稍后重试', message, error)
}

function mapStatusToApiError(
  status: number,
  message?: string,
  cause?: unknown
): ApiError {
  switch (status) {
    case 400:
      return validationError(message || '请求参数验证失败')
    case 401:
      return unauthorizedError(message || '请先登录')
    case 403:
      return forbiddenError(message || '权限不足')
    case 404:
      return notFoundError(message || '请求的资源不存在')
    case 408:
      return timeoutError(message || '请求超时，请稍后重试')
    case 413:
      return payloadTooLargeError(message || '请求体过大')
    case 501:
      return notImplementedError(message || '接口尚未实现')
    default:
      return new ApiError({
        code: status >= 500 ? 'SYSTEM_ERROR' : 'VALIDATION_ERROR',
        message:
          message || (status >= 500 ? '服务器内部错误，请稍后重试' : '请求失败'),
        status,
        cause,
      })
  }
}

function includesAny(message: string, keywords: string[]) {
  const normalized = message.toLowerCase()
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
}
