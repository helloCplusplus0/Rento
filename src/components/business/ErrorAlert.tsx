/**
 * 用户友好的错误提示组件
 * 提供结构化的错误信息展示和操作建议
 */

'use client'

import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'

import { ErrorRecord, ErrorType } from '@/lib/error-logger'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorAlertProps {
  error: ErrorRecord
  onRetry?: () => void
  onDismiss?: () => void
  showDetails?: boolean
}

/**
 * 错误消息格式化器
 */
class ErrorMessageFormatter {
  static formatUserMessage(error: ErrorRecord): {
    title: string
    message: string
    actions: string[]
    severity: 'info' | 'warning' | 'error'
    icon: React.ReactNode
  } {
    switch (error.type) {
      case ErrorType.BILL_GENERATION:
        return {
          title: '账单生成失败',
          message:
            '系统在生成账单时遇到问题。这可能是由于数据不一致或网络问题导致的。',
          actions: [
            '检查网络连接是否正常',
            '等待几分钟后重试',
            '检查抄表数据是否完整',
            '如问题持续存在，请联系技术支持',
          ],
          severity: 'error' as const,
          icon: <AlertCircle className="h-4 w-4" />,
        }

      case ErrorType.DATA_CONSISTENCY:
        return {
          title: '数据不一致',
          message:
            '检测到数据不一致问题，系统正在尝试自动修复。大部分情况下会自动解决。',
          actions: [
            '等待自动修复完成（通常需要1-2分钟）',
            '刷新页面查看最新状态',
            '如需要，可手动触发数据修复',
            '查看数据一致性管理页面了解详情',
          ],
          severity: 'warning' as const,
          icon: <AlertCircle className="h-4 w-4" />,
        }

      case ErrorType.DATABASE_ERROR:
        return {
          title: '数据库连接问题',
          message: '系统暂时无法连接到数据库。这通常是临时性问题。',
          actions: [
            '等待几秒钟后重试',
            '检查网络连接',
            '刷新页面',
            '如问题持续，请联系管理员',
          ],
          severity: 'error' as const,
          icon: <AlertCircle className="h-4 w-4" />,
        }

      case ErrorType.VALIDATION_ERROR:
        return {
          title: '数据验证失败',
          message: '提交的数据不符合要求。请检查输入的信息是否正确。',
          actions: [
            '检查必填字段是否完整',
            '确认数据格式是否正确',
            '检查数值范围是否合理',
            '重新填写并提交',
          ],
          severity: 'warning' as const,
          icon: <AlertCircle className="h-4 w-4" />,
        }

      case ErrorType.EXTERNAL_SERVICE:
        return {
          title: '外部服务异常',
          message: '依赖的外部服务暂时不可用。请稍后重试。',
          actions: [
            '等待几分钟后重试',
            '检查网络连接',
            '如急需处理，请联系技术支持',
          ],
          severity: 'warning' as const,
          icon: <AlertCircle className="h-4 w-4" />,
        }

      default:
        return {
          title: '系统错误',
          message: '系统遇到未知错误。我们已记录此问题，技术团队会尽快处理。',
          actions: [
            '刷新页面重试',
            '清除浏览器缓存',
            '联系技术支持并提供错误ID',
          ],
          severity: 'error' as const,
          icon: <AlertCircle className="h-4 w-4" />,
        }
    }
  }
}

/**
 * 错误提示组件
 */
export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
}: ErrorAlertProps) {
  const formatted = ErrorMessageFormatter.formatUserMessage(error)

  const alertVariant =
    formatted.severity === 'error' ? 'destructive' : 'default'

  return (
    <Alert variant={alertVariant} className="mb-4">
      {formatted.icon}
      <AlertTitle className="flex items-center justify-between">
        {formatted.title}
        <span className="text-xs font-normal opacity-70">
          错误ID: {error.id.slice(-8)}
        </span>
      </AlertTitle>
      <AlertDescription>
        <p className="mb-3">{formatted.message}</p>

        <div className="space-y-3">
          <div>
            <p className="mb-2 text-sm font-medium">建议操作:</p>
            <ul className="space-y-1 text-sm">
              {formatted.actions.map((action, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {showDetails && (
            <div className="bg-muted mt-3 rounded-md p-3">
              <p className="mb-1 text-xs font-medium">技术详情:</p>
              <p className="text-muted-foreground text-xs break-all">
                {error.message}
              </p>
              {error.context && (
                <div className="mt-2">
                  <p className="mb-1 text-xs font-medium">上下文:</p>
                  <p className="text-muted-foreground text-xs">
                    模块: {error.context.module} | 函数:{' '}
                    {error.context.function}
                    {error.context.contractId &&
                      ` | 合同: ${error.context.contractId}`}
                    {error.context.billId && ` | 账单: ${error.context.billId}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {onRetry && (
            <Button
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              重试
            </Button>
          )}

          {error.type === ErrorType.DATA_CONSISTENCY && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('/data-consistency', '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              数据修复
            </Button>
          )}

          {onDismiss && (
            <Button size="sm" variant="outline" onClick={onDismiss}>
              关闭
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * 简化版错误提示组件
 */
export function SimpleErrorAlert({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry?: () => void
}) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p className="mb-3">{message}</p>
        {onRetry && (
          <Button
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            重试
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * 成功提示组件
 */
export function SuccessAlert({
  title,
  message,
  onDismiss,
}: {
  title: string
  message: string
  onDismiss?: () => void
}) {
  return (
    <Alert className="mb-4 border-green-200 bg-green-50">
      <AlertCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">{title}</AlertTitle>
      <AlertDescription className="text-green-700">
        <p className="mb-3">{message}</p>
        {onDismiss && (
          <Button size="sm" variant="outline" onClick={onDismiss}>
            关闭
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
