import { NavLink, Outlet } from 'react-router-dom'

import { minixClientEnv } from '../env'
import { minixPrimaryRoutes } from '../routes/route-manifest'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'bg-card text-muted-foreground hover:text-foreground',
  ].join(' ')

export function MinixShellLayout() {
  return (
    <div className="min-h-app bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="container-desktop flex flex-col gap-4 py-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                phase07-01
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {minixClientEnv.appName} 应用壳承接位
              </h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                当前仅冻结 Vite + React Router 的前端壳入口、基础导航与后续迁移落点，不在此阶段迁移正式业务页面。
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm text-muted-foreground">
              <p>客户端模式: {minixClientEnv.mode}</p>
              <p>API 基址: {minixClientEnv.apiBaseUrl}</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Rento-miniX 主导航占位">
            <NavLink to="/" end className={navLinkClassName}>
              主页
            </NavLink>
            {minixPrimaryRoutes.map((route) => (
              <NavLink key={route.path} to={`/${route.path}`} className={navLinkClassName}>
                {route.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container-desktop py-8">
        <Outlet />
      </main>
    </div>
  )
}
