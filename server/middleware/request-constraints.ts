import type { MiddlewareHandler } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import { timeout } from 'hono/timeout'

import { originDeniedError, payloadTooLargeError } from '../lib/api-errors'
import { jsonApiError } from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'

const CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
const CORS_ALLOW_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
const CORS_MAX_AGE_SECONDS = '600'

/**
 * 统一收口最小请求约束：
 * - 来源白名单
 * - CORS 预检
 * - 请求体大小限制
 * - 请求超时
 */
export function createCorsConstraint(
  env: Pick<MinixServerEnv, 'requestGovernance'>
): MiddlewareHandler {
  return async (c, next) => {
    if (!env.requestGovernance.corsEnabled) {
      await next()
      return
    }

    const origin = c.req.header('origin')
    if (origin && !isAllowedOrigin(c.req.raw, origin, env)) {
      throw originDeniedError(origin, {
        allowedOrigins: env.requestGovernance.allowedOrigins,
      })
    }

    if (c.req.method === 'OPTIONS') {
      const response = new Response(null, { status: 204 })
      applyCorsHeaders(response.headers, c.req.raw, env)
      return response
    }

    await next()
    applyCorsHeaders(c.res.headers, c.req.raw, env)
  }
}

export function createRequestBodyLimit(
  env: Pick<MinixServerEnv, 'requestGovernance' | 'runtimeName' | 'isProduction'>
): MiddlewareHandler {
  return bodyLimit({
    maxSize: env.requestGovernance.maxRequestSize,
    onError: (c) =>
      jsonApiError(
        c,
        payloadTooLargeError('请求体过大', {
          maxRequestSize: env.requestGovernance.maxRequestSize,
        }),
        { env }
      ),
  })
}

export function createRequestTimeout(
  env: Pick<MinixServerEnv, 'requestGovernance'>
): MiddlewareHandler {
  if (env.requestGovernance.timeoutMs <= 0) {
    return async (_c, next) => {
      await next()
    }
  }

  return timeout(
    env.requestGovernance.timeoutMs,
    new HTTPException(408, {
      message: '请求超时，请稍后重试',
    })
  )
}

export function applyCorsHeaders(
  headers: Headers,
  request: Request,
  env: Pick<MinixServerEnv, 'requestGovernance'>
) {
  if (!env.requestGovernance.corsEnabled) {
    return
  }

  const origin = request.headers.get('origin')
  if (!origin) {
    return
  }

  if (!isAllowedOrigin(request, origin, env)) {
    return
  }

  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS.join(', '))
  headers.set('Access-Control-Allow-Methods', CORS_ALLOW_METHODS.join(', '))
  headers.set('Access-Control-Max-Age', CORS_MAX_AGE_SECONDS)
  appendVaryHeader(headers, 'Origin')
}

function isAllowedOrigin(
  request: Request,
  origin: string,
  env: Pick<MinixServerEnv, 'requestGovernance'>
) {
  return (
    isSameOriginRequest(request, origin) ||
    env.requestGovernance.allowedOrigins.includes(origin)
  )
}

function isSameOriginRequest(request: Request, origin: string) {
  try {
    const requestUrl = new URL(request.url)
    const forwardedProto = getFirstHeaderValue(request.headers.get('x-forwarded-proto'))
    const forwardedHost =
      getFirstHeaderValue(request.headers.get('x-forwarded-host')) ||
      request.headers.get('host') ||
      requestUrl.host
    const protocol = forwardedProto || requestUrl.protocol.replace(/:$/, '')
    const requestOrigin = `${protocol}://${forwardedHost}`

    return requestOrigin === origin
  } catch {
    return false
  }
}

function getFirstHeaderValue(headerValue: string | null) {
  return headerValue?.split(',')[0]?.trim()
}

function appendVaryHeader(headers: Headers, nextValue: string) {
  const current = headers.get('Vary')
  if (!current) {
    headers.set('Vary', nextValue)
    return
  }

  const parts = current.split(',').map((part) => part.trim())
  if (!parts.includes(nextValue)) {
    headers.set('Vary', `${current}, ${nextValue}`)
  }
}
