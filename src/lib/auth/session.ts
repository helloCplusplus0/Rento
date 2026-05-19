const encoder = new TextEncoder()

export const AUTH_COOKIE_NAME = 'rento_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export type SessionRole = 'ADMIN'

export interface SessionPayload {
  sub: string
  username: string
  role: SessionRole
  iat: number
  exp: number
}

export interface SessionCookie {
  name: string
  value: string
  options: {
    httpOnly: true
    sameSite: 'lax'
    secure: boolean
    path: '/'
    maxAge: number
  }
}

function getBase64Api() {
  if (typeof Buffer !== 'undefined') {
    return {
      encode: (bytes: Uint8Array) => Buffer.from(bytes).toString('base64'),
      decode: (input: string) => new Uint8Array(Buffer.from(input, 'base64')),
    }
  }

  return {
    encode: (bytes: Uint8Array) => {
      let binary = ''
      for (const byte of bytes) {
        binary += String.fromCharCode(byte)
      }
      return btoa(binary)
    },
    decode: (input: string) => {
      const binary = atob(input)
      return Uint8Array.from(binary, (char) => char.charCodeAt(0))
    },
  }
}

function toBase64Url(input: string | Uint8Array) {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input
  return getBase64Api()
    .encode(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4
  const withPadding =
    padding === 0 ? normalized : `${normalized}${'='.repeat(4 - padding)}`
  return getBase64Api().decode(withPadding)
}

function getSessionSecret() {
  const secret =
    process.env.AUTH_SESSION_SECRET || process.env.NEXTAUTH_SECRET || ''

  if (!secret) {
    throw new Error('authentication configuration missing: session secret')
  }

  return secret
}

async function getSigningKey() {
  const subtle = getSubtleCrypto()
  if (!subtle) {
    throw new Error('authentication runtime unavailable: crypto.subtle missing')
  }

  return subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function signValue(value: string) {
  const subtle = getSubtleCrypto()
  if (!subtle) {
    throw new Error('authentication runtime unavailable: crypto.subtle missing')
  }

  const signature = await subtle.sign(
    'HMAC',
    await getSigningKey(),
    encoder.encode(value)
  )

  return toBase64Url(new Uint8Array(signature))
}

async function verifySignature(value: string, signature: string) {
  const subtle = getSubtleCrypto()
  if (!subtle) {
    throw new Error('authentication runtime unavailable: crypto.subtle missing')
  }

  return subtle.verify(
    'HMAC',
    await getSigningKey(),
    fromBase64Url(signature),
    encoder.encode(value)
  )
}

export function buildSessionCookie(token: string): SessionCookie {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  }
}

export function clearSessionCookie(): SessionCookie {
  return {
    name: AUTH_COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    },
  }
}

export async function createSessionToken(
  username: string,
  role: SessionRole = 'ADMIN'
) {
  const now = Math.floor(Date.now() / 1000)
  const payload: SessionPayload = {
    sub: username,
    username,
    role,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  }

  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = await signValue(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export async function verifySessionToken(token?: string | null) {
  if (!token) {
    return null
  }

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) {
    return null
  }

  const isValid = await verifySignature(encodedPayload, signature)
  if (!isValid) {
    return null
  }

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(encodedPayload))
    ) as SessionPayload

    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }

    if (payload.role !== 'ADMIN') {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function getSessionFromRequest(request: {
  cookies: { get(name: string): { value: string } | undefined }
}) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  return verifySessionToken(token)
}

function getSubtleCrypto() {
  return globalThis.crypto?.subtle ?? null
}
