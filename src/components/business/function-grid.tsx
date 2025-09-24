import { TouchCard } from '@/components/ui/touch-button'
import { cn } from '@/lib/utils'

interface FunctionItem {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  bgColor: string
  onClick?: () => void
}

interface FunctionGridProps {
  items: FunctionItem[]
  columns?: 3 | 4
  className?: string
}

/**
 * 功能导航网格组件
 * 实现9宫格或12宫格功能入口布局，类似生产环境的功能导航
 */
export function FunctionGrid({ items, columns = 3, className }: FunctionGridProps) {
  const gridCols = columns === 3 ? 'grid-cols-3' : 'grid-cols-4'
  
  return (
    <div className={cn(`grid ${gridCols} gap-4 p-4`, className)}>
      {items.map((item) => (
        <FunctionGridItem key={item.id} item={item} />
      ))}
    </div>
  )
}

/**
 * 功能网格单项组件
 */
function FunctionGridItem({ item }: { item: FunctionItem }) {
  return (
    <TouchCard 
      onClick={item.onClick}
      className="aspect-square"
    >
      <div className={cn(
        'h-full w-full rounded-2xl flex flex-col items-center justify-center',
        'transition-all duration-200 hover:scale-105 active:scale-95',
        item.bgColor
      )}>
        {/* 图标容器 */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-2',
          'bg-white/20 backdrop-blur-sm',
          item.color
        )}>
          {item.icon}
        </div>
        
        {/* 标题 */}
        <span className={cn(
          'text-sm font-medium text-center leading-tight',
          'text-white drop-shadow-sm'
        )}>
          {item.title}
        </span>
      </div>
    </TouchCard>
  )
}

/**
 * 预定义的功能项图标组件
 */
export const FunctionIcons = {
  AddRent: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  ),
  
  AddShared: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  
  AddBuilding: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
    </svg>
  ),
  
  RentManage: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19v2h-1.5v16.5c0 .83-.67 1.5-1.5 1.5H8c-.83 0-1.5-.67-1.5-1.5V4H5V2h3.5l1-1h5l1 1H19v2z"/>
    </svg>
  ),
  
  BillManage: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
    </svg>
  ),
  
  TenantManage: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99l-2.54 3.4c-.74.99-.74 2.31 0 3.3l1.54 2.05v6.26h2z"/>
    </svg>
  ),
  
  NewRoom: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
    </svg>
  ),
  
  NewTenant: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  ),
  
  AddRecord: () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
  )
}

/**
 * 预定义的功能项配置
 */
export const defaultFunctionItems: FunctionItem[] = [
  {
    id: 'add-rent',
    title: '添加整租',
    icon: <FunctionIcons.AddRent />,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-cyan-400 to-cyan-600'
  },
  {
    id: 'add-shared',
    title: '添加合租',
    icon: <FunctionIcons.AddShared />,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-red-400 to-red-600'
  },
  {
    id: 'add-building',
    title: '添加独栋',
    icon: <FunctionIcons.AddBuilding />,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-green-400 to-green-600'
  },
  {
    id: 'rent-manage',
    title: '添加预定',
    icon: <FunctionIcons.RentManage />,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-red-400 to-red-600'
  },
  {
    id: 'bill-manage',
    title: '租客登记',
    icon: <FunctionIcons.BillManage />,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600'
  },
  {
    id: 'tenant-manage',
    title: '业主登记',
    icon: <FunctionIcons.TenantManage />,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-green-400 to-green-600'
  },
  {
    id: 'new-room',
    title: '新房线索',
    icon: <FunctionIcons.NewRoom />,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600'
  },
  {
    id: 'new-tenant',
    title: '新客线索',
    icon: <FunctionIcons.NewTenant />,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-cyan-400 to-cyan-600'
  },
  {
    id: 'add-record',
    title: '添加记账',
    icon: <FunctionIcons.AddRecord />,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-red-400 to-red-600'
  }
]

/**
 * 功能网格骨架屏
 */
export function FunctionGridSkeleton({ 
  columns = 3, 
  items = 9 
}: { 
  columns?: 3 | 4
  items?: number 
}) {
  const gridCols = columns === 3 ? 'grid-cols-3' : 'grid-cols-4'
  
  return (
    <div className={cn(`grid ${gridCols} gap-4 p-4`)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="aspect-square">
          <div className="h-full w-full rounded-2xl bg-gray-200 animate-pulse flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-gray-300 animate-pulse mb-2" />
            <div className="h-4 bg-gray-300 rounded w-16 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}