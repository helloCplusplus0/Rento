import { minixClientEnv } from '../env'
import { legacyGuardParallelBoundaryChecklist } from '../router/guards'

import { minixOpsGovernanceRoutes, minixPrimaryRoutes, minixStateRoutes } from './route-manifest'

export function HomePage() {
  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <article className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-3">
            <p className="text-sm font-medium text-primary">
              phase08-04 Minix Login Guard And Legacy Mapping
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              新前端壳已接入最小登录守卫，并冻结与旧宿主的并行门禁边界
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              当前工作台用于确认 `src/minix/` 已接入真实认证 API、最小登录态探测与登录回跳。现有 UI 风格、图标语义和信息架构继续沿用旧实现，完整业务逻辑仍保留在旧宿主作为参考基线。
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm text-muted-foreground">
            <p>应用名: {minixClientEnv.appName}</p>
            <p>运行模式: {minixClientEnv.mode}</p>
            <p>API 基址: {minixClientEnv.apiBaseUrl}</p>
          </div>
        </div>
      </article>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight">正式业务路径承接位</h3>
          <div className="mt-4 space-y-3">
            {minixPrimaryRoutes.map((route) => (
              <div
                key={route.path}
                className="rounded-2xl border border-border/80 bg-background p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="font-medium">{route.label}</h4>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                    {route.path}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {route.description}
                </p>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight">基础状态页承接位</h3>
            <div className="mt-4 space-y-3">
              {minixStateRoutes.map((route) => (
                <div
                  key={route.path}
                  className="rounded-2xl border border-border/80 bg-background p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-medium">{route.label}</h4>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {route.path}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {route.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight">phase08-04 并行门禁边界清单</h3>
            <div className="mt-4 space-y-3">
              {legacyGuardParallelBoundaryChecklist.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/80 bg-background p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-medium">{item.title}</h4>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {item.owner}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.boundary}</p>
                  <p className="mt-2 text-sm leading-7 text-foreground/80">
                    验证方式：{item.verification}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight">共享治理来源</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              <li>`src/lib/route-config.ts` 提供页面标题、描述与主导航元数据基线。</li>
              <li>`src/lib/navigation-config.ts` 提供桌面/移动端导航顺序与入口差异。</li>
              <li>`src/lib/page-governance.ts` 继续承接运维治理页与辅助页边界。</li>
            </ul>
            <div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-background p-4">
              <p className="text-sm font-medium text-foreground">治理页仍保留在旧宿主参考侧</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                {minixOpsGovernanceRoutes.map((route) => (
                  <p key={route.path}>
                    {route.path}：{route.label}，分类为 {route.category}
                  </p>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </section>
    </section>
  )
}
