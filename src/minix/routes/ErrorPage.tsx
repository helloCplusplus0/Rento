import { AlertTriangle } from 'lucide-react'
import { useRouteError } from 'react-router-dom'

import { StatusPageShell } from './StatusPageShell'

interface ErrorPageProps {
  error?: Error | null
  onRetry?: () => void
}

function getErrorMessage(error?: Error | null) {
  if (!error) {
    return '应用遇到了意外错误，请稍后重试。'
  }

  return error.message || '应用遇到了意外错误，请稍后重试。'
}

export function ErrorPage({ error, onRetry }: ErrorPageProps) {
  return (
    <StatusPageShell
      badge="Runtime Error"
      title="出现了一些问题"
      description="新前端宿主已提供基础错误承接位，用于后续挂接运行时、数据请求与渲染错误边界。"
      icon={<AlertTriangle className="h-6 w-6" />}
      accentClassName="bg-red-600 text-white"
      tips={['当前为基础错误页承接位，完整错误上报和分类恢复策略将在后续阶段继续补齐。']}
      detail={
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {getErrorMessage(error)}
        </div>
      }
      actions={[
        { label: '重试', onClick: onRetry },
        { label: '返回工作台', to: '/', variant: 'outline' },
      ]}
    />
  )
}

export function RouteErrorBoundary() {
  const routeError = useRouteError()
  const normalizedError =
    routeError instanceof Error ? routeError : new Error('路由渲染失败，请稍后重试。')

  return <ErrorPage error={normalizedError} />
}
