import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="rounded-3xl border border-border/80 bg-card p-8 shadow-sm">
      <div className="max-w-xl space-y-4">
        <p className="text-sm font-medium text-primary">404</p>
        <h2 className="text-2xl font-semibold tracking-tight">未找到对应的 Rento-miniX 占位路由</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          当前只建立了 `phase07-01` 需要的最小路由骨架。若你是从深链接进入，请先回到应用壳首页再继续后续迁移。
        </p>
        <Link
          to="/"
          className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
        >
          返回主页
        </Link>
      </div>
    </section>
  )
}
