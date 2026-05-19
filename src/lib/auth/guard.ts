import { NextRequest } from 'next/server'

import { getSessionFromRequest, type SessionPayload } from './session'

export async function getOptionalSession(request: NextRequest) {
  return getSessionFromRequest(request)
}

export async function requireAdminSession(
  request: NextRequest
): Promise<SessionPayload> {
  const session = await getOptionalSession(request)

  if (!session) {
    throw new Error('unauthorized: 请先登录')
  }

  if (session.role !== 'ADMIN') {
    throw new Error('forbidden: 权限不足')
  }

  return session
}
