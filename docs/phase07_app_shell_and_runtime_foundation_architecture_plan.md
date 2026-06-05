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
- 后续是否正式切入主入口，已由 `phase07-04` 冻结旧运行线映射与退出条件；真正执行切换留给后续阶段判断

### 3.4 旧运行线映射：先冻结边界，再决定退出
选择原因：

- `src/app`、`src/app/api/*`、`scripts/dev-entry.mjs` 与 `scripts/start-entry.mjs` 仍承担当前存量运行线与回滚基线职责
- 若不先冻结“哪些继续保留、哪些不再扩写、哪些只能作为参考”，后续 `phase08` 与 `phase09` 会重新把新能力写回旧宿主
- 旧宿主当前仍有实际运行价值，但这种并行关系只服务于迁移过渡，而不是接受长期双主线并存

本阶段结论：

- 旧 `src/app` 在 `phase07` 结束后继续承担参考基线、存量运行线和未迁移页面壳的兼容职责
- 旧 `src/app/api/*` 在 `phase08` 前继续承担存量业务 API、存量认证 API 和兼容宿主职责
- 旧 `scripts/dev-entry.mjs` 与 `scripts/start-entry.mjs` 继续服务于旧 `Next.js` 宿主、回滚验证和存量运行线，不作为新主线脚本
- `src/minix/` 与 `server/` 是后续新增前端宿主逻辑与新增 API/认证宿主逻辑的默认正式落点

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
- `phase07` 已新增并冻结：
  - `dev:minix`
  - `build:minix`
  - `start:minix`

### 6.3 旧宿主保留边界与并行关系
- 旧 `src/app`
  - 保留为当前正式页面壳、未迁移页面和 UI 参考基线
  - 允许继续作为存量运行线与回滚对照输入存在
  - 不再作为新增前端宿主逻辑、路由骨架或新页面壳的默认落点
- 旧 `src/app/api/*`
  - 在 `phase08` 前继续承载当前存量业务 API、认证 API 与兼容路径
  - 允许作为 API 契约、鉴权策略和错误处理的参考输入
  - 不再作为新增 API 宿主、中间件骨架或新认证承接位的默认落点
- 旧启动脚本
  - `scripts/dev-entry.mjs` 继续服务于旧 `Next.js` 开发态与参考验证
  - `scripts/start-entry.mjs` 继续服务于旧 `Next.js` 存量启动与回滚基线
  - 在新主线脚本、验证路径和回滚口径未冻结前，不允许停用或删除
- 并行关系
  - 开发态：新主线使用 `Vite + Hono` 双服务代理验证 `src/minix/` 与 `server/`；旧 `npm run dev` 保留为存量运行线和参考对照
  - 验证态：新宿主负责验证应用壳、路由骨架、基础中间件与 `/api/health`；旧宿主负责提供现状行为对照与回滚基线
  - 存量运行线：在部署主线正式切换前，旧 `Next.js` 仍是当前可运行宿主；新宿主只冻结承接方向，不在 `phase07` 直接接管正式生产职责

### 6.4 旧宿主退出条件
- 旧前端壳允许退出的前提至少包括：
  - `src/minix/` 已承接正式路由骨架、根布局、主导航和约定中的基础页面壳
  - 需要切走的正式业务页面已有明确迁移承接位和验证路径
  - 新壳通过对应构建、路由与 smoke test，且保留可执行回滚路径
- 旧 API 宿主允许退出的前提至少包括：
  - `server/` 已冻结统一 API 宿主、中间件、错误处理和认证承接骨架
  - 计划退出的旧接口已完成迁移并通过门禁、契约与主链验证
  - 旧 `src/app/api/*` 不再承担新主线仍依赖的关键入口
- 旧启动脚本允许退出的前提至少包括：
  - `dev:minix`、`build:minix`、`start:minix` 或等价新主线脚本已冻结
  - 新主线的开发、构建、启动、健康检查与回滚说明已收口到文档和脚本
  - 部署主线与回滚基线已进入后续阶段冻结，不再依赖旧 `Next.js` 启动链

### 6.5 `phase08` 与 `phase09` 直接输入清单
- `phase08-api-and-auth-foundation`
  - 正式宿主输入：`server/`、`/api/health` 承接位、最小环境变量读取层、后续新增 `dev:minix` / `start:minix` 脚本口径
  - 存量参考输入：旧 `src/app/api/*`、`src/middleware.ts`、`src/lib/auth/*`、`src/lib/api-error-handler.ts`、`src/lib/observability.ts`
  - 禁止越界项：不把合同、账单、仪表、抄表等正式领域服务迁移混入本阶段，不切部署主线，不删除旧宿主代码
- `phase09-domain-service-migration`
  - 正式宿主输入：`server/` 中已冻结的统一 API 宿主与中间件承接位、`src/minix/` 中已冻结的前端壳与路由承接位
  - 存量参考输入：旧 `src/app/*` 页面行为、旧 `src/app/api/*` 领域接口、`src/lib/prisma.ts`、`src/lib/queries.ts` 及相关主链语义实现
  - 禁止越界项：不在领域迁移阶段反向重写 UI 设计语言、不提前切数据访问主线或部署主线、不以删除旧宿主替代迁移验收

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
- 当前阶段结论：`phase07` 已完成应用壳、运行时基础、旧运行线映射与退出条件冻结，可作为 `phase08` 与 `phase09` 的直接上游输入
