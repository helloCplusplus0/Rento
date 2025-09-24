import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

/**
 * 触摸友好的按钮组件
 * 确保最小触摸区域44px，提供良好的移动端体验
 */
export function TouchButton({ 
  children, 
  className, 
  variant = 'ghost',
  size = 'default',
  asChild = false,
  ...props 
}: TouchButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      asChild={asChild}
      className={cn(
        // 确保最小触摸区域 44px
        'min-h-[44px] min-w-[44px]',
        // 移动端友好的间距
        'p-3',
        // 触摸反馈
        'active:scale-95 transition-transform duration-100',
        // 焦点样式
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // 禁用状态
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

/**
 * 卡片式触摸按钮
 * 用于包装卡片组件，提供整个卡片的点击区域
 */
export function TouchCard({ 
  children, 
  onClick,
  className,
  ...props 
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  if (!onClick) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        // 基础样式
        'cursor-pointer',
        // 触摸反馈
        'active:scale-[0.98] transition-transform duration-100',
        // 焦点样式
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // 悬停效果
        'hover:shadow-md transition-shadow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * 图标按钮
 * 专门用于图标按钮的触摸优化
 */
export function TouchIconButton({ 
  children, 
  className,
  size = 'default',
  ...props 
}: Omit<TouchButtonProps, 'variant'> & {
  size?: 'sm' | 'default' | 'lg'
}) {
  const sizeClasses = {
    sm: 'h-8 w-8 min-h-[44px] min-w-[44px]',
    default: 'h-10 w-10 min-h-[44px] min-w-[44px]',
    lg: 'h-12 w-12 min-h-[44px] min-w-[44px]'
  }

  return (
    <TouchButton
      variant="ghost"
      className={cn(
        // 图标按钮特定样式
        'rounded-full',
        'flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </TouchButton>
  )
}