import { FormEvent, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { StatusPageShell } from './StatusPageShell'

function getNextPath(search: string) {
  const params = new URLSearchParams(search)
  return params.get('next') || '/'
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const nextPath = getNextPath(location.search)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // phase07-02 只提供登录页承接位，不在此阶段接入完整认证 API。
      await new Promise((resolve) => window.setTimeout(resolve, 300))
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
      description="当前页复用现有登录视觉语言，先承接新宿主中的登录入口和跳转边界；完整认证 API 与会话闭环仍留给后续阶段。"
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
            />
          </div>

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
