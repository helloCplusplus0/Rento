'use client'

import { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'

interface DetailPageAction {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?:
    | 'default'
    | 'outline'
    | 'destructive'
    | 'secondary'
    | 'ghost'
    | 'link'
  disabled?: boolean
  className?: string
}

interface DetailPageTemplateProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  children: ReactNode
  actions?: DetailPageAction[]
  extraActions?: ReactNode
  className?: string
}

/**
 * 通用详情页面模板组件
 * 提供统一的详情页面布局和交互模式
 *
 * 设计原则：
 * 1. 操作按钮统一放在内容区域底部，避免移动端顶部栏溢出
 * 2. 使用一致的间距和布局规范
 * 3. 支持响应式设计，移动端优先
 * 4. 提供统一的加载状态和错误处理
 */
export function DetailPageTemplate({
  title,
  subtitle,
  showBackButton = true,
  children,
  actions = [],
  extraActions,
  className,
}: DetailPageTemplateProps) {
  return (
    <PageContainer
      title={title}
      subtitle={subtitle}
      showBackButton={showBackButton}
      className={className}
      actions={extraActions}
    >
      <div className="space-y-6 pb-6">
        {/* 主要内容区域 */}
        {children}

        {/* 操作按钮区域 - 统一放在底部 */}
        {actions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`flex-1 sm:flex-none ${action.className || ''}`}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}

/**
 * 详情页面信息卡片组件
 * 提供统一的信息展示格式
 */
interface DetailInfoCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function DetailInfoCard({
  title,
  children,
  className,
}: DetailInfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/**
 * 详情页面字段组件
 * 提供统一的字段展示格式
 */
interface DetailFieldProps {
  label: string
  value: ReactNode
  className?: string
}

export function DetailField({ label, value, className }: DetailFieldProps) {
  return (
    <div className={`space-y-1 ${className || ''}`}>
      <label className="text-sm text-gray-600">{label}</label>
      <div className="text-sm font-medium break-words sm:text-base">
        {value}
      </div>
    </div>
  )
}
