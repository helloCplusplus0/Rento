# Phase08-03 Request Constraints And Error Pipeline Spec

## Why
`phase08-02` 已把最小认证闭环迁入 `server/`，但新宿主目前仍缺少统一的请求治理与错误出口，`server/app.ts` 只保留了非常薄的 `onError` 兜底。若不把旧 `src/lib/api-error-handler.ts` 的最小安全边界收口到 Hono 中间件链，后续迁入的新 API 会在 CORS、超时、请求体大小限制、错误响应结构和健康检查兼容性上持续分叉。

## What Changes
- 新建 `server/middleware/request-constraints.ts`
- 新建 `server/middleware/security-headers.ts`
- 新建 `server/lib/api-errors.ts`
- 新建 `server/lib/api-responses.ts`
- 在 `server/app.ts` 中串联最小请求治理链：
  - CORS 预检与来源白名单
  - 请求体大小限制
  - 请求超时
  - 统一错误响应
  - 基础安全响应头
- 校准 `server/routes/health.ts` 的 `GET /api/health` 响应结构，使现有 `scripts/health-check.sh` 继续可识别
- 继续保留不迁移治理/辅助接口、不引入复杂限流或外部网关的阶段边界

## Impact
- Affected specs: `phase08` 最小安全边界、统一错误出口、请求治理、健康检查兼容性
- Affected code: `server/app.ts`、`server/routes/health.ts`、`server/lib/env.ts`、`src/lib/api-error-handler.ts`、`src/app/api/health/route.ts`、`scripts/health-check.sh`

## ADDED Requirements
### Requirement: 新宿主必须提供统一错误出口
系统 SHALL 在 Hono 新宿主中提供统一的 API 错误出口，使后续迁入的 `/api/*` 路由可以获得一致的状态码、错误类型和最小调试信息，而不再依赖各路由各自拼装错误响应。

#### Scenario: API 路由抛出异常
- **WHEN** Hono 宿主中的 API 路由抛出业务错误、参数错误或运行时错误
- **THEN** 系统应返回统一的 JSON 错误响应
- **AND** 响应中应包含稳定的 `success`、`error`、`errorType`、`timestamp` 等最小字段
- **AND** API 错误响应不应退化为前端资源路由的纯文本兜底

### Requirement: 新宿主必须集中承接最小请求约束
系统 SHALL 在 Hono 中间件链中集中承接最小请求约束，包括 CORS 预检、来源白名单、请求体大小限制与请求超时，而不再把这些约束散落在单个 API 处理器中。

#### Scenario: 请求来源与请求体不满足约束
- **WHEN** 客户端发起跨域预检请求、超出白名单来源请求或超过大小限制的写请求
- **THEN** 系统应在统一中间件层处理
- **AND** 受影响请求应返回可解释、可复用的稳定错误语义
- **AND** 未命中约束的请求应继续进入路由处理链

### Requirement: 新宿主必须提供基础安全响应头
系统 SHALL 为 Hono 宿主中的 API 响应追加最小安全响应头，使新宿主的安全基线不弱于现有 Next.js 中间件。

#### Scenario: 客户端访问 API
- **WHEN** 客户端请求 Hono 宿主中的任意 API 路径
- **THEN** 响应应附带基础安全响应头
- **AND** 这些响应头至少覆盖 `X-Frame-Options`、`X-Content-Type-Options` 与 `Referrer-Policy`

### Requirement: 新宿主健康检查必须兼容现有脚本
系统 SHALL 保持 `GET /api/health` 的健康状态字段与现有 `scripts/health-check.sh` 的识别方式兼容，避免切换宿主后破坏现有健康检查脚本。

#### Scenario: 健康检查脚本读取 Hono 健康响应
- **WHEN** `scripts/health-check.sh` 请求新宿主的 `GET /api/health`
- **THEN** 返回 JSON 中必须继续包含脚本可识别的 `status`
- **AND** `status` 至少继续覆盖 `healthy`、`degraded`、`unhealthy`
- **AND** 返回结构允许扩展，但不能移除脚本当前依赖的最小字段

## MODIFIED Requirements
### Requirement: `phase08` 的最小安全边界承接方式
`phase08` 的最小安全边界要求修改为：认证门禁之外，请求治理能力也必须在 `server/` 的统一中间件链中集中承接，而不是继续依赖旧 `Next.js` API 装饰器。

#### Scenario: 新增 API 路由迁入 Hono
- **WHEN** 后续子任务把新 API 路由迁入 `server/`
- **THEN** 新路由应自动继承统一错误出口、请求约束与安全头
- **AND** 不需要再次复制旧 `withApiErrorHandler()` 的分散式逻辑

### Requirement: Hono 健康检查的响应结构
`phase07` 时期 Hono 健康检查只需提供最小运行时可见性；自 `phase08-03` 起，健康检查必须同时承担现有脚本兼容入口职责。

#### Scenario: 旧脚本继续命中新健康入口
- **WHEN** 部署或本地验证继续使用 `scripts/health-check.sh`
- **THEN** Hono 宿主返回的 `GET /api/health` 应继续被脚本识别为成功、降级或失败
- **AND** 不要求复制旧宿主的全部指标细节，但必须保留脚本识别所需的最小健康语义

## REMOVED Requirements
### Requirement: 新宿主继续只依赖 `app.onError()` 的薄兜底
**Reason**: `phase08-03` 的目标是把最小请求治理和错误处理收口到 Hono 中间件链，单靠 `app.onError()` 的文本/弱 JSON 兜底无法支撑后续 API 迁移。
**Migration**: 以 `server/lib/api-errors.ts`、`server/lib/api-responses.ts`、`server/middleware/request-constraints.ts`、`server/middleware/security-headers.ts` 形成统一治理链，并在 `server/app.ts` 中集中挂载。
