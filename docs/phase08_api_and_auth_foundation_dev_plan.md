# Phase08 Api And Auth Foundation 开发规划

## 一、文档定位
本文档用于把 `phase08-api-and-auth-foundation` 拆分为顺序执行的子任务，确保当前仓库先完成统一 API 宿主、最小认证骨架、请求治理与页面/API 门禁一致性，再进入正式领域服务迁移。

## 二、总体推进结论
`phase08` 的执行顺序固定为：

```text
先冻结统一 API 宿主与环境变量口径
    ->
再迁入最小认证会话与认证路由
    ->
再建立请求约束与统一错误处理链
    ->
最后让 src/minix 接入最小登录守卫，并写清旧宿主保留边界
```

原因如下：

- 若不先冻结统一 API 宿主与环境变量口径，后续认证与错误处理仍会继续漂移在旧宿主与新宿主之间
- 若不先迁入最小认证会话与认证路由，后续页面守卫与新 API 宿主无法形成稳定闭环
- 若不先建立请求约束与统一错误处理链，后续新 API 会重新复制旧宿主的治理逻辑
- 若不最后写清 `src/minix` 与旧 `Next.js` 宿主的门禁并行边界，后续阶段会再次出现“前端守卫和 API 守卫口径不同步”的返工

## 三、任务拆分建议
## phase08-01-unified-api-host-and-env-contract
### 目标
冻结 `server/` 中的统一 `/api` 宿主、公开/受保护路由边界、最小运行时装配顺序与环境变量口径，使后续 API/Auth 能明确挂接到新宿主。

### 范围
- 扩展 `server/app.ts`
- 扩展 `server/lib/env.ts`
- 明确 `/api` 下的公开路由与默认受保护路由边界
- 冻结 `AUTH_SESSION_SECRET` 主变量与 `NEXTAUTH_SECRET` 历史兼容回退口径
- 明确 `ALLOWED_ORIGINS`、`CORS_ENABLED`、`MAX_REQUEST_SIZE`、`REQUEST_TIMEOUT` 的读取和用途
- 明确 `GET /api/health` 在新宿主中的长期承接角色

### 参考来源
- `server/app.ts`
- `server/lib/env.ts`
- `src/middleware.ts`
- `.env.example`
- `src/lib/auth/session.ts`

### 不在范围内
- 不迁移正式业务 API
- 不迁移治理/辅助接口
- 不迁入登录/登出逻辑实现
- 不调整最终部署主线

### DoD
- 新宿主已有统一 `/api` 入口和公开/受保护路由矩阵
- 环境变量读取层已明确认证与请求治理所需最小变量
- `AUTH_SESSION_SECRET` 主变量、`NEXTAUTH_SECRET` 历史兼容口径已写清
- 旧宿主与新宿主的 API/Auth 职责边界已可解释

## phase08-02-auth-session-and-minimal-auth-routes
### 目标
把最小认证闭环迁入 Hono：包括登录、登出、会话探测，以及 Cookie Session 的设置、清除和校验。

### 范围
- 新建 `server/routes/auth.ts`
- 新建或适配 `server/middleware/auth-session.ts`
- 新建或适配 `server/middleware/require-auth.ts`
- 复用 `src/lib/auth/session.ts`
- 复用 `src/lib/auth/password.ts`
- 承接以下接口：
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/session`

### 参考来源
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/password.ts`
- `src/lib/auth/guard.ts`

### 不在范围内
- 不引入用户表
- 不引入刷新令牌
- 不扩展角色框架
- 不迁移正式业务接口

### DoD
- 新宿主可完成登录、登出、会话探测
- Cookie 行为与旧宿主最小语义一致
- 401/403 语义可被后续守卫和前端登录流程稳定消费
- 旧登录接口已具备明确兼容保留边界

## phase08-03-request-constraints-and-error-pipeline
### 目标
把请求治理能力从旧 `src/lib/api-error-handler.ts` 收口到 Hono 中间件链，形成可复用的最小安全边界。

### 范围
- 新建 `server/middleware/request-constraints.ts`
- 新建 `server/middleware/security-headers.ts`
- 新建 `server/lib/api-errors.ts`
- 新建 `server/lib/api-responses.ts`
- 在 `server/app.ts` 中串联：
  - CORS 预检与来源白名单
  - 请求体大小限制
  - 请求超时
  - 统一错误响应
  - 基础安全响应头
- 校准 `GET /api/health` 响应结构，保证旧脚本可识别

### 参考来源
- `src/lib/api-error-handler.ts`
- `src/middleware.ts`
- `src/app/api/health/route.ts`
- `server/routes/health.ts`
- `scripts/health-check.sh`

### 不在范围内
- 不引入复杂限流或外部网关
- 不接入 APM/Tracing
- 不迁移治理/辅助接口

### DoD
- Hono 新宿主已有统一错误出口
- 最小请求约束已在新宿主内集中承接
- `/api/health` 继续返回可被现有脚本识别的健康状态
- 新宿主的最小安全边界不会弱于旧宿主

## phase08-04-minix-login-guard-and-legacy-mapping
### 目标
让 `src/minix` 接入真实认证 API 与最小登录守卫，并写清旧 `Next.js` 页面/API 门禁与新前端壳之间的并行边界。

### 范围
- 适配 `src/minix/router/index.tsx`
- 新建或适配 `src/minix/router/guards.ts`
- 新建 `src/minix/lib/session-client.ts`
- 适配 `src/minix/routes/LoginPage.tsx`
- 明确新壳页面守卫与旧 `src/middleware.ts` 的关系

### 参考来源
- `src/minix/router/index.tsx`
- `src/minix/routes/LoginPage.tsx`
- `src/middleware.ts`
- `src/app/login/page.tsx`
- `src/lib/auth/session.ts`

### 不在范围内
- 不迁移正式业务页面逻辑
- 不引入角色扩展框架
- 不迁移领域页面的数据加载和写操作

### DoD
- 未登录访问主壳路径会跳到 `/login?next=...`
- 已登录访问 `/login` 会自动回跳
- 登录页成功调用新宿主 `POST /api/auth/login`
- 页面门禁与 API 门禁继续保持一致
- 旧宿主页面/API 门禁与新壳门禁的并行边界已写成可验证清单

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase08-01-unified-api-host-and-env-contract
phase08-02-auth-session-and-minimal-auth-routes
phase08-03-request-constraints-and-error-pipeline
phase08-04-minix-login-guard-and-legacy-mapping
```

## 五、默认路线约束
`phase08` 的全部子任务都必须遵守：

- 默认优先冻结最小 API/Auth 骨架，而不是抢跑正式业务接口迁移
- 默认继续把 `server/` 视为新 API/Auth 宿主唯一正式落点
- 默认继续把 `src/lib/auth/*`、`src/lib/api-error-handler.ts`、`src/middleware.ts` 视为直接参考基线
- 默认继续把 `src/minix` 的前端职责限制在最小登录守卫，不扩张为完整页面迁移
- 默认继续保持 `Prisma + PostgreSQL` 为数据主线，不在本阶段切 ORM
- 默认不迁治理/辅助接口，不切部署主线，不重做 UI 风格
- 默认由用户审核 `phase08` 阶段文档后，再逐个进入 `/spec`

## 六、结语
`phase08` 的价值不在于“已经完成 Hono 版业务迁移”，而在于：

```text
先让新的 API 宿主、认证门禁、请求治理和最小页面/API 一致性稳定下来，
再让后续正式业务接口按阶段挂接到新的统一宿主上。
```
