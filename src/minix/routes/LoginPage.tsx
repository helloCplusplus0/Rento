import { FormEvent, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useLoaderData, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { loginWithPassword } from '../lib/session-client'
import type { LoginRouteLoaderData } from '../router/guards'

import { StatusPageShell } from './StatusPageShell'

export function LoginPage() {
  const navigate = useNavigate()
  const { nextPath, sessionProbeError } = useLoaderData() as LoginRouteLoaderData

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await loginWithPassword({ username, password })
      navigate(nextPath, { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : '登录失败，请稍后重试'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <StatusPageShell
      badge="Login Shell"
      title="登录 Rento-miniX"
      description="当前页复用现有登录视觉语言，并已接入 Hono 新宿主中的最小认证闭环；领域级页面守卫与业务接口迁移仍留给后续阶段。"
      icon={<ShieldCheck className="h-6 w-6" />}
      accentClassName="bg-slate-900 text-white"
      detail={
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username">管理员账号</Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="请输入管理员账号"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">登录密码</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="请输入登录密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {sessionProbeError ? (
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {sessionProbeError}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? '登录中...' : '进入后台'}
          </Button>
        </form>
      }
    />
  )
}
