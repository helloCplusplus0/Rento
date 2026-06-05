import type { LoaderFunctionArgs } from 'react-router-dom'
import { redirect } from 'react-router-dom'

import {
  type SessionSnapshot,
  getSessionSnapshot,
} from '../lib/session-client'

const FALLBACK_NEXT_PATH = '/'
const INTERNAL_APP_ORIGIN = 'https://minix.local'

export interface LoginRouteLoaderData {
  nextPath: string
  sessionProbeError: string | null
}

export interface GuardBoundaryChecklistItem {
  title: string
  owner: string
  boundary: string
  verification: string
}

/**
 * phase08-04 把“旧宿主仍负责什么、新壳只新增什么”写成可核对清单，
 * 避免后续阶段把旧 `src/middleware.ts` 和新前端壳守卫混为一层。
 */
export const legacyGuardParallelBoundaryChecklist: GuardBoundaryChecklistItem[] = [
  {
    title: '旧 Next.js 页面与旧 API 继续由 src/middleware.ts 保护',
    owner: '旧宿主',
    boundary:
      '旧 `src/app/*` 页面、旧 `src/app/api/*` 存量业务接口与治理接口继续使用现有 Next.js 中间件门禁。',
    verification:
      '未登录访问旧页面仍跳转到 `/login?next=...`；未登录访问未列入公开白名单的旧 API 仍返回 401。',
  },
  {
    title: '新前端壳只保护 React Router 主壳路径',
    owner: 'src/minix/router/guards.ts',
    boundary:
      '新守卫仅覆盖 `/` 与主壳子路由，负责最小登录态探测和登录回跳，不迁业务页查询、写操作或角色细分。',
    verification:
      '未登录访问 `/`、`/rooms`、`/contracts` 等主壳路径会跳转到 `/login?next=当前路径`。',
  },
  {
    title: '公开白名单在页面/API 两侧保持一致',
    owner: '旧宿主 + 新宿主',
    boundary:
      '公开页面保持 `/login`、`/offline`；公开 API 保持 `/api/health`、`/api/auth/login`、`/api/auth/logout`、`/api/auth/session`。',
    verification:
      '未登录时登录页可正常提交；主壳可通过 `GET /api/auth/session` 探测登录态，不会被 API 门禁误拦截。',
  },
  {
    title: '业务页面逻辑仍留在旧参考基线',
    owner: 'phase08 非范围项',
    boundary:
      '新壳中的房源、合同、账单等路径继续只承接统一布局与占位内容，不在本任务中迁移真实领域逻辑。',
    verification:
      '登录后进入新壳业务路径仍展示承接位，不会触发新的领域数据加载、写操作或权限分层。',
  },
]

export async function requireAuthenticatedGuard({
  request,
}: LoaderFunctionArgs): Promise<SessionSnapshot | Response> {
  const session = await getSessionSnapshot({ signal: request.signal })

  if (session.status === 'authenticated') {
    return session
  }

  return redirect(buildLoginHref(request.url))
}

export async function redirectAuthenticatedLoginGuard({
  request,
}: LoaderFunctionArgs): Promise<LoginRouteLoaderData | Response> {
  const session = await getSessionSnapshot({ signal: request.signal })
  const nextPath = getRequestedNextPath(request.url)

  if (session.status === 'authenticated') {
    return redirect(nextPath)
  }

  return {
    nextPath,
    sessionProbeError: session.status === 'error' ? session.errorMessage || null : null,
  }
}

export function normalizeNextPath(
  candidate: string | null | undefined,
  fallback = FALLBACK_NEXT_PATH
) {
  const value = candidate?.trim()

  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  try {
    const normalizedUrl = new URL(value, INTERNAL_APP_ORIGIN)

    if (normalizedUrl.origin !== INTERNAL_APP_ORIGIN) {
      return fallback
    }

    return `${normalizedUrl.pathname}${normalizedUrl.search}${normalizedUrl.hash}` || fallback
  } catch {
    return fallback
  }
}

function buildLoginHref(requestUrl: string) {
  const nextPath = getCurrentPath(requestUrl)
  const searchParams = new URLSearchParams({ next: nextPath })

  return `/login?${searchParams.toString()}`
}

function getRequestedNextPath(requestUrl: string) {
  const url = new URL(requestUrl)

  return normalizeNextPath(url.searchParams.get('next'))
}

function getCurrentPath(requestUrl: string) {
  const url = new URL(requestUrl)

  return normalizeNextPath(`${url.pathname}${url.search}${url.hash}`)
}
