'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface AggregatedBillMetaItem {
  label: string
  value: ReactNode
}

interface AggregatedBillSummaryItem {
  label: string
  value: ReactNode
  accentClassName: string
}

interface AggregatedBillBreakdownItem {
  id: string
  title: ReactNode
  description?: ReactNode
  amount?: ReactNode
  icon?: ReactNode
  headerAside?: ReactNode
  containerClassName?: string
  amountClassName?: string
}

interface AggregatedBillTemplateCardProps {
  title: string
  badgeText: string
  badgeClassName?: string
  actionSlot?: ReactNode
  metaItems: AggregatedBillMetaItem[]
  summaryItems: AggregatedBillSummaryItem[]
  summarySlot?: ReactNode
  breakdownTitle: string
  breakdownItems: AggregatedBillBreakdownItem[]
  emptyBreakdownText: string
  notice?: ReactNode
  footer?: ReactNode
  metaGridClassName?: string
  metaItemLayout?: 'stacked' | 'inline'
  breakdownListClassName?: string
  breakdownItemClassName?: string
  breakdownLeadingClassName?: string
  breakdownTitleClassName?: string
  breakdownDescriptionClassName?: string
  breakdownAmountClassName?: string
}

export function AggregatedBillTemplateCard({
  title,
  badgeText,
  badgeClassName,
  actionSlot,
  metaItems,
  summaryItems,
  summarySlot,
  breakdownTitle,
  breakdownItems,
  emptyBreakdownText,
  notice,
  footer,
  metaGridClassName,
  metaItemLayout = 'stacked',
  breakdownListClassName,
  breakdownItemClassName,
  breakdownLeadingClassName,
  breakdownTitleClassName,
  breakdownDescriptionClassName,
  breakdownAmountClassName,
}: AggregatedBillTemplateCardProps) {
  return (
    <Card className="w-full min-w-0 overflow-x-hidden py-4 sm:py-6">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <CardTitle className="text-base leading-6 sm:text-lg">
              {title}
            </CardTitle>
            <Badge
              variant="outline"
              className={`max-w-full break-words text-xs sm:text-sm ${badgeClassName ?? ''}`}
            >
              {badgeText}
            </Badge>
          </div>
          {actionSlot ? <div className="w-full sm:w-auto">{actionSlot}</div> : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 text-sm sm:px-6">
        <div
          className={cn(
            'grid grid-cols-1 gap-3 text-xs leading-5 sm:grid-cols-2 sm:gap-4 sm:text-sm lg:grid-cols-4',
            metaGridClassName
          )}
        >
          {metaItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                'min-w-0',
                metaItemLayout === 'inline'
                  ? 'flex flex-wrap items-baseline gap-x-1 gap-y-0.5'
                  : undefined
              )}
            >
              <span className="shrink-0 text-gray-500">{item.label}：</span>
              <div
                className={cn(
                  'min-w-0 font-medium break-words',
                  metaItemLayout === 'inline' ? 'flex-1' : 'mt-1'
                )}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {notice ? (
          <>
            <Separator />
            {notice}
          </>
        ) : null}

        <Separator />

        {summarySlot ? (
          summarySlot
        ) : (
          <div className="rounded-lg bg-gray-50 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4 sm:gap-4">
              {summaryItems.map((item) => (
                <div key={item.label}>
                  <div
                    className={`text-xl leading-tight font-bold break-all sm:text-2xl ${item.accentClassName}`}
                  >
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 sm:text-sm">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div>
          <h4 className="mb-3 text-sm font-medium sm:text-base">
            {breakdownTitle}
          </h4>
          {breakdownItems.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
              {emptyBreakdownText}
            </div>
          ) : (
            <div className={cn('space-y-3', breakdownListClassName)}>
              {breakdownItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4',
                    item.containerClassName ?? 'bg-gray-50',
                    breakdownItemClassName
                  )}
                >
                  <div
                    className={cn(
                      'flex min-w-0 items-center gap-3',
                      breakdownLeadingClassName
                    )}
                  >
                    {item.icon ? (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white sm:h-9 sm:w-9">
                        {item.icon}
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={cn(
                            'min-w-0 flex-1 break-words text-sm font-medium sm:text-base',
                            breakdownTitleClassName
                          )}
                        >
                          {item.title}
                        </div>
                        {item.headerAside ? (
                          <div className="shrink-0">{item.headerAside}</div>
                        ) : null}
                      </div>
                      {item.description ? (
                        <div
                          className={cn(
                            'break-words text-xs leading-5 text-gray-500 sm:text-sm',
                            breakdownDescriptionClassName
                          )}
                        >
                          {item.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {item.amount !== null && item.amount !== undefined ? (
                    <div
                      className={cn(
                        'self-start text-left text-base leading-6 font-bold break-all sm:self-auto sm:text-right sm:text-lg',
                        item.amountClassName ?? 'text-gray-900',
                        breakdownAmountClassName
                      )}
                    >
                      {item.amount}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {footer ? (
          <>
            <Separator />
            {footer}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
