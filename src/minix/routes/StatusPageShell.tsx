import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatusAction {
  label: string
  to?: string
  onClick?: () => void
  variant?: 'default' | 'outline' | 'secondary'
}

interface StatusPageShellProps {
  badge: string
  title: string
  description: string
  icon: ReactNode
  tips?: string[]
  actions?: StatusAction[]
  detail?: ReactNode
  accentClassName?: string
}

export function StatusPageShell({
  badge,
  title,
  description,
  icon,
  tips = [],
  actions = [],
  detail,
  accentClassName = 'bg-slate-900 text-white',
}: StatusPageShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-lg border-slate-200 shadow-lg shadow-slate-200/60">
        <CardHeader className="space-y-4 text-center">
          <div
            className={cn(
              'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl',
              accentClassName
            )}
          >
            {icon}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">{badge}</p>
            <CardTitle className="text-2xl text-slate-900">{title}</CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600">
              {description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {tips.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {tips.map((tip) => (
                <p key={tip}>{tip}</p>
              ))}
            </div>
          ) : null}

          {detail}

          {actions.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {actions.map((action) => {
                if (action.to) {
                  return (
                    <Button
                      key={`${action.label}-${action.to}`}
                      asChild
                      variant={action.variant}
                      className="flex-1"
                    >
                      <Link to={action.to}>{action.label}</Link>
                    </Button>
                  )
                }

                return (
                  <Button
                    key={action.label}
                    type="button"
                    variant={action.variant}
                    className="flex-1"
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                )
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
