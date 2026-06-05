import { minixPrimaryRoutes } from './route-manifest'

export function HomePage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
      <article className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Runtime Workspace Foundation</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            新主线目录、入口和脚本已从旧宿主中拆出正式承接位
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">
            当前页面用于确认新前端壳已经独立落到 `src/minix/`，后续 `phase07-02` 将在此继续承接导航壳、页面壳和错误边界；正式业务页面逻辑仍保留在旧宿主作为参考基线。
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/80 bg-background p-4">
            <h3 className="text-base font-semibold">本阶段已固定</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Vite 前端入口与 `index.html`</li>
              <li>React Router 最小路由骨架</li>
              <li>Hono Node 运行时与 `/api/health`</li>
              <li>`dev:minix` / `build:minix` / `start:minix`</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background p-4">
            <h3 className="text-base font-semibold">明确不在范围</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>正式业务 API 迁移</li>
              <li>完整认证与会话门禁</li>
              <li>最终部署主线切换</li>
              <li>重做现有 UI 风格</li>
            </ul>
          </div>
        </div>
      </article>
      <aside className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">后续页面承接位</h2>
        <div className="mt-4 space-y-3">
          {minixPrimaryRoutes.map((route) => (
            <div key={route.path} className="rounded-2xl border border-border/80 bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-medium">{route.label}</h3>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                  {route.nextPhase}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{route.description}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  )
}
