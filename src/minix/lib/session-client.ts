import { minixClientEnv } from '../env'

export type MinixSessionRole = 'ADMIN'

export interface SessionUser {
  role: MinixSessionRole
  username: string
}

export interface SessionSnapshot {
  status: 'authenticated' | 'unauthenticated' | 'error'
  authenticated: boolean
  user: SessionUser | null
  errorMessage?: string
}

export interface LoginWithPasswordInput {
  username: string
  password: string
}

interface ApiEnvelope<TData> {
  success?: boolean
  error?: string
  data?: TData
}

interface LoginResponseData {
  role: MinixSessionRole
  username: string
}

interface SessionResponseData {
  authenticated?: boolean
  user?: SessionUser | null
}

interface RequestOptions {
  signal?: AbortSignal
}

function buildApiUrl(path: string) {
  const basePath = minixClientEnv.apiBaseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${basePath}${normalizedPath}`
}

async function readApiEnvelope<TData>(
  response: Response,
  fallbackMessage: string
): Promise<ApiEnvelope<TData>> {
  try {
    return (await response.json()) as ApiEnvelope<TData>
  } catch {
    throw new Error(fallbackMessage)
  }
}

/**
 * phase08-04 只做最小会话探测与登录调用，
 * 保持 `src/minix` 不承接完整业务数据加载。
 */
export async function getSessionSnapshot(
  options: RequestOptions = {}
): Promise<SessionSnapshot> {
  try {
    const response = await fetch(buildApiUrl('/auth/session'), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      signal: options.signal,
    })

    const result = await readApiEnvelope<SessionResponseData>(
      response,
      '登录态探测失败，请稍后重试'
    )

    if (!response.ok || !result.success || !result.data) {
      return {
        status: 'error',
        authenticated: false,
        user: null,
        errorMessage: result.error || '登录态探测失败，请稍后重试',
      }
    }

    const authenticated = Boolean(result.data.authenticated)

    return {
      status: authenticated ? 'authenticated' : 'unauthenticated',
      authenticated,
      user: result.data.user ?? null,
    }
  } catch (error) {
    return {
      status: 'error',
      authenticated: false,
      user: null,
      errorMessage:
        error instanceof Error ? error.message : '登录态探测失败，请稍后重试',
    }
  }
}

export async function loginWithPassword(
  input: LoginWithPasswordInput,
  options: RequestOptions = {}
): Promise<SessionSnapshot> {
  const response = await fetch(buildApiUrl('/auth/login'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      username: input.username.trim(),
      password: input.password,
    }),
    signal: options.signal,
  })

  const result = await readApiEnvelope<LoginResponseData>(
    response,
    '登录失败，请稍后重试'
  )

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || '登录失败，请稍后重试')
  }

  return {
    status: 'authenticated',
    authenticated: true,
    user: {
      role: result.data.role,
      username: result.data.username,
    },
  }
}
