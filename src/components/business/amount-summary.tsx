import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface AmountItem {
  id: string
  label: string
  amount: number
  count?: number
  status?: 'positive' | 'negative' | 'neutral'
  description?: string
}

interface AmountSection {
  id: string
  title: string
  items: AmountItem[]
  total?: number
  showTotal?: boolean
}

interface AmountSummaryProps {
  sections: AmountSection[]
  title?: string
  totalAmount?: number
  showGrandTotal?: boolean
  className?: string
}

/**
 * 金额汇总组件
 * 支持多维度统计展示，类似生产环境的收支明细
 */
export function AmountSummary({
  sections,
  title,
  totalAmount,
  showGrandTotal = true,
  className
}: AmountSummaryProps) {
  const calculatedTotal = totalAmount ?? sections.reduce((sum, section) => {
    const sectionTotal = section.total ?? section.items.reduce((itemSum, item) => itemSum + item.amount, 0)
    return sum + sectionTotal
  }, 0)

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            {showGrandTotal && (
              <Badge 
                variant={calculatedTotal >= 0 ? 'default' : 'destructive'}
                className="text-base font-semibold px-3 py-1"
              >
                {formatCurrency(calculatedTotal)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={cn('space-y-4', !title && 'pt-6')}>
        {sections.map((section, sectionIndex) => (
          <div key={section.id}>
            <AmountSection section={section} />
            {sectionIndex < sections.length - 1 && (
              <Separator className="mt-4" />
            )}
          </div>
        ))}
        
        {showGrandTotal && sections.length > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold text-lg">总计</span>
              <span className={cn(
                'font-bold text-xl',
                calculatedTotal >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 金额分组组件
 */
function AmountSection({ section }: { section: AmountSection }) {
  const sectionTotal = section.total ?? section.items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-3">
      {/* 分组标题 */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-base">{section.title}</h4>
        {section.showTotal !== false && (
          <span className={cn(
            'font-semibold',
            sectionTotal >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatCurrency(sectionTotal)}
          </span>
        )}
      </div>
      
      {/* 金额项列表 */}
      <div className="space-y-2">
        {section.items.map(item => (
          <AmountItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

/**
 * 金额项组件
 */
function AmountItem({ item }: { item: AmountItem }) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      case 'neutral':
      default:
        return 'text-foreground'
    }
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{item.label}</span>
          {item.count !== undefined && (
            <Badge variant="outline" className="text-xs">
              {item.count}笔
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
        )}
      </div>
      
      <div className="text-right">
        <span className={cn('font-semibold', getStatusColor(item.status))}>
          {formatCurrency(item.amount)}
        </span>
      </div>
    </div>
  )
}

/**
 * 简化版金额汇总组件
 */
export function SimpleAmountSummary({
  items,
  title,
  className
}: {
  items: AmountItem[]
  title?: string
  className?: string
}) {
  const total = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn('space-y-2', !title && 'pt-6')}>
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="text-sm">{item.label}</span>
            <span className={cn(
              'font-medium text-sm',
              item.status === 'positive' ? 'text-green-600' :
              item.status === 'negative' ? 'text-red-600' : 'text-foreground'
            )}>
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))}
        
        {items.length > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between pt-2">
              <span className="font-medium">合计</span>
              <span className={cn(
                'font-semibold',
                total >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(total)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 金额统计卡片组件
 * 采用黄金比例设计，优化空间利用率
 */
export function AmountStatCard({
  title,
  amount,
  count,
  trend,
  status = 'neutral',
  className
}: {
  title: string
  amount: number
  count?: number
  trend?: number
  status?: 'positive' | 'negative' | 'neutral'
  className?: string
}) {
  const getStatusStyles = () => {
    switch (status) {
      case 'positive':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
          text: 'text-green-700',
          amount: 'text-green-600',
          accent: 'bg-green-500'
        }
      case 'negative':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
          text: 'text-red-700',
          amount: 'text-red-600',
          accent: 'bg-red-500'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
          text: 'text-blue-700',
          amount: 'text-blue-600',
          accent: 'bg-blue-500'
        }
    }
  }

  const styles = getStatusStyles()

  return (
    <Card className={cn(styles.bg, 'border-2 overflow-hidden', className)}>
      <CardContent className="p-0">
        {/* 使用黄金比例布局 */}
        <div className="aspect-[1.618/1] flex flex-col">
          {/* 头部区域 - 38.2% */}
          <div className="flex-[0.382] p-3 flex items-center justify-between">
            <span className={cn('text-sm font-medium', styles.text)}>
              {title}
            </span>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                <div className={cn('w-1 h-4 rounded-full', styles.accent)}></div>
                <span className={cn(
                  'text-xs font-semibold',
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
              </div>
            )}
          </div>
          
          {/* 主要内容区域 - 61.8% */}
          <div className="flex-[0.618] px-3 pb-3 flex flex-col justify-center">
            <div className={cn('text-2xl font-bold leading-tight', styles.amount)}>
              {formatCurrency(amount)}
            </div>
            
            {count !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <div className={cn('w-1.5 h-1.5 rounded-full', styles.accent)}></div>
                <span className={cn('text-xs', styles.text)}>
                  共 {count} 笔
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 金额汇总骨架屏
 */
export function AmountSummarySkeleton({
  sections = 2,
  itemsPerSection = 3
}: {
  sections?: number
  itemsPerSection?: number
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: sections }).map((_, sectionIndex) => (
          <div key={sectionIndex}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: itemsPerSection }).map((_, itemIndex) => (
                <div key={itemIndex} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              ))}
            </div>
            {sectionIndex < sections - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}