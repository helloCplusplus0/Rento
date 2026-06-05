# Phase08 Api And Auth Foundation 架构规划

## 一、文档定位
本文档用于承接 `phase07-app-shell-and-runtime-foundation` 完成后的下一阶段工作流，回答以下问题：

- 为什么 `phase08` 先冻结最小 API/Auth 骨架，而不是立刻迁移正式业务 API
- 为什么统一 API 宿主继续落到 `server/`，而不是继续扩写旧 `src/app/api/*`
- 为什么认证继续沿用当前自定义 Cookie Session，而不是回退到 NextAuth 或抢跑更复杂的账户体系
- 为什么环境变量采用“`AUTH_SESSION_SECRET` 主变量 + `NEXTAUTH_SECRET` 历史兼容回退”的口径
- 为什么 `src/minix` 只冻结最小登录守卫，不在本阶段扩张到完整角色框架或领域页面迁移

本文档不替代：

- [plan.md](file:///home/dell/Projects/Rento/plan.md) 的阶段顺序与当前结论职责
- [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md) 的入口摘要职责
- [phase08_api_and_auth_foundation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_dev_plan.md) 的子任务拆分职责
- [phase08_api_and_auth_foundation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_shared_baseline.md) 的共享边界职责

## 二、当前阶段前提
### 2.1 已完成上游
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成当前轮文档治理收口
- `phase07-app-shell-and-runtime-foundation` 已完成新应用壳、新运行时入口、旧运行线映射与退出条件冻结

### 2.2 真实现状
- 当前新前端壳已收口到 `src/minix/`，但页面仍主要是占位承接位，尚未接入真实认证流程。
- 当前新运行时已收口到 `server/`，但 Hono 仅承接了 `/api/health` 与最小运行时链，尚未承接认证和统一请求治理。
- 当前正式认证与大多数业务 API 仍由旧 `src/app/api/*`、`src/middleware.ts`、`src/lib/auth/*` 承接。
- 当前认证模型并非 NextAuth，而是“单管理员 + 自定义 Cookie Session”。

### 2.3 为什么现在进入 `phase08`
当前最合理的下一阶段是：

```text
phase08-api-and-auth-foundation
```

原因如下：

- `phase07` 已建立新应用壳与新运行时承接位，后续不再需要把新增 API/Auth 宿主逻辑写回旧 `Next.js` 宿主
- 当前最缺的不是领域语义，而是新的 API 宿主、安全边界与门禁一致性
- 若现在直接进入正式业务 API 迁移，会重新把“宿主切换”“门禁迁移”“领域迁移”绑成一次高风险改写
- 先冻结最小 API/Auth 骨架，能让后续 `phase09` 的业务接口迁移挂到稳定的新宿主上，而不是继续依附旧宿主

## 三、关键决策
### 3.1 统一 API 宿主：继续收口到 `server/`
选择原因：

- `phase07` 已明确 `server/` 是后续新增 API/认证宿主逻辑的默认正式落点
- 当前 `server/app.ts`、`server/index.ts`、`server/routes/health.ts` 已提供最小运行时壳，不需要再新建第三套 API 入口
- 若继续把新认证骨架写回旧 `src/app/api/*`，会直接破坏 `phase07` 已冻结的宿主映射

本阶段结论：

- 新 API/Auth 宿主继续固定在 `server/`
- 旧 `src/app/api/*` 继续保留为存量业务 API、治理/辅助 API 与兼容宿主
- `phase08` 的目标是让后续新增 API 默认挂到 `server/`，而不是继续新增写回旧宿主

### 3.2 认证模型：沿用当前自定义 Cookie Session
选择原因：

- 当前仓库已经存在可运行、可解释的最小认证闭环：
  - `src/lib/auth/session.ts`
  - `src/lib/auth/password.ts`
  - `src/lib/auth/guard.ts`
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/logout/route.ts`
- 当前阶段目标是“保持最小安全边界迁移不失真”，而不是重新设计身份体系
- 引入 NextAuth、用户表、刷新令牌或 RBAC 框架都会把本阶段范围从“承接骨架”扩写成“重做认证方案”

本阶段结论：

- 继续使用“单管理员 + 签名 Cookie Session”模型
- 认证语义直接复用当前 `src/lib/auth/*` 作为参考基线
- 本阶段只迁：
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/session`
- 不在本阶段引入用户表、刷新令牌、审计体系或角色扩展框架

### 3.3 环境变量口径：新主旧兼
选择原因：

- 当前仓库已经在 `src/lib/auth/session.ts` 中采用“`AUTH_SESSION_SECRET` 主读取，`NEXTAUTH_SECRET` 历史兼容回退”的口径
- 部署模板、旧脚本和历史运行线仍存在 `NEXTAUTH_SECRET` / `NEXTAUTH_URL` 的兼容痕迹
- 若本阶段直接彻底切断旧变量名，会额外引入运行线兼容风险

本阶段结论：

- `AUTH_SESSION_SECRET` 是 `phase08` 的正式主变量
- `NEXTAUTH_SECRET` 仅保留为历史兼容回退项
- `NEXTAUTH_URL` 在 `phase08` 仍只视为旧部署链兼容输入，不作为新 API/Auth 宿主的主真相源变量
- `phase08` 需要继续冻结的最小变量包括：
  - `AUTH_SESSION_SECRET`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`
  - `ALLOWED_ORIGINS`
  - `CORS_ENABLED`
  - `MAX_REQUEST_SIZE`
  - `REQUEST_TIMEOUT`
  - `APP_INTERNAL_PORT`

### 3.4 最小公开 API 白名单：继续最小化
选择原因：

- 当前 `src/middleware.ts` 已冻结公开页面和公开 API 的最小集合，这是页面/API 门禁一致性的真实基线
- 当前阶段不迁治理/辅助接口，因此无需扩大公开接口集合
- 公开 API 一旦扩张，后续阶段更容易把临时兼容路径长期保留下来

本阶段结论：

- 公开页面固定为：
  - `/login`
  - `/offline`
- 公开 API 固定为：
  - `/api/health`
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/session`
- 其他后续迁入 Hono 的新 API 默认都受认证守卫保护

### 3.5 页面门禁：`src/minix` 只做最小登录守卫
选择原因：

- `phase07` 已明确 `src/minix` 只承接新前端壳与最小状态页，不承接完整领域页面迁移
- 当前 `src/minix/routes/LoginPage.tsx` 仍是占位实现，`phase08` 需要让它接入真实认证 API
- 当前最需要的是让新前端壳与新 API/Auth 宿主门禁一致，而不是提前在前端设计复杂权限框架

本阶段结论：

- `src/minix` 只冻结：
  - 未登录访问主壳路径跳转 `/login?next=...`
  - 已登录访问 `/login` 自动回跳
  - 登录页真实调用 `POST /api/auth/login`
  - 主壳路由通过 `GET /api/auth/session` 做最小登录态探测
- 不在本阶段引入角色扩展框架、完整 loader 数据迁移或领域页面守卫细分

### 3.6 健康检查契约：优先兼容旧脚本
选择原因：

- 当前 `scripts/health-check.sh` 已把 `/api/health` 视为唯一主健康入口
- 旧 `src/app/api/health/route.ts` 返回更完整的健康结构，Hono 版当前实现更轻
- 若本阶段把健康接口完全改造成另一套结构，现有脚本与运维口径会出现漂移

本阶段结论：

- `GET /api/health` 继续保留顶层 `status` 字段与既有状态语义
- Hono 版健康检查在不破坏兼容的前提下尽量承接：
  - `timestamp`
  - `uptime`
  - 核心 `checks`
  - 核心 `metrics`
- 本阶段不把健康检查扩写成完整观测平台，只解决“新宿主可用且与旧脚本兼容”

## 四、承接资产与实现边界
### 4.1 允许直接承接的资产
- `server/app.ts`
- `server/index.ts`
- `server/routes/health.ts`
- `server/lib/env.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/password.ts`
- `src/lib/auth/guard.ts`
- `src/lib/api-error-handler.ts`
- `src/middleware.ts`
- `src/minix/router/index.tsx`
- `src/minix/routes/LoginPage.tsx`
- `.env.example`

### 4.2 允许做的事
- 在 `server/` 中建立统一 `/api` 宿主与认证路由组装方式
- 在 `server/` 中建立会话提取、认证守卫、请求约束与统一错误处理骨架
- 迁入最小认证接口：
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/session`
- 调整 `GET /api/health` 契约，使其对新宿主与旧脚本同时可解释
- 在 `src/minix/` 中建立最小登录守卫与登录回跳逻辑
- 在阶段文档中写清旧宿主保留边界与后续退出前提

### 4.3 暂不做的事
- 不迁移账单、合同、房源、租客、仪表、抄表等正式业务 API
- 不迁移治理/辅助接口，例如 `validation`、`data-consistency`、细分健康检查等
- 不切换 ORM 或数据访问主线
- 不切换最终部署主线
- 不新增用户体系、角色框架、刷新令牌或审计能力
- 不迁移完整页面数据加载和领域页面逻辑

## 五、目标结构
### 5.1 服务端统一 API/Auth 承接位
`phase08` 规划中的服务端目录冻结为：

```text
server/
├── index.ts
├── app.ts
├── middleware/
│   ├── auth-session.ts
│   ├── require-auth.ts
│   ├── request-constraints.ts
│   └── security-headers.ts
├── routes/
│   ├── health.ts
│   └── auth.ts
└── lib/
    ├── api-errors.ts
    └── api-responses.ts
```

### 5.2 前端最小页面门禁承接位
`phase08` 规划中的前端承接位冻结为：

```text
src/minix/
├── router/
│   ├── index.tsx
│   └── guards.ts
├── routes/
│   └── LoginPage.tsx
└── lib/
    └── session-client.ts
```

### 5.3 旧宿主保留边界
- 旧 `src/app/api/*`
  - 在 `phase08` 期间继续承担正式业务 API、治理/辅助接口与兼容宿主职责
  - 不再作为新增 API/Auth 骨架默认落点
- 旧 `src/middleware.ts`
  - 继续保护旧页面与旧 API
  - 继续作为新前端守卫和新 Hono 门禁矩阵的参考输入

## 六、环境与契约口径
### 6.1 环境变量口径
- 正式主变量：
  - `AUTH_SESSION_SECRET`
- 历史兼容回退：
  - `NEXTAUTH_SECRET`
- 继续冻结的最小认证与请求治理变量：
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`
  - `ALLOWED_ORIGINS`
  - `CORS_ENABLED`
  - `MAX_REQUEST_SIZE`
  - `REQUEST_TIMEOUT`
  - `APP_INTERNAL_PORT`

### 6.2 API 契约口径
- `GET /api/health`
  - 继续作为唯一主健康入口
  - 继续返回可被现有脚本识别的顶层 `status`
- `POST /api/auth/login`
  - 输入：`{ username, password }`
  - 输出：最小用户信息 + `Set-Cookie`
- `POST /api/auth/logout`
  - 输出：标准成功响应 + 清除 Session Cookie
- `GET /api/auth/session`
  - 输出：当前是否已登录与最小用户信息
  - 只服务于最小页面门禁与登录态探测

### 6.3 页面/API 一致性口径
- 新前端壳和新 API 宿主必须继续共享同一套最小公开路由边界
- 未登录用户访问主壳路径时，前端必须跳到 `/login?next=...`
- 未登录用户访问受保护 API 时，服务端必须返回统一的 401 语义
- 已登录用户访问 `/login` 时，前端必须回跳默认首页或 `next` 指定路径

## 七、阶段结论
`phase08-api-and-auth-foundation` 的阶段价值不在于“已经完成 Hono 版正式业务迁移”，而在于：

```text
先把统一 API 宿主、认证会话、请求治理与最小页面/API 门禁一致性冻结下来，
再让后续正式业务接口迁移挂到新的稳定 API 宿主上。
```

这能确保：

- 不会继续把新增 API/Auth 宿主逻辑写回旧 `Next.js` 宿主
- 不会把认证迁移、领域迁移、数据访问层收口与部署切线重新绑成一次大爆炸改写
- 不会在最小安全边界未冻结前就仓促进入正式业务接口迁移
- 当前阶段结论：`phase08` 已完成架构规划冻结，后续应按 `dev_plan` 子任务顺序进入 `/spec`
