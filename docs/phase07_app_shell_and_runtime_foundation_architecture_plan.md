# Phase07 App Shell And Runtime Foundation 架构规划

## 一、文档定位
本文档用于承接 `phase06-minix-replatform` 完成后的下一阶段工作流，回答以下问题：

- 为什么 `phase07` 要先做应用壳与运行时基础，而不是直接迁移领域服务
- 为什么前端路由采用 `React Router`
- 为什么开发态采用 `Vite + Hono` 双服务代理
- 为什么当前阶段要“先并行壳后切换”，而不是立刻替换全部旧入口
- `phase07` 允许做什么、不允许做什么

本文档不替代：

- [plan.md](file:///home/dell/Projects/Rento/plan.md) 的阶段顺序与当前结论职责
- [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md) 的入口摘要职责
- [phase07_app_shell_and_runtime_foundation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_dev_plan.md) 的子任务拆分职责
- [phase07_app_shell_and_runtime_foundation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_shared_baseline.md) 的共享边界职责

## 二、当前阶段前提
### 2.1 已完成上游
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成当前轮文档治理收口

### 2.2 真实现状
- 当前仓库的现状实现仍是 `Next.js App Router + Prisma + PostgreSQL`
- 旧前端壳入口位于 `src/app/layout.tsx` 与 `src/components/layout/*`
- 旧 API 宿主位于 `src/app/api/*`
- 旧统一路由守卫位于 `src/middleware.ts`
- 当前健康检查入口位于 `src/app/api/health/route.ts`
- 当前开发态和生产态入口脚本分别是 `scripts/dev-entry.mjs` 与 `scripts/start-entry.mjs`

### 2.3 为什么现在进入 `phase07`
当前最合理的下一阶段是：

```text
phase07-app-shell-and-runtime-foundation
```

原因如下：

- `phase06` 已完成真相源切换、完整路线图冻结与目录治理收口，后续不再存在“先补全局边界还是先做实现”的不确定性
- 当前最缺的不是业务语义，而是 `Rento-miniX` 的正式承载位
- 若现在直接进入 API、认证、领域服务或 ORM 层迁移，会继续把后续实现挂靠在旧 `Next.js` 宿主上
- 先建立应用壳与运行时基础，可以最大程度复用现有 UI、导航结构、环境变量口径与健康检查能力

## 三、关键决策
### 3.1 前端路由：采用 `React Router`
选择原因：

- 当前最需要的是低复杂度、可快速承接既有路径结构的路由层
- 现有主要业务路径已经通过 `src/lib/route-config.ts` 冻结，适合直接映射到 `React Router`
- `phase07` 重点是壳和入口，不需要在本阶段引入更重的路由抽象

本阶段结论：

- 新前端壳采用 `Vite + React + React Router`
- 路由骨架优先承接：
  - `/`
  - `/rooms`
  - `/add`
  - `/contracts`
  - `/bills`
  - `/settings`
  - `/login`
  - `/offline`

### 3.2 开发拓扑：采用 `Vite + Hono` 双服务代理
选择原因：

- 当前第一目标是尽快建立新壳与新运行时的独立承接位，而不是把开发态单端口整合复杂化
- `Vite` 前端服务与 `Hono` 运行时分离后，前端壳和服务端入口可以分别稳定推进
- 双服务代理更适合 `phase07` 的最小骨架阶段，能避免过早引入开发态单进程嵌入的额外复杂度

本阶段结论：

- 开发态：
  - `Vite` 负责前端壳与 React Router
  - `Hono` 负责 Node 运行时入口与 `/api/health`
  - 前端通过代理访问 Hono API
- 生产态：
  - 当前只冻结未来承接方向，不在 `phase07` 切换最终部署主线

### 3.3 切入方式：先并行壳，后切换
选择原因：

- 当前 `src/app` 与 `src/app/api/*` 仍是旧主线的现状实现和直接参考基线
- `phase07` 若直接让新壳接管全部正式入口，会把“宿主切换”和“业务迁移”重新绑成一次高风险改写
- 先并行壳能把前端壳迁移、运行时迁移与领域逻辑迁移拆开

本阶段结论：

- `phase07` 先建立新壳与新运行时目录
- 旧 `Next.js` 宿主继续保留为参考基线与存量运行线
- 后续是否正式切入主入口，由 `phase07-04` 明确旧运行线映射与退出条件后再决定

## 四、承接资产与实现边界
### 4.1 允许直接承接的资产
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/UnifiedNavigation.tsx`
- `src/lib/route-config.ts`
- `src/lib/page-governance.ts`
- `src/lib/auth/session.ts`
- `src/app/api/health/route.ts` 中可抽离的健康检查逻辑
- `src/lib/observability.ts`
- `src/lib/prisma.ts`
- `public/` 与现有图标/manifest 资源

### 4.2 允许做的事
- 建立 `src/minix/` 前端应用壳目录
- 建立 `server/` 服务端运行时目录
- 冻结 `Vite` 前端入口、`React Router` 路由骨架与新壳布局
- 冻结 `Hono + @hono/node-server` 的 Node 入口、中间件与 `/api/health`
- 冻结开发态双服务代理脚本与最小环境变量策略
- 明确旧运行线到新壳/新运行时的映射与退出条件

### 4.3 暂不做的事
- 不迁移账单、合同、房源、租客、仪表、抄表等正式业务 API
- 不迁移完整认证 API 与完整会话门禁链
- 不切换长期 ORM 方案
- 不切换最终部署主线
- 不重做 UI 设计语言
- 不重写业务主链语义

## 五、目标结构
### 5.1 前端新壳目录
`phase07` 规划中的前端壳目录冻结为：

```text
src/minix/
├── main.tsx
├── App.tsx
├── env.ts
├── router/
│   └── index.tsx
├── routes/
├── layout/
└── styles/
```

### 5.2 服务端运行时目录
`phase07` 规划中的新运行时目录冻结为：

```text
server/
├── index.ts
├── app.ts
├── middleware/
├── routes/
│   └── health.ts
└── lib/
```

### 5.3 脚本目录扩展
当前阶段规划中的新增脚本包括：

- `scripts/dev-minix.mjs`
- `scripts/start-minix.mjs`
- 必要时补充 `scripts/load-minix-env.ts`

## 六、环境与脚本口径
### 6.1 环境变量口径
- 服务端继续保留：
  - `AUTH_SESSION_SECRET`
  - `DATABASE_URL`
  - `ALLOWED_ORIGINS`
  - `APP_INTERNAL_PORT`
- 浏览器端新增：
  - `VITE_*` 前缀变量
- `NEXTAUTH_URL` 在 `phase07` 只作为历史兼容输入说明，不再作为新前端壳的真相源变量

### 6.2 脚本口径
- 现有 `npm run dev` 与 `npm run start` 仍服务于旧 `Next.js` 宿主
- `phase07` 后续实现阶段才会新增：
  - `dev:minix`
  - `build:minix`
  - `start:minix`

## 七、阶段结论
`phase07-app-shell-and-runtime-foundation` 的阶段价值不在于“已经完成 Hono 版业务迁移”，而在于：

```text
先把新主线的应用壳与运行时基础承接位搭起来，
再让 API、认证、领域服务、数据访问层和部署切线逐步挂到新的正式承载位上。
```

这能确保：

- 不会继续把所有后续迁移挂靠在旧 `Next.js` 宿主之上
- 不会把壳迁移、认证迁移、领域迁移和部署切线混成一次大爆炸改写
- 不会在 UI 与业务主链边界未冻结前就仓促开始正式实现
