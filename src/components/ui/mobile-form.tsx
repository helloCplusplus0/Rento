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
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {description && (
        <p className="text-xs leading-4 text-gray-500">{description}</p>
      )}
      <div className="relative">{children}</div>
      {error && (
        <p className="flex items-center gap-1 text-xs leading-4 text-red-600">
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
          'h-10 text-sm placeholder:text-sm sm:h-11 sm:text-base sm:placeholder:text-base',
          'px-3 py-2.5 sm:px-4',
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
          'min-h-[88px] text-sm placeholder:text-sm sm:min-h-[100px] sm:text-base sm:placeholder:text-base',
          'px-3 py-2.5 sm:px-4 sm:py-3',
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
          'border-input bg-background flex h-10 w-full rounded-md border px-3 py-2.5 text-sm sm:h-11 sm:px-4 sm:text-base',
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
        'space-y-4 sm:space-y-5',
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
        'grid grid-cols-2 gap-2.5 sm:max-w-sm',
        '[&>button]:w-full',
        className
      )}
    >
      {children}
    </div>
  )
}
