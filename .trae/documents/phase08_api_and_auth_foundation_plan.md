# Phase08 Api And Auth Foundation Plan

## Summary
- 本轮 `/plan` 只为 `phase08-api-and-auth-foundation` 产出阶段规划，不直接进入 `/spec`、不直接改代码。
- 当前目标是把 `plan.md` 中 `phase08` 的摘要级描述，提升为可审核、可执行的阶段级文档组合，并把 `server/` 作为统一 API 宿主的最小承接范围彻底冻结。
- 已基于仓库真实现状确认：`phase07` 已完成 `src/minix/ + server/ + dev:minix/build:minix/start:minix` 承接位；旧 `Next.js` 宿主仍在承接正式认证与业务 API，`phase08` 必须先把认证会话、门禁中间件、错误处理与基础 API 契约迁到新宿主，而不是顺手迁移领域服务。

## Current State Analysis

### 已完成上游与当前主线
- `phase07` 阶段文档已经冻结 `server/` 作为新增 API/认证宿主的默认落点，旧 `src/app/api/*` 仅保留为 `phase08` 前的存量 API、认证 API 与兼容宿主。
- 当前仓库的默认工作流已经切到 `phase08-api-and-auth-foundation`，根级真相源 `AGENTS.md`、`plan.md`、`architecture_map.md`、`project_rules.md` 已基本对齐。
- 当前 `phase08` 的正式目标已明确为：统一 API 宿主、认证会话与门禁中间件、错误处理与请求约束、API 契约与环境变量约束。

### 新宿主的现状
- `server/app.ts` 目前只冻结了最小运行时链：`runtimeBanner`、`requestLogger`、`/api/health`、静态资源托管、统一 `notFound/onError`。
- `server/routes/health.ts` 已有最小 Hono 健康检查，但返回结构比旧 `src/app/api/health/route.ts` 更轻，尚未冻结为长期契约。
- `server/lib/env.ts` 当前仅承接 `MINIX_SERVER_HOST`、`MINIX_SERVER_PORT / APP_INTERNAL_PORT`、`MINIX_WEB_PORT`、`MINIX_DIST_DIR` 等运行时参数，还未冻结 API/Auth 所需的安全与请求约束变量。
- `server/` 目录中尚未出现认证、Cookie、CORS、请求体限制、会话提取、授权守卫等中间件文件；现阶段 `server/` 仍属于 phase07 的“壳层完成、API/Auth 未进入”状态。

### 旧认证与 API 的现状
- 旧页面/API 统一门禁集中在 `src/middleware.ts`：
  - 公开页面：`/login`、`/offline`
  - 公开 API：`/api/health`、`/api/auth/login`、`/api/auth/logout`
- 当前认证模型不是 NextAuth，而是自定义管理员单账号 Cookie Session：
  - 会话签名与 Cookie 逻辑在 `src/lib/auth/session.ts`
  - 管理员用户名/密码校验在 `src/lib/auth/password.ts`
  - 路由级鉴权辅助在 `src/lib/auth/guard.ts`
- 旧登录/登出接口已经稳定存在于：
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/logout/route.ts`
- 旧 API 错误处理与请求约束已在 `src/lib/api-error-handler.ts` 中沉淀出可复用规则：
  - CORS 白名单
  - 请求体大小限制
  - 请求超时
  - 标准错误响应
  - `requireAuth` 守卫
- 当前 `src/app/api/*` 中存在两类实现：
  - 已走 `withApiErrorHandler` 的新风格接口：26 个文件、92 处匹配
  - 仍为直接 `export async function` 的旧风格接口：22 个文件、31 处匹配
- 这说明 `phase08` 的重点不是“重新设计 API 语义”，而是“把现有认证与请求治理能力从 Next 宿主抽离到 Hono 统一宿主，并冻结迁移边界”。

### 前端新壳的现状
- `src/minix/router/index.tsx` 已使用 `createBrowserRouter` 建立最小路由骨架，但尚未接入登录态守卫。
- `src/minix/routes/LoginPage.tsx` 目前仍是 phase07 占位实现，只做本地延时后跳转，没有调用真实认证 API。
- `src/minix/routes/route-manifest.tsx` 已明确 `/login`、`/offline` 等状态路由以及主导航壳路径，是 `phase08` 页面门禁最小承接的直接输入。

### 环境变量与脚本现状
- `.env.example` 里已经存在 `AUTH_SESSION_SECRET`、`NEXTAUTH_SECRET`、`ADMIN_USERNAME`、`ADMIN_PASSWORD_HASH`、`ALLOWED_ORIGINS`、`CORS_ENABLED`、`MAX_REQUEST_SIZE`、`REQUEST_TIMEOUT` 等变量。
- `src/lib/auth/session.ts` 当前实现采用“`AUTH_SESSION_SECRET` 主读取，`NEXTAUTH_SECRET` 历史兼容回退”的口径。
- `scripts/health-check.sh` 仍以 `/api/health` 为唯一主健康入口，外部脚本依赖至少保持 `status` 顶层字段稳定。

### Context7 文档核验结论
- Context7 已核验 `Hono` 最新文档，确认适合继续使用：
  - `@hono/node-server` 的 `serve({ fetch: app.fetch, port })`
  - `app.route()` 做路由组装
  - `app.use()` 做中间件链
  - `onError` / `notFound` 作为统一 API 错误出口
  - Cookie helper 处理服务端 Cookie 读写
- Context7 已核验 `react-router` 最新文档，确认 `createBrowserRouter` 体系支持：
  - loader 中基于登录态结果做 `redirect('/login')`
  - 登录后按 `next` 参数回跳
  - 以最小守卫方式冻结路由层认证边界

## Assumptions & Decisions
- 范围边界：`phase08` 只冻结最小 API/Auth 骨架，不提前迁移治理接口和正式领域服务。
- 统一宿主：新增 API/Auth 宿主继续固定在 `server/`，不把新认证骨架写回旧 `src/app/api/*`。
- 认证模型：继续沿用当前“单管理员 + 签名 Cookie Session”模型，不在本阶段引入用户表、刷新令牌或 RBAC 框架。
- 环境变量：`AUTH_SESSION_SECRET` 作为正式主变量；`NEXTAUTH_SECRET` 继续保留为历史兼容回退，并在文档中明确其兼容项身份。
- 页面门禁：`src/minix` 只冻结最小登录守卫，不扩展到角色权限框架。
- 健康检查契约：新 Hono `/api/health` 继续保持旧脚本可识别的 `status` 口径，并尽量承接旧返回结构中的核心字段，而不是重新定义全新形状。
- API 范围：
  - 本阶段正式迁入 Hono：`/api/health`、`/api/auth/login`、`/api/auth/logout`、`/api/auth/session`
  - 本阶段继续保留在旧宿主：正式业务 API、治理/辅助 API、领域写路径
- 兼容策略：旧 `src/app/api/*` 与 `src/middleware.ts` 继续保留为参考基线与兼容宿主，直到后续阶段满足退出条件。

## Proposed Changes

### 1. 同步顶层真相源，收口 `phase08` 的阶段定位
- 校对并按需更新 `AGENTS.md`
  - 把当前阶段重点补充为：最小 API/Auth 骨架、环境变量“新主旧兼”、`src/minix` 最小页面守卫。
- 校对并按需更新 `project_rules.md`
  - 明确 `phase08` 期间禁止提前迁移治理接口、领域服务、ORM 切换和部署切线。
- 校对并按需更新 `architecture_map.md`
  - 增加 `phase08` 目标结构与旧/新宿主映射，说明新 API/Auth 落点、旧宿主保留边界和最小公开路由矩阵。
- 更新 `plan.md`
  - 保持总览职责不变，但将 `phase08` 从“待启动”推进为“规划产出完成，待审核”或等价表述。

### 2. 新增 `phase08` 阶段架构规划文档
- 新建 `docs/phase08_api_and_auth_foundation_architecture_plan.md`
- 文档必须冻结以下决策：
  - 为什么 `phase08` 只做最小 API/Auth 骨架，不顺手迁治理接口或领域服务。
  - 为什么统一 API 宿主继续落在 `server/`，而不是继续扩写旧 `src/app/api/*`。
  - 为什么认证继续沿用自定义 Cookie Session，而不是回退到 NextAuth 或提前设计复杂账户体系。
  - 为什么环境变量采用“`AUTH_SESSION_SECRET` 主变量 + `NEXTAUTH_SECRET` 历史兼容”的口径。
  - 为什么 `src/minix` 页面门禁只冻结最小登录守卫，并与 API 门禁保持一致。
  - 为什么 `/api/health` 需要保留旧健康检查的核心契约，而不是让 Hono 版健康接口完全另起炉灶。
- 文档中必须明确的接口范围：
  - 公开页面：`/login`、`/offline`
  - 公开 API：`/api/health`、`/api/auth/login`、`/api/auth/logout`、`/api/auth/session`
  - 受保护 API：后续所有新 API 默认受认证守卫保护

### 3. 新增 `phase08` 共享基线文档
- 新建 `docs/phase08_api_and_auth_foundation_shared_baseline.md`
- 文档需统一冻结以下共享语义：
  - `server/` 是正式 API/Auth 宿主承接位；旧 `src/app/api/*` 仅为参考和兼容输入。
  - `src/lib/auth/session.ts`、`src/lib/auth/password.ts` 是认证语义的直接复用基线，不重写认证模型。
  - `src/lib/api-error-handler.ts` 中的 CORS、请求体限制、超时、标准错误响应是请求治理的直接参考基线。
  - `src/middleware.ts` 中的公开路由矩阵是页面/API 门禁的一致性基线。
  - `src/minix` 只承接最小登录页与最小登录守卫，不在本阶段迁移正式业务页面逻辑。
  - 禁止越界：
    - 不迁移合同、账单、房源、租客、仪表、抄表等正式领域服务
    - 不迁治理/辅助接口
    - 不切 ORM
    - 不切部署主线
    - 不删除旧宿主代码

### 4. 新增 `phase08` 开发规划文档
- 新建 `docs/phase08_api_and_auth_foundation_dev_plan.md`
- 文档建议拆为以下顺序子任务：
  - `phase08-01-unified-api-host-and-env-contract`
    - 目标：冻结 `server/` 中的 API 根装配、环境变量读取与公开/受保护路由边界。
    - DoD：新宿主已有统一 `/api` 入口、公开路由矩阵、环境变量读取口径与旧宿主映射说明。
  - `phase08-02-auth-session-and-minimal-auth-routes`
    - 目标：迁入 `/api/auth/login`、`/api/auth/logout`、`/api/auth/session`，并把 Cookie Session 接到 Hono。
    - DoD：新宿主可完成登录、登出、会话探测；返回契约与 Cookie 行为稳定。
  - `phase08-03-request-constraints-and-error-pipeline`
    - 目标：把 `CORS`、请求体大小限制、超时、标准错误响应、401/403/404 语义迁入 Hono 中间件链。
    - DoD：Hono API 已具备最小安全边界与统一错误出口。
  - `phase08-04-minix-login-guard-and-legacy-mapping`
    - 目标：让 `src/minix` 用最小登录守卫接入新的会话探测接口，并明确旧 `Next.js` 中间件与新前端守卫的并行边界。
    - DoD：未登录访问主壳路径会跳 `/login?next=...`；已登录访问 `/login` 会回跳；旧页面/API 门禁与新壳门禁口径一致。
- 每个子任务必须包含：
  - 目标
  - 范围
  - 不在范围内
  - 参考来源
  - DoD

### 5. 冻结 `phase08` 的实现目录与文件落点
- 在阶段文档中固定下列实现落点，避免后续 `/spec` 再次摇摆：
  - 继续修改：
    - `server/app.ts`
    - `server/index.ts`
    - `server/routes/health.ts`
    - `server/lib/env.ts`
    - `src/minix/router/index.tsx`
    - `src/minix/routes/LoginPage.tsx`
    - `.env.example`
    - `plan.md`
    - `architecture_map.md`
    - `AGENTS.md`
    - `project_rules.md`
  - 新增服务端文件建议：
    - `server/routes/auth.ts`
    - `server/middleware/auth-session.ts`
    - `server/middleware/require-auth.ts`
    - `server/middleware/security-headers.ts`
    - `server/middleware/request-constraints.ts`
    - `server/lib/api-responses.ts`
    - `server/lib/api-errors.ts`
  - 新增前端文件建议：
    - `src/minix/router/guards.ts`
    - `src/minix/lib/session-client.ts`
- 目录选择原因：
  - 让 Hono 宿主完整承接 API/Auth 基础设施。
  - 让 `src/minix` 只承接最小登录守卫和登录页行为，不混入领域迁移。
  - 继续复用 `src/lib/auth/*` 作为认证语义基线，而不是平行复制第二套认证实现。

### 6. 冻结 `phase08` 的 API 契约与门禁策略
- 文档中应明确以下接口契约：
  - `GET /api/health`
    - 保持顶层 `status`、`timestamp`、`uptime` 等旧脚本可依赖字段稳定。
    - 在不破坏兼容性的前提下，补充新运行时信息。
  - `POST /api/auth/login`
    - 请求：`{ username, password }`
    - 成功：`success: true` + 用户最小信息 + `Set-Cookie`
    - 失败：继续使用标准错误响应
  - `POST /api/auth/logout`
    - 成功：清除 Session Cookie 并返回标准成功响应
  - `GET /api/auth/session`
    - 返回当前是否已登录，以及最小用户信息
    - 作为 `src/minix` 路由守卫的唯一会话探测入口
- 门禁策略必须冻结为：
  - 公开 API 白名单只包含：`/api/health`、`/api/auth/login`、`/api/auth/logout`、`/api/auth/session`
  - 其余未来迁入 Hono 的新 API 默认受认证守卫保护
  - 401/403 响应形状与旧宿主保持同类语义

### 7. 冻结 `phase08` 的环境变量与兼容口径
- `AUTH_SESSION_SECRET`
  - 正式主变量
- `NEXTAUTH_SECRET`
  - 仅历史兼容回退，不再作为新宿主真相源变量
- 继续保留并文档化：
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`
  - `ALLOWED_ORIGINS`
  - `CORS_ENABLED`
  - `MAX_REQUEST_SIZE`
  - `REQUEST_TIMEOUT`
  - `APP_INTERNAL_PORT`
- 文档中要写清：
  - 哪些变量属于 `phase08` 必须冻结项
  - 哪些变量仅是旧部署链兼容项
  - 哪些变量在 `phase08` 不需要新增

### 8. 冻结 `src/minix` 的最小页面门禁方案
- `src/minix/router/index.tsx`
  - 继续沿用 `createBrowserRouter`
  - 为主壳路由引入最小登录态 loader/guard
  - 为 `/login` 引入“已登录自动回跳”逻辑
- `src/minix/routes/LoginPage.tsx`
  - 从 phase07 占位页升级为真实登录入口
  - 表单提交到 Hono `POST /api/auth/login`
  - 成功后按 `next` 回跳
- `src/minix` 页面门禁范围必须写清：
  - 只做登录态守卫
  - 不做角色扩展框架
  - 不在本阶段接完整页面数据加载迁移

### 9. 冻结旧宿主保留边界与退出前提
- 旧 `src/app/api/*`
  - `phase08` 期间继续承载正式业务 API 与治理/辅助接口
  - 不再作为新增 API/Auth 骨架默认落点
- 旧 `src/middleware.ts`
  - 继续保护旧页面和旧 API
  - 作为新前端守卫与新 Hono 门禁矩阵的参考基线
- 退出前提要写清：
  - 新 Hono 宿主已稳定承接最小认证骨架
  - 新旧门禁口径一致
  - 后续待迁业务接口已有清晰迁移清单和验证路径

## Verification Steps
- 文档级验证：
  - `docs/phase08_api_and_auth_foundation_architecture_plan.md` 已冻结目标、边界、接口范围、环境变量口径和宿主职责。
  - `docs/phase08_api_and_auth_foundation_dev_plan.md` 已按顺序拆出可进入 `/spec` 的子任务。
  - `docs/phase08_api_and_auth_foundation_shared_baseline.md` 已统一允许路线、禁止路线与旧/新宿主边界。
- 顶层真相源核对：
  - `AGENTS.md`
  - `project_rules.md`
  - `architecture_map.md`
  - `plan.md`
- 关键一致性核对：
  - `phase08` 没有越界到治理接口、领域服务、ORM 或部署主线。
  - 公开页面/API 白名单在所有文档中的表述一致。
  - `AUTH_SESSION_SECRET` 主变量与 `NEXTAUTH_SECRET` 历史兼容口径一致。
  - `src/minix` 的页面门禁范围被明确限制为最小登录守卫。
  - `/api/health` 的兼容性要求被明确写入阶段文档。
- 实施后验收路径预置：
  - `npm run lint`
  - `npm run type-check`
  - 手动验证：
    - 未登录访问 `src/minix` 主壳路径会跳转到 `/login?next=...`
    - 登录成功后按 `next` 回跳
    - `/api/auth/session` 能正确反映登录态
    - `/api/health` 继续返回可被 `scripts/health-check.sh` 识别的健康状态
    - 旧 `src/app/api/*` 中未迁移接口仍保持现状可用
