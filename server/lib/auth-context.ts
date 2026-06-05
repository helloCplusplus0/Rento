import type { SessionPayload } from '../../src/lib/auth/session'

/**
 * Hono 认证上下文变量。
 * 当前 phase08 仅冻结最小管理员会话，不扩展角色体系。
 */
export interface AuthSessionVariables {
  session: SessionPayload | null
}

export type AuthAppEnv = {
  Variables: AuthSessionVariables
}
