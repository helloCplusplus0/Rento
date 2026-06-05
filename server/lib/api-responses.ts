import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import type { ApiError } from './api-errors'
import { normalizeApiError, payloadTooLargeError, validationError } from './api-errors'
export interface ApiResponseRuntimeOptions {
  env?: {
    runtimeName: string
  }
}

interface JsonSuccessOptions<T> extends ApiResponseRuntimeOptions {
  data?: T
  message?: string
  meta?: Record<string, unknown>
  status?: number
}

interface JsonErrorOptions extends ApiResponseRuntimeOptions {
  extra?: Record<string, unknown>
}

/**
 * 统一成功响应封装。
 * phase08-03 先为认证接口和后续 Hono API 提供稳定的 success/data/message 语义。
 */
export function jsonSuccess<T>(
  c: Context,
  options: JsonSuccessOptions<T> = {}
) {
  const { data, message, meta, status = 200 } = options

  const response = c.json(
    {
      success: true,
      ...(message ? { message } : {}),
      ...(data !== undefined ? { data } : {}),
      ...(meta ? meta : {}),
      timestamp: new Date().toISOString(),
      ...(options.env ? { runtime: options.env.runtimeName } : {}),
    },
    status as ContentfulStatusCode
  )

  return response
}

export function jsonApiError(
  c: Context,
  error: unknown,
  options: JsonErrorOptions = {}
) {
  const normalizedError = normalizeApiError(error)
  const response = createApiErrorResponse(c, normalizedError, options)

  return response
}

export function createApiErrorResponse(
  c: Context,
  error: ApiError,
  options: JsonErrorOptions = {}
) {
  const response = c.json(
    {
      success: false,
      error: error.message,
      errorType: error.code,
      ...(error.details !== undefined ? { details: error.details } : {}),
      ...(options.extra ? options.extra : {}),
      timestamp: new Date().toISOString(),
      path: c.req.path,
      method: c.req.method,
      ...(options.env ? { runtime: options.env.runtimeName } : {}),
    },
    error.status as ContentfulStatusCode
  )

  return response
}

export async function readJsonBody<T>(
  c: Context,
  options: {
    allowEmpty?: boolean
    maxBytes?: number
  } = {}
) {
  const rawBody = await c.req.text()

  if (!rawBody.trim()) {
    if (options.allowEmpty) {
      return undefined as T | undefined
    }

    throw validationError('请求体不能为空')
  }

  if (options.maxBytes !== undefined) {
    const actualSize = new TextEncoder().encode(rawBody).length

    if (actualSize > options.maxBytes) {
      throw payloadTooLargeError('请求体过大', {
        actualSize,
        maxBytes: options.maxBytes,
      })
    }
  }

  try {
    return JSON.parse(rawBody) as T
  } catch (error) {
    throw validationError(
      '请求体必须是合法 JSON',
      error instanceof Error ? error.message : error
    )
  }
}
