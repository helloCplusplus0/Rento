# Tasks

- [x] Task 1: 盘点旧认证闭环与新宿主占位实现的差异。
  - [x] SubTask 1.1: 核对 `src/app/api/auth/login/route.ts`、`src/app/api/auth/logout/route.ts` 的响应形状与 Cookie 行为
  - [x] SubTask 1.2: 核对 `src/lib/auth/session.ts`、`src/lib/auth/password.ts`、`src/lib/auth/guard.ts` 中可直接复用的认证语义
  - [x] SubTask 1.3: 核对 `server/routes/auth.ts` 当前 `NOT_IMPLEMENTED` 占位行为与 `phase08-01` 宿主边界

- [x] Task 2: 在新宿主中实现最小认证路由。
  - [x] SubTask 2.1: 将 `server/routes/auth.ts` 的 `POST /api/auth/login` 升级为真实登录实现
  - [x] SubTask 2.2: 将 `server/routes/auth.ts` 的 `POST /api/auth/logout` 升级为真实登出实现
  - [x] SubTask 2.3: 将 `server/routes/auth.ts` 的 `GET /api/auth/session` 升级为真实会话探测实现

- [x] Task 3: 为 Hono 新宿主建立会话提取与守卫基础。
  - [x] SubTask 3.1: 新建或适配 `server/middleware/auth-session.ts`，统一提取和验证 Cookie Session
  - [x] SubTask 3.2: 新建或适配 `server/middleware/require-auth.ts`，统一提供 401/403 语义基础
  - [x] SubTask 3.3: 确保后续受保护 API 能复用该守卫，不再重新实现会话读取逻辑

- [x] Task 4: 冻结新旧认证宿主的兼容边界。
  - [x] SubTask 4.1: 明确旧 `src/app/api/auth/*` 进入兼容保留状态，不再作为新增认证骨架默认落点
  - [x] SubTask 4.2: 明确 `server/` 已成为最小认证闭环的正式宿主
  - [x] SubTask 4.3: 确保本子任务不越界到正式业务 API 迁移

- [x] Task 5: 校验 Cookie 与登录态语义保持最小一致。
  - [x] SubTask 5.1: 确认新宿主使用 `rento_session` Cookie 与既有 `maxAge`、`sameSite`、`path` 口径
  - [x] SubTask 5.2: 确认安全 Cookie 判断逻辑与旧宿主最小语义一致
  - [x] SubTask 5.3: 确认登录成功、登出成功、未登录探测、无效会话探测的响应结果稳定

- [x] Task 6: 完成工程校验并确认可供后续页面守卫消费。
  - [x] SubTask 6.1: 完成 `lint`、`type-check`
  - [x] SubTask 6.2: 确认 `GET /api/auth/session` 可作为后续 `src/minix` 最小登录守卫的唯一会话探测入口
  - [x] SubTask 6.3: 确认本次实现未引入用户表、刷新令牌、角色框架或正式业务接口迁移

- [x] Task 7: 补齐旧认证宿主的兼容保留标识。
  - [x] SubTask 7.1: 在 `src/app/api/auth/login/route.ts` 标注其仅作为兼容保留路由，不再作为新增认证骨架默认宿主
  - [x] SubTask 7.2: 在 `src/app/api/auth/logout/route.ts` 标注其仅作为兼容保留路由，不再作为新增认证骨架默认宿主
  - [x] SubTask 7.3: 重新验证旧 `src/app/api/auth/*` 与新 `server/` 的宿主边界已在实现层自解释

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2, Task 3
- Task 5 depends on Task 2, Task 3
- Task 6 depends on Task 2, Task 3, Task 4, Task 5
- Task 7 depends on Task 6
