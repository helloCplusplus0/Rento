# Phase08-02 Auth Session And Minimal Auth Routes Spec

## Why
`phase08-01` 已经把 `server/` 冻结为统一 `/api` 宿主，并为 `/api/auth/login`、`/api/auth/logout`、`/api/auth/session` 预留了公开接口边界，但这些接口目前仍只是 `501 NOT_IMPLEMENTED` 占位。若不在本子任务中把最小认证闭环迁入 Hono，新前端壳和后续受保护 API 将无法依附新宿主形成稳定的登录、登出与会话探测链路。

## What Changes
- 将 `server/routes/auth.ts` 从占位响应升级为最小认证路由实现
- 新建或适配 `server/middleware/auth-session.ts`，在 Hono 宿主中提取并校验 Cookie Session
- 新建或适配 `server/middleware/require-auth.ts`，为后续默认受保护 API 提供统一守卫基础
- 复用 `src/lib/auth/session.ts` 的 Cookie、签名与 Session Payload 语义
- 复用 `src/lib/auth/password.ts` 的管理员用户名/密码校验逻辑
- 正式承接以下接口：
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/session`
- 明确旧 `src/app/api/auth/*` 进入兼容保留状态，不再作为新增认证骨架默认宿主

## Impact
- Affected specs: `phase08` 最小认证闭环、Cookie Session、一致性门禁、公开认证接口契约
- Affected code: `server/routes/auth.ts`、`server/middleware/auth-session.ts`、`server/middleware/require-auth.ts`、`server/app.ts`、`src/lib/auth/session.ts`、`src/lib/auth/password.ts`、`src/app/api/auth/login/route.ts`、`src/app/api/auth/logout/route.ts`、`src/minix/*` 的后续登录态消费路径

## ADDED Requirements
### Requirement: 新宿主必须提供最小认证闭环
系统 SHALL 在 `server/` 中提供可用的最小认证闭环，包括登录、登出与会话探测，使新 API/Auth 宿主能够独立承接最小登录链路。

#### Scenario: 用户在新宿主登录并探测会话
- **WHEN** 用户通过新宿主请求 `POST /api/auth/login`
- **THEN** 系统应校验管理员用户名和密码
- **AND** 成功后应返回最小用户信息并写入 `httpOnly` Session Cookie
- **AND** 后续请求 `GET /api/auth/session` 时应能返回当前登录态与最小用户信息

### Requirement: 新宿主必须复用当前 Cookie Session 语义
系统 SHALL 继续复用 `src/lib/auth/session.ts` 中的 Cookie 名称、有效期、签名校验和 Session Payload 语义，不在本阶段重新设计认证模型。

#### Scenario: Session Cookie 语义保持一致
- **WHEN** 用户通过新宿主完成登录或登出
- **THEN** 新宿主设置和清除的 Cookie 行为应与旧宿主最小语义一致
- **AND** Cookie 名称、`httpOnly`、`sameSite`、`secure`、`path`、`maxAge` 口径应保持可解释一致

### Requirement: 新宿主必须提供统一会话提取能力
系统 SHALL 在 `server/middleware/auth-session.ts` 中提供 Hono 可复用的会话提取能力，使后续受保护 API 能在新宿主中统一读取当前管理员会话。

#### Scenario: 后续受保护接口读取当前会话
- **WHEN** 受保护 API 在新宿主中执行
- **THEN** 中间件应能从 Cookie 中提取并验证 Session
- **AND** 路由处理器应能读取当前管理员会话
- **AND** 未登录或无效会话应得到统一的未授权结果

### Requirement: 新宿主必须提供统一认证守卫基础
系统 SHALL 在 `server/middleware/require-auth.ts` 中提供可复用的最小认证守卫，为后续默认受保护 API 提供稳定的 401/403 语义基础。

#### Scenario: 未登录用户访问受保护接口
- **WHEN** 未登录用户访问未来迁入 `server/` 的受保护 API
- **THEN** 系统应返回统一的 401 语义
- **AND** 若存在已登录但角色不符的情况，应保留统一的 403 语义承接位

## MODIFIED Requirements
### Requirement: 公开认证接口的宿主职责
`phase08` 的公开认证接口职责修改为：`/api/auth/login`、`/api/auth/logout`、`/api/auth/session` 不再只是新宿主占位路由，而必须成为新宿主中的正式最小认证接口。

#### Scenario: 用户判断认证接口应由哪个宿主承接
- **WHEN** 用户查看 `server/routes/auth.ts` 与旧 `src/app/api/auth/*`
- **THEN** 用户应能确认新宿主已经正式承接最小认证闭环
- **AND** 旧 `src/app/api/auth/*` 应仅保留兼容与参考职责

### Requirement: `phase08` 的页面/API 门禁一致性前提
`phase08` 的页面/API 门禁一致性前提修改为：新宿主必须先提供真实会话探测接口与统一认证守卫基础，后续 `src/minix` 最小登录守卫才能稳定消费新登录态。

#### Scenario: 后续前端壳接入登录态探测
- **WHEN** 后续子任务让 `src/minix` 调用 `GET /api/auth/session`
- **THEN** 新宿主应返回可被前端稳定消费的最小登录态结果
- **AND** 前端不需要再依赖旧宿主的认证接口维持初始化链路

## REMOVED Requirements
### Requirement: 新宿主的认证路由继续长期停留在 `NOT_IMPLEMENTED`
**Reason**: `phase08-02` 的目标就是把最小认证闭环迁入 Hono，不能继续让登录、登出与会话探测停留在占位响应。
**Migration**: 用真实的 `POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/auth/session` 替换 `501 NOT_IMPLEMENTED` 占位逻辑，并把 Cookie Session 与守卫基础收口到 `server/`。
