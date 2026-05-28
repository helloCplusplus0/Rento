'use client'

import type { ReactNode } from 'react'

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
  amount: ReactNode
  icon?: ReactNode
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
}: AggregatedBillTemplateCardProps) {
  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="outline" className={badgeClassName}>
              {badgeText}
            </Badge>
          </div>
          {actionSlot}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          {metaItems.map((item) => (
            <div key={item.label} className="min-w-0">
              <span className="text-gray-500">{item.label}：</span>
              <div className="mt-1 font-medium break-words">{item.value}</div>
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
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              {summaryItems.map((item) => (
                <div key={item.label}>
                  <div className={`text-2xl font-bold ${item.accentClassName}`}>
                    {item.value}
                  </div>
                  <div className="text-sm text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div>
          <h4 className="mb-3 font-medium">{breakdownTitle}</h4>
          {breakdownItems.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
              {emptyBreakdownText}
            </div>
          ) : (
            <div className="space-y-3">
              {breakdownItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between ${item.containerClassName ?? 'bg-gray-50'}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {item.icon ? (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white">
                        {item.icon}
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <div className="break-words font-medium">{item.title}</div>
                      {item.description ? (
                        <div className="break-words text-sm text-gray-500">
                          {item.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div
                    className={`self-start text-left font-bold sm:self-auto sm:text-right ${item.amountClassName ?? 'text-gray-900'}`}
                  >
                    {item.amount}
                  </div>
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
