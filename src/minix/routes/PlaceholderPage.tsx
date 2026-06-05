import type { MinixRouteDefinition } from './route-manifest'

interface PlaceholderPageProps {
  route: MinixRouteDefinition
}

export function PlaceholderPage({ route }: PlaceholderPageProps) {
  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <article className="rounded-3xl border border-border/80 bg-card p-8 shadow-sm">
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              phase07-02
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              route: {route.path}
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{route.title}</h2>
          <p className="text-sm leading-7 text-muted-foreground">{route.description}</p>
          <div className="rounded-2xl border border-dashed border-border/80 bg-background p-5 text-sm text-muted-foreground">
            当前页面是新的统一前端宿主挂载位。它负责承接布局、导航、路由和模块边界，后续才会逐步接入既有业务页主体，而不是在此阶段直接迁移完整业务逻辑。
          </div>
        </div>
      </article>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight">本页已冻结的承接语义</h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
            <li>继续复用旧导航顺序、图标语义和模块命名，不另起第二套路由壳。</li>
            <li>继续由 `React Router` 驱动页面切换与激活态，替代 `next/link` / `next/navigation`。</li>
            <li>继续把完整查询、写操作和认证闭环留在后续阶段，不在 phase07-02 越界迁移。</li>
          </ul>
        </article>

        <aside className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight">复用来源</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {route.governanceSource.map((source) => (
              <span
                key={source}
                className="rounded-full border border-border/80 bg-background px-3 py-1 text-xs text-muted-foreground"
              >
                {source}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            后续业务页面迁移应继续以这些共享资产为准，避免在 `src/minix/` 再造一套新的样式、导航元数据或治理口径。
          </p>
        </aside>
      </section>
    </section>
  )
}
