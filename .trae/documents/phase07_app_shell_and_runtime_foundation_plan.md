# Phase07 App Shell And Runtime Foundation Plan

## Summary
- 本轮 `/plan` 只为 `phase07-app-shell-and-runtime-foundation` 产出阶段规划，不直接进入 `/spec`、不直接改代码。
- 目标是把 `phase07` 的实现边界从当前 `plan.md` 的摘要级描述，提升为可审核、可执行的阶段级文档组合，并提前冻结关键技术决策。
- 已基于仓库真实现状确认：当前实现仍是 `Next.js App Router + Prisma + PostgreSQL` 单体宿主；`phase07` 必须在不破坏既有 UI 与业务主链语义的前提下，为后续 `Hono` 版迁移建立新的应用壳与运行时承接位。

## Current State Analysis

### 现有宿主与运行时事实
- 当前前端和 API 仍由 `Next.js` 宿主承接，核心入口位于 `src/app/layout.tsx`、`src/app/page.tsx` 与 `src/app/api/*`。
- 当前路由守卫和最小安全头由 `src/middleware.ts` 统一处理，公开 API 白名单包括 `/api/health`、`/api/auth/login`、`/api/auth/logout`。
- 当前健康检查主入口是 `src/app/api/health/route.ts`，内部依赖 `src/lib/observability.ts`、`src/lib/prisma.ts` 与性能监控能力。
- 当前开发态/生产态启动入口分别是 `scripts/dev-entry.mjs` 与 `scripts/start-entry.mjs`，两者都围绕 `Next.js` 宿主工作。
- 当前环境变量模板仍以 Next.js/容器化运行线为主，见 `.env.example`；其中 `NEXTAUTH_URL`、`ALLOWED_ORIGINS`、`APP_INTERNAL_PORT`、`AUTH_SESSION_SECRET`、`DATABASE_URL` 等是后续迁移时必须继续保持口径稳定的关键变量。

### 可直接复用的前端壳资产
- `src/components/layout/AppLayout.tsx` 已冻结桌面/移动双导航壳和虚拟键盘 inset 处理逻辑，可作为 `Vite + React Router` 新壳的直接承接起点。
- `src/components/layout/UnifiedNavigation.tsx` 已承载主导航、设置入口、通知入口与桌面搜索框，但当前绑定 `next/link`、`next/navigation`，后续需做适配。
- `src/lib/route-config.ts` 已冻结导航元数据与主要业务路径，可作为 React Router 路由表与导航信息的参考基线。
- `src/lib/page-governance.ts` 已冻结辅助页面分类与门禁判断口径，后续新壳与新运行时应继续沿用这一套治理边界。

### 可直接复用的服务端基础资产
- `src/lib/auth/session.ts` 当前基于 Web Crypto + Cookie 实现会话签名，语义与宿主耦合较低，适合作为后续 Hono 会话处理中间件的直接参考或轻量适配层。
- 健康检查逻辑中与 Prisma、性能快照、内存/磁盘检查相关的核心判断可以继续沿用，但需从 Next Route Handler 宿主形态抽离。
- `src/lib/prisma.ts`、`prisma/schema.prisma` 与现有 PostgreSQL 主线仍是后续所有阶段的数据库基线，`phase07` 不应重写数据模型。

### 现有技术口径与外部文档核验
- Context7 已核验 `Hono` 文档，确认适合使用 `basePath()`、中间件链和 `@hono/node-server` 作为 Node 运行时入口。
- Context7 已核验 `@hono/node-server` 文档，确认 Node 适配器支持 `serve({ fetch: app.fetch, port })` 形式的单入口服务。
- Context7 已核验 `Vite` 文档，确认适合通过 `react` 前端入口、`import.meta.env`、静态构建输出与开发代理组合来承接新应用壳。

## Assumptions & Decisions
- 前端路由方案：采用 `React Router`，不在 `phase07` 引入更重的路由抽象。
- 开发拓扑：采用“双服务代理”方案。
  - `Vite` 承接前端开发服务器。
  - `Hono` 承接新服务端运行时与健康检查。
  - 前端开发态通过代理访问 Hono API。
- 切换方式：采用“先并行壳，后切换”。
  - `phase07` 先建立 `Rento-miniX` 新应用壳与新运行时的正式承接位。
  - 不在本阶段直接替换全部旧 `Next.js` 业务入口。
- 后端运行时：采用 `Hono + @hono/node-server`。
- 前端承载：采用 `Vite + React + React Router`，保留 `@/*` 路径别名，继续复用现有组件和页面结构资产。
- 数据访问：继续以 `Prisma + PostgreSQL` 为既有基线，`phase07` 不做 ORM 方案切换。
- 认证迁移：`phase07` 只冻结会话与门禁承接骨架，不在本轮完成完整认证 API 迁移，完整认证骨架归入 `phase08-api-and-auth-foundation`。
- 生产切换：`phase07` 只冻结新运行时入口与最小健康检查，不切换最终部署主线，不替换现有 `docker-compose.yml` / `nginx/nginx.conf` / `scripts/cloud-deploy.sh` 的生产职责。

## Proposed Changes

### 1. 同步顶层真相源，允许 `phase07` 进入正式规划
- 更新 `AGENTS.md`
  - 把“当前下一步”从 `phase06` 审核点推进到“准备进入 `phase07 /plan` 审核产物”。
  - 冻结 `phase07` 的决策口径：`React Router`、双服务代理、先并行壳后切换。
- 更新 `project_rules.md`
  - 明确 `phase07` 是“应用壳与运行时基础承接阶段”，禁止在此阶段顺手扩张到领域服务、ORM 切换或部署切线。
- 更新 `architecture_map.md`
  - 增加新的“`phase07` 目标结构”说明，标注未来前端壳入口、Hono 运行时入口与旧 Next 宿主的临时并行关系。
- 更新 `plan.md`
  - 把 `phase07` 的摘要条目与本轮阶段文档保持一致，但仍保持 `plan.md` 只做全局摘要，不承接子任务细节。

### 2. 新增 `phase07` 阶段架构规划文档
- 新建 `docs/phase07_app_shell_and_runtime_foundation_architecture_plan.md`
- 文档必须冻结以下内容：
  - 为什么 `phase07` 先做应用壳和运行时，不先做领域迁移。
  - 为什么前端路由采用 `React Router`。
  - 为什么开发态采用 `Vite + Hono` 双服务代理，而不是立刻做单服务嵌入。
  - 为什么本阶段选择“先并行壳后切换”，而不是直接让新壳接管所有正式业务入口。
  - 新旧宿主边界：
    - 旧 `Next.js` 继续是参考基线与存量运行线。
    - 新 `Hono + Vite` 是后续 `Rento-miniX` 正式主线承接位。
  - 需要继续承接的现有资产：
    - `src/components/layout/AppLayout.tsx`
    - `src/components/layout/UnifiedNavigation.tsx`
    - `src/lib/route-config.ts`
    - `src/lib/page-governance.ts`
    - `src/lib/auth/session.ts`
    - `src/app/api/health/route.ts` 中可抽离的健康检查逻辑

### 3. 新增 `phase07` 阶段开发规划文档
- 新建 `docs/phase07_app_shell_and_runtime_foundation_dev_plan.md`
- 文档按顺序拆成后续 `/spec` 子任务，建议最少包含以下子任务：
  - `phase07-01-runtime-workspace-foundation`
    - 新建 `Hono + Vite + React Router` 基础工程文件与脚本。
    - 仅建立新主线最小目录，不迁移业务逻辑。
  - `phase07-02-frontend-app-shell-migration`
    - 承接 `AppLayout`、导航壳、路由骨架、全局样式与基础页面壳。
  - `phase07-03-runtime-entry-and-health-check-foundation`
    - 建立 `Hono` 运行时入口、基础中间件、`/api/health` 与最小环境变量读取层。
  - `phase07-04-legacy-runtime-mapping-and-exit-conditions`
    - 写清旧 `Next.js` 宿主在 `phase07` 完成后仍保留什么、退出条件是什么、哪些 API/页面仍暂挂旧宿主。
- 每个子任务要包含：
  - 目标
  - 范围
  - 不在范围内
  - DoD

### 4. 新增 `phase07` 共享基线文档
- 新建 `docs/phase07_app_shell_and_runtime_foundation_shared_baseline.md`
- 文档需统一冻结以下共享语义：
  - UI 默认承接，不重做设计语言。
  - 主链业务语义不改写。
  - `Prisma + PostgreSQL` 继续作为当前数据真相源。
  - 新运行时目录仅承接壳与基础入口，不提前侵入账单、合同、仪表、抄表主链。
  - 双服务代理仅用于开发态便利，不自动等同于最终生产部署结构。
  - 旧 `Next.js` 宿主在 `phase07` 期间只作为参考基线与存量运行线，不再被扩写为未来主线。

### 5. 冻结 `phase07` 实现目录方案，为后续 `/spec` 提供单一目标
- 在本轮文档中固定未来实现目录，不在后续 `/spec` 再改结构：
  - 前端：
    - `index.html`
    - `vite.config.ts`
    - `src/minix/main.tsx`
    - `src/minix/App.tsx`
    - `src/minix/router/index.tsx`
    - `src/minix/routes/*`
    - `src/minix/layout/*`
    - `src/minix/styles/*`
    - `src/minix/env.ts`
  - 服务端：
    - `server/index.ts`
    - `server/app.ts`
    - `server/middleware/*`
    - `server/routes/health.ts`
    - `server/lib/*`
  - 运行脚本：
    - `scripts/dev-minix.mjs`
    - `scripts/start-minix.mjs`
    - 如有必要补充 `scripts/load-minix-env.ts`
- 目录选择原因：
  - 保持根级 `src/` 现有 `Next.js` 参考代码不动。
  - 把新主线显式收口到 `src/minix` 与 `server`，避免与 `src/app` 混写。
  - 允许后续逐步搬迁现有组件与逻辑，而不是一次性翻写。

### 6. 冻结 `phase07` 的环境与脚本策略
- `package.json` 未来在实现阶段需要新增但本轮只在文档中冻结的脚本：
  - `dev:minix`
  - `build:minix`
  - `start:minix`
  - 可能还需要 `type-check:minix`
- 环境变量策略在文档中先冻结：
  - 浏览器端统一改为 `VITE_*` 前缀变量。
  - 服务端继续保留 `AUTH_SESSION_SECRET`、`DATABASE_URL`、`ALLOWED_ORIGINS`、`APP_INTERNAL_PORT` 等关键变量。
  - `NEXTAUTH_URL` 的历史语义在 `phase07` 只记为兼容输入，不再作为新主线浏览器端配置真相源。

### 7. 冻结前端应用壳的最小承接范围
- `phase07` 的前端只承接：
  - 根布局与导航壳
  - 主导航五个正式业务路径的路由骨架
  - 登录页壳入口
  - 离线兜底页壳
  - 404 / error / loading 基础占位策略
- `phase07` 的前端明确不承接：
  - 全量业务页面逻辑迁移
  - 领域查询与写操作实现
  - 认证流程完整迁移
  - 账单/合同/抄表主链业务逻辑迁移

### 8. 冻结后端运行时的最小承接范围
- `phase07` 的 Hono 运行时只承接：
  - Node 入口
  - 基础中间件链
  - `/api/health`
  - 最小静态资源或前端壳托管预留位
  - 环境变量读取与基础错误处理骨架
- `phase07` 的 Hono 运行时明确不承接：
  - 账单、合同、房源、租客、抄表的正式业务 API
  - 完整认证会话 API
  - 部署切线与生产基础设施变更

## Verification Steps
- 计划文档完成后，逐项核对以下事实是否在文档中被明确写出：
  - `phase07` 的目标、边界、非目标与阶段价值。
  - `React Router`、双服务代理、先并行壳后切换这三个关键决策。
  - 未来实现目录的固定位置与命名。
  - 现有可复用资产清单与“直接复用 / 适配 / 后置”的判断。
  - `phase07` 子任务顺序与每个子任务的 DoD。
  - 与 `phase08`、`phase09`、`phase10`、`phase11` 的上下游边界。
- 顶层真相源核对：
  - `AGENTS.md`
  - `project_rules.md`
  - `architecture_map.md`
  - `plan.md`
- 阶段文档核对：
  - `docs/phase07_app_shell_and_runtime_foundation_architecture_plan.md`
  - `docs/phase07_app_shell_and_runtime_foundation_dev_plan.md`
  - `docs/phase07_app_shell_and_runtime_foundation_shared_baseline.md`
- 验证通过标准：
  - 审核者可以仅凭阶段文档理解 `phase07` 为什么这样切、准备改哪些文件、哪些文件暂时不动、以及通过后下一步如何进入 `/spec`。

