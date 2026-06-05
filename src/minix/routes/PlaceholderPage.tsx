import type { MinixRouteDefinition } from './route-manifest'

interface PlaceholderPageProps {
  route: MinixRouteDefinition
}

export function PlaceholderPage({ route }: PlaceholderPageProps) {
  return (
    <section className="rounded-3xl border border-border/80 bg-card p-8 shadow-sm">
      <div className="max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {route.nextPhase}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            route: /{route.path}
          </span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{route.title}</h2>
        <p className="text-sm leading-7 text-muted-foreground">{route.description}</p>
        <div className="rounded-2xl border border-dashed border-border/80 bg-background p-5 text-sm text-muted-foreground">
          当前占位页仅用于冻结新的前端宿主、导航关系和路由承接位，后续会在不重做 UI 风格的前提下逐步接入现有页面壳。
        </div>
      </div>
    </section>
  )
}
