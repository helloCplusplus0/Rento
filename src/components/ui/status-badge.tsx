import { statusColors, statusTextMap, type StatusType } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type RoomStatus = keyof typeof statusColors.room
type BillStatus = keyof typeof statusColors.bill
type ContractStatus = keyof typeof statusColors.contract

interface StatusBadgeProps {
  type: StatusType
  status: string
  children?: React.ReactNode
  showIndicator?: boolean
  className?: string
}

/**
 * 状态标识组件
 * 根据不同类型和状态显示对应的颜色和文本
 */
export function StatusBadge({
  type,
  status,
  children,
  showIndicator = true,
  className,
}: StatusBadgeProps) {
  // 获取对应的颜色配置
  const typeColors = statusColors[type] as Record<string, any>
  const colors = typeColors?.[status]

  if (!colors) {
    // 如果找不到对应的颜色配置，使用默认样式
    return (
      <Badge variant="outline" className={cn('text-xs font-medium', className)}>
        {children || status}
      </Badge>
    )
  }

  // 如果没有传入 children，使用默认的状态文本
  const typeTextMap = statusTextMap[type] as Record<string, string>
  const displayText = children || typeTextMap?.[status] || status

  return (
    <Badge
      variant="outline"
      className={cn(
        colors.bg,
        colors.text,
        colors.border,
        'text-xs font-medium',
        'flex items-center gap-1.5',
        className
      )}
    >
      {showIndicator && (
        <div
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: colors.indicator }}
        />
      )}
      <span className="truncate">{displayText}</span>
    </Badge>
  )
}

/**
 * 房间状态标识组件
 */
export function RoomStatusBadge({
  status,
  children,
  className,
  ...props
}: Omit<StatusBadgeProps, 'type' | 'status'> & {
  status: RoomStatus
}) {
  return (
    <StatusBadge type="room" status={status} className={className} {...props}>
      {children}
    </StatusBadge>
  )
}

/**
 * 账单状态标识组件
 */
export function BillStatusBadge({
  status,
  children,
  className,
  ...props
}: Omit<StatusBadgeProps, 'type' | 'status'> & {
  status: BillStatus
}) {
  return (
    <StatusBadge type="bill" status={status} className={className} {...props}>
      {children}
    </StatusBadge>
  )
}

/**
 * 合同状态标识组件
 */
export function ContractStatusBadge({
  status,
  children,
  className,
  ...props
}: Omit<StatusBadgeProps, 'type' | 'status'> & {
  status: ContractStatus
}) {
  return (
    <StatusBadge
      type="contract"
      status={status}
      className={className}
      {...props}
    >
      {children}
    </StatusBadge>
  )
}
