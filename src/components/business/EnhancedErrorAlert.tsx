'use client'

import {
  AlertCircle,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  RefreshCw,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface EnhancedErrorAlertProps {
  title: string
  message: string
  errorType?: string
  onRetry?: () => void
  onDismiss?: () => void
  showSuggestions?: boolean
}

/**
 * 增强的错误提示组件
 * 根据错误类型提供具体的解决建议
 */
export function EnhancedErrorAlert({
  title,
  message,
  errorType,
  onRetry,
  onDismiss,
  showSuggestions = true,
}: EnhancedErrorAlertProps) {
  // 根据错误类型和消息内容提供解决建议
  const getSuggestions = () => {
    if (!showSuggestions) return []

    if (message.includes('未结清账单')) {
      return [
        {
          icon: <CreditCard className="h-4 w-4" />,
          text: '前往账单管理页面处理未结清账单',
          action: () => (window.location.href = '/bills?status=pending'),
        },
        {
          icon: <FileText className="h-4 w-4" />,
          text: '查看合同详情了解账单情况',
          action: () => window.history.back(),
        },
      ]
    }

    if (message.includes('合同状态') || message.includes('房间状态')) {
      return [
        {
          icon: <FileText className="h-4 w-4" />,
          text: '检查合同状态是否符合续租条件',
          action: () => window.history.back(),
        },
        {
          icon: <RefreshCw className="h-4 w-4" />,
          text: '刷新页面获取最新状态',
          action: () => window.location.reload(),
        },
      ]
    }

    if (message.includes('日期') || message.includes('金额')) {
      return [
        {
          icon: <Clock className="h-4 w-4" />,
          text: '检查日期设置是否合理',
          action: null,
        },
        {
          icon: <AlertCircle className="h-4 w-4" />,
          text: '确认金额输入是否正确',
          action: null,
        },
      ]
    }

    return [
      {
        icon: <RefreshCw className="h-4 w-4" />,
        text: '稍后重试',
        action: onRetry,
      },
    ]
  }

  const suggestions = getSuggestions()

  // 根据错误类型确定样式
  const getAlertVariant = () => {
    if (errorType === 'BUSINESS_RULE_VIOLATION') return 'default'
    if (errorType === 'VALIDATION_ERROR') return 'default'
    return 'destructive'
  }

  const getBadgeVariant = () => {
    if (errorType === 'BUSINESS_RULE_VIOLATION') return 'secondary'
    if (errorType === 'VALIDATION_ERROR') return 'outline'
    return 'destructive'
  }

  return (
    <Alert variant={getAlertVariant()} className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {title}
        {errorType && (
          <Badge variant={getBadgeVariant()} className="text-xs">
            {errorType === 'BUSINESS_RULE_VIOLATION'
              ? '业务规则'
              : errorType === 'VALIDATION_ERROR'
                ? '参数验证'
                : errorType === 'NOT_FOUND'
                  ? '资源不存在'
                  : errorType === 'UNAUTHORIZED'
                    ? '权限不足'
                    : errorType === 'TIMEOUT'
                      ? '请求超时'
                      : '系统错误'}
          </Badge>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{message}</p>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">建议解决方案：</p>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center gap-2">
                  {suggestion.icon}
                  {suggestion.action ? (
                    <button
                      onClick={suggestion.action}
                      className="text-sm text-blue-600 underline hover:text-blue-800"
                    >
                      {suggestion.text}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-600">
                      {suggestion.text}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-1 h-3 w-3" />
              重试
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              关闭
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
