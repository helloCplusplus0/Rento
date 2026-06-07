interface ClientApiErrorDetails {
  code?: string
  suggestion?: string
  blockingReasons?: string[]
  [key: string]: unknown
}

interface ClientApiErrorPayload {
  error?: string
  message?: string
  code?: string
  suggestion?: string
  details?: ClientApiErrorDetails | null
  [key: string]: unknown
}

export interface NormalizedClientApiError {
  status: number
  message: string
  code?: string
  suggestion?: string
  blockingReasons: string[]
  details: ClientApiErrorDetails
  payload: ClientApiErrorPayload
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => toStringValue(item))
    .filter((item): item is string => Boolean(item))
}

function normalizeClientApiErrorPayload(
  payload: unknown,
  fallbackMessage: string
): Omit<NormalizedClientApiError, 'status'> {
  const normalizedPayload: ClientApiErrorPayload = isRecord(payload)
    ? (payload as ClientApiErrorPayload)
    : {}
  const details = isRecord(normalizedPayload.details)
    ? (normalizedPayload.details as ClientApiErrorDetails)
    : {}

  return {
    message:
      toStringValue(normalizedPayload.error) ||
      toStringValue(normalizedPayload.message) ||
      fallbackMessage,
    code: toStringValue(details.code) || toStringValue(normalizedPayload.code),
    suggestion:
      toStringValue(details.suggestion) ||
      toStringValue(normalizedPayload.suggestion),
    blockingReasons: [
      ...toStringArray(details.blockingReasons),
      ...toStringArray(normalizedPayload.blockingReasons),
    ],
    details,
    payload: normalizedPayload,
  }
}

export async function readClientApiError(
  response: Response,
  fallbackMessage: string
): Promise<NormalizedClientApiError> {
  const clonedResponse = response.clone()

  try {
    const payload = await clonedResponse.json()

    return {
      status: response.status,
      ...normalizeClientApiErrorPayload(payload, fallbackMessage),
    }
  } catch {
    let textMessage: string | undefined

    try {
      textMessage = toStringValue(await response.text())
    } catch {
      textMessage = undefined
    }

    return {
      status: response.status,
      message: textMessage || fallbackMessage,
      blockingReasons: [],
      details: {},
      payload: {},
    }
  }
}

interface FormatClientApiErrorOptions {
  defaultTitle?: string
  includeCode?: boolean
}

export function formatClientApiError(
  error: Pick<
    NormalizedClientApiError,
    'message' | 'code' | 'suggestion' | 'blockingReasons'
  >,
  options: FormatClientApiErrorOptions = {}
) {
  const sections: string[] = []

  if (options.defaultTitle) {
    sections.push(options.defaultTitle)
  }

  if (!options.defaultTitle || error.message !== options.defaultTitle) {
    sections.push(error.message)
  }

  if (error.blockingReasons.length > 0) {
    sections.push(
      `门禁原因：\n${error.blockingReasons.map((reason) => `- ${reason}`).join('\n')}`
    )
  }

  if (error.suggestion) {
    sections.push(`建议：${error.suggestion}`)
  }

  if (options.includeCode && error.code) {
    sections.push(`错误码：${error.code}`)
  }

  return sections.filter(Boolean).join('\n\n')
}
