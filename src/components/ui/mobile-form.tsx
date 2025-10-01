import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface MobileFormFieldProps {
  label: string
  children: React.ReactNode
  error?: string
  required?: boolean
  description?: string
  className?: string
}

/**
 * 移动端表单字段容器
 * 提供统一的标签、错误信息和描述布局
 */
export function MobileFormField({
  label,
  children,
  error,
  required,
  description,
  className,
}: MobileFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-base font-medium">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <div className="relative">{children}</div>
      {error && (
        <p className="flex items-center gap-1 text-sm text-red-600">
          <span className="text-red-500">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  required?: boolean
  description?: string
}

/**
 * 移动端输入框组件
 * 针对移动端优化的输入体验
 */
export function MobileInput({
  label,
  error,
  required,
  description,
  className,
  ...props
}: MobileInputProps) {
  return (
    <MobileFormField
      label={label}
      error={error}
      required={required}
      description={description}
    >
      <Input
        className={cn(
          // 移动端友好的高度
          'h-12',
          // 更大的字体，防止移动端缩放
          'text-base',
          // 更大的内边距
          'px-4 py-3',
          // 错误状态样式
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
    </MobileFormField>
  )
}

interface MobileTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  required?: boolean
  description?: string
}

/**
 * 移动端文本域组件
 */
export function MobileTextarea({
  label,
  error,
  required,
  description,
  className,
  ...props
}: MobileTextareaProps) {
  return (
    <MobileFormField
      label={label}
      error={error}
      required={required}
      description={description}
    >
      <Textarea
        className={cn(
          // 移动端友好的最小高度
          'min-h-[100px]',
          // 更大的字体
          'text-base',
          // 更大的内边距
          'px-4 py-3',
          // 错误状态样式
          error && 'border-red-500 focus-visible:ring-red-500',
          // 禁用调整大小（移动端体验更好）
          'resize-none',
          className
        )}
        {...props}
      />
    </MobileFormField>
  )
}

interface MobileSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  required?: boolean
  description?: string
  options: { value: string; label: string }[]
}

/**
 * 移动端选择框组件
 */
export function MobileSelect({
  label,
  error,
  required,
  description,
  options,
  className,
  ...props
}: MobileSelectProps) {
  return (
    <MobileFormField
      label={label}
      error={error}
      required={required}
      description={description}
    >
      <select
        className={cn(
          // 基础样式
          'border-input bg-background flex h-12 w-full rounded-md border px-4 py-3 text-base',
          'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:outline-none',
          'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          // 移动端优化
          'cursor-pointer appearance-none',
          // 错误状态样式
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </MobileFormField>
  )
}

/**
 * 移动端表单容器
 * 提供适合移动端的表单布局和间距
 */
export function MobileForm({
  children,
  className,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      className={cn(
        // 移动端友好的间距
        'space-y-6',
        // 防止表单在小屏幕上溢出
        'w-full max-w-none',
        className
      )}
      {...props}
    >
      {children}
    </form>
  )
}

/**
 * 表单按钮组
 * 移动端优化的按钮布局
 */
export function MobileFormActions({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        // 移动端按钮布局
        'flex flex-col gap-3 sm:flex-row sm:gap-4',
        // 按钮占满宽度（移动端）
        '[&>button]:w-full sm:[&>button]:w-auto',
        // 主要按钮在移动端排在前面
        'flex-col-reverse sm:flex-row sm:justify-end',
        className
      )}
    >
      {children}
    </div>
  )
}
