# Phase08-01 Unified API Host And Env Contract Spec

## Why
`phase07` 已经建立 `server/` 作为新运行时承接位，但当前它仍只承接最小健康检查和静态壳，尚未被正式冻结为 `phase08` 的统一 `/api` 宿主。若不先把统一 API 入口、公开/受保护路由边界和环境变量口径冻结下来，后续认证与请求治理会继续漂移在旧 `src/app/api/*` 与新 `server/` 之间。

## What Changes
- 冻结 `server/app.ts` 为统一 `/api` 宿主的正式装配入口
- 扩展 `server/lib/env.ts`，明确 API/Auth 与请求治理所需最小环境变量读取口径
- 明确最小公开 API 白名单与默认受保护 API 边界
- 明确 `GET /api/health` 在新宿主中的长期承接角色
- 明确 `AUTH_SESSION_SECRET` 为正式主变量、`NEXTAUTH_SECRET` 为历史兼容回退项
- 明确旧 `src/app/api/*` 与新 `server/` 的职责边界，不迁移登录/登出实现本身

## Impact
- Affected specs: `phase08` 统一 API 宿主、环境变量契约、公开 API 白名单、旧/新宿主职责边界
- Affected code: `server/app.ts`、`server/lib/env.ts`、`server/routes/health.ts`、`src/middleware.ts`、`.env.example`、相关阶段文档与顶层真相源

## ADDED Requirements
### Requirement: 新宿主必须提供统一 `/api` 入口
系统 SHALL 将 `server/app.ts` 冻结为 `Rento-miniX` 新 API/Auth 宿主的统一装配入口，并在该入口中区分公开 API 与默认受保护 API 的挂载边界。

#### Scenario: 新 API 宿主入口可解释
- **WHEN** 用户查看 `server/app.ts`
- **THEN** 用户能够确认 `server/` 是新增 API/Auth 的正式宿主
- **AND** 用户能够看出 `/api` 的公开路由与默认受保护路由边界
- **AND** 用户不需要再把新增 API/Auth 骨架默认写回旧 `src/app/api/*`

### Requirement: 统一 API 宿主必须冻结最小公开 API 白名单
系统 SHALL 在新宿主中冻结最小公开 API 白名单，仅允许以下路径在 `phase08-01` 被定义为公开接口：
- `/api/health`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/session`

#### Scenario: 公开 API 边界明确
- **WHEN** 用户阅读统一 API 宿主装配逻辑或阶段文档
- **THEN** 用户能够明确哪些 API 在 `phase08` 中属于公开白名单
- **AND** 其他未来迁入 `server/` 的 API 默认都应被视为受保护接口

### Requirement: 新宿主必须冻结最小环境变量契约
系统 SHALL 在 `server/lib/env.ts` 中明确统一 API 宿主的最小环境变量读取口径，至少覆盖认证主密钥、历史兼容密钥、来源控制、请求体大小、请求超时与内部端口。

#### Scenario: 环境变量口径清晰
- **WHEN** 用户查看 `server/lib/env.ts` 与 `.env.example`
- **THEN** 用户能够确认 `AUTH_SESSION_SECRET` 是正式主变量
- **AND** 用户能够确认 `NEXTAUTH_SECRET` 仅作为历史兼容回退项存在
- **AND** 用户能够确认 `ALLOWED_ORIGINS`、`CORS_ENABLED`、`MAX_REQUEST_SIZE`、`REQUEST_TIMEOUT`、`APP_INTERNAL_PORT` 的用途

### Requirement: 新宿主必须继续承接主健康检查入口
系统 SHALL 将 `GET /api/health` 继续冻结为统一 API 宿主中的唯一主健康入口，并明确它在后续阶段仍服务于新宿主可用性判断和旧脚本兼容。

#### Scenario: 主健康入口角色明确
- **WHEN** 用户查看 `server/routes/health.ts`、`server/app.ts` 或 `scripts/health-check.sh`
- **THEN** 用户能够确认 `/api/health` 是新宿主中的主健康检查入口
- **AND** 用户能够确认它继续承担与现有脚本兼容的长期角色

## MODIFIED Requirements
### Requirement: `phase08` 新旧 API 宿主关系
`phase08` 的新旧 API 宿主关系修改为：旧 `src/app/api/*` 在本阶段继续承担存量业务 API、治理/辅助接口与兼容职责；新 `server/` 则必须明确冻结为新增 API/Auth 骨架的唯一正式宿主。

#### Scenario: 用户判断后续 API/Auth 应挂到哪里
- **WHEN** 用户推进后续 `phase08-02` 或更晚子任务
- **THEN** 用户应优先把新增 API/Auth 骨架挂到 `server/`
- **AND** 用户不应再把“兼容旧接口仍存在”误解为“新增骨架仍可继续写回旧 `src/app/api/*`”

### Requirement: `phase08` 环境变量主次关系
`phase08` 的环境变量口径修改为：`AUTH_SESSION_SECRET` 是统一 API/Auth 宿主的正式主变量，`NEXTAUTH_SECRET` 只作为旧运行线兼容回退，不再作为新宿主主真相源变量传播。

#### Scenario: 用户配置认证密钥
- **WHEN** 用户配置新宿主认证相关环境变量
- **THEN** 用户应优先配置 `AUTH_SESSION_SECRET`
- **AND** 若只存在 `NEXTAUTH_SECRET`，系统也只能将其视为历史兼容回退而非新的正式主口径

## REMOVED Requirements
### Requirement: `server/` 仅作为 phase07 运行时壳保留位
**Reason**: `phase08` 需要让 `server/` 从“最小运行时壳”提升为统一 API/Auth 宿主，否则后续认证与请求治理仍会继续漂移。
**Migration**: 在本变更中冻结统一 `/api` 装配入口、公开 API 白名单、环境变量主次关系与主健康入口角色；登录/登出与会话探测的具体实现留到后续 `phase08-02`。
