# Runtime Entry And Health Check Foundation Spec

## Why
`phase07-01` 已先行为 `Rento-miniX` 建立 `server/` 目录、`Hono` Node 入口、最小环境变量读取层与 `/api/health` 雏形，但这些能力目前仍更像“工作区基础已可运行”，还没有在 `phase07` 中被正式收口为新的服务端入口边界。若不在本阶段把运行时入口、中间件链、错误处理、健康检查和静态托管预留位冻结为正式承接位，后续 API 与认证阶段仍容易回退到依附旧 `src/app/api/*`` 的推进方式。

## What Changes
- 正式收口 `server/index.ts` 与 `server/app.ts` 作为 `Rento-miniX` 新服务端运行时入口
- 冻结基础中间件链，包括最小日志、运行时标识与后续扩展挂载顺序
- 正式承接 `/api/health` 到 `Hono` 运行时
- 冻结最小错误处理骨架与 `notFound` 返回策略
- 收口最小环境变量读取层，明确主机、端口、dist 目录等运行时口径
- 明确静态资源与前端壳托管预留位，使新运行时能承接构建后的前端壳
- 不迁移正式业务 API、完整认证 API 或部署主线切换

## Impact
- Affected specs: `phase07` 服务端正式入口、基础中间件链、健康检查承接、错误处理、环境变量读取、静态托管预留位
- Affected code: `server/index.ts`、`server/app.ts`、`server/routes/health.ts`、`server/lib/env.ts`、`server/lib/static.ts`、`server/middleware/*`、必要的 `scripts/start-minix.mjs` 与运行时相关文档/说明

## ADDED Requirements
### Requirement: 新服务端运行时必须有正式 Node 入口
系统 SHALL 将 `server/index.ts` 与 `server/app.ts` 冻结为 `Rento-miniX` 的正式服务端运行时入口，而不是只把它们视为前期工作区脚手架。

#### Scenario: 用户查看新服务端入口
- **WHEN** 用户查看 `server/index.ts` 与 `server/app.ts`
- **THEN** 用户应能确认 `Hono + @hono/node-server` 是新主线的正式 Node 入口
- **AND** 用户应能理解后续 API 与认证能力将挂载到该入口
- **AND** 用户不需要再把新 API 默认放回旧 `src/app/api/*`

### Requirement: 新服务端必须有基础中间件链
系统 SHALL 在 `server/app.ts` 中提供可解释的基础中间件链，至少覆盖运行时标识、最小日志以及后续中间件扩展顺序。

#### Scenario: 用户查看中间件链
- **WHEN** 用户阅读 `server/app.ts` 与 `server/middleware/*`
- **THEN** 用户应能看出请求进入后的基础中间件顺序
- **AND** 用户应能区分哪些中间件用于当前最小运行时，哪些是后续 API/认证阶段的预留挂载位
- **AND** 中间件链不应在当前阶段过度扩张到完整认证或正式业务 API 逻辑

### Requirement: `/api/health` 必须由 Hono 正式承接
系统 SHALL 将 `/api/health` 作为新服务端运行时中的正式健康检查入口，由 `Hono` 承接并返回可解释的最小健康状态。

#### Scenario: 用户访问健康检查接口
- **WHEN** 用户请求 `/api/health`
- **THEN** 响应应来自 `server/routes/health.ts` 对应的 `Hono` 路由
- **AND** 响应应能表达最小运行状态与依赖检查结果
- **AND** 后续服务端启动不再需要依附旧 `src/app/api/health/route.ts`

### Requirement: 新服务端必须有最小错误处理骨架
系统 SHALL 为新服务端运行时提供最小错误处理骨架，包括未命中 API 路由时的 `notFound` 响应与未处理异常时的 `onError` 响应。

#### Scenario: 用户请求未知路由或运行时出错
- **WHEN** 用户访问未知 API 路径或运行时抛出未处理错误
- **THEN** 新服务端应返回一致、可解释的最小错误响应
- **AND** API 路由与前端壳静态托管的错误返回应具备清晰区分

### Requirement: 新服务端必须有最小环境变量读取层
系统 SHALL 在 `server/lib/env.ts` 中提供最小环境变量读取层，统一管理主机、端口、构建产物目录等运行时口径。

#### Scenario: 用户查看运行时环境配置
- **WHEN** 用户阅读 `server/lib/env.ts` 或运行 `start:minix`
- **THEN** 用户应能明确 `MINIX_SERVER_HOST`、`MINIX_SERVER_PORT`、`APP_INTERNAL_PORT`、`MINIX_DIST_DIR` 等值如何被解析
- **AND** 非法端口或关键配置异常应有明确失败方式

### Requirement: 静态资源与前端壳托管必须有预留位
系统 SHALL 明确新服务端对构建后前端壳的静态托管预留位，使运行时能够在需要时承接 `dist/` 产物，而无需切换部署主线。

#### Scenario: 用户查看静态资源托管策略
- **WHEN** 用户阅读 `server/lib/static.ts` 或相关运行时路由
- **THEN** 用户应能理解新服务端如何处理静态资源与 SPA 回退
- **AND** 用户应能区分开发态依赖 Vite 与构建态依赖 `dist/` 托管的差异

## MODIFIED Requirements
### Requirement: `phase07` 的服务端承接位
`phase07` 的服务端承接位修改为：不仅要在 `server/` 中提供可运行的最小骨架，还要正式收口 Node 入口、中间件链、错误处理、健康检查和静态托管预留位，使其成为后续 API 与认证阶段的正式宿主。

#### Scenario: 用户判断 `phase07-03` 是否达到 DoD
- **WHEN** 用户检查 `server/` 目录与运行时启动行为
- **THEN** 用户应能确认新服务端运行时已有正式 Node 入口
- **AND** 用户应能确认 `/api/health` 已由 `Hono` 正式承接
- **AND** 用户不应再把当前服务端理解为仅供前端工作区验证的临时壳

### Requirement: 新旧 API 宿主关系
新旧 API 宿主关系修改为：旧 `src/app/api/*` 在当前阶段继续保留为参考基线与存量实现；新服务端的正式启动与健康检查能力则必须由 `server/` 独立承接。

#### Scenario: 用户准备进入后续 API 或认证阶段
- **WHEN** 用户继续推进 `phase08` 或 `phase07` 后续服务端子任务
- **THEN** 用户应能明确新 API 与认证能力优先挂载到 `server/`
- **AND** 用户不应再把“要能启动新主线服务端”理解为必须先依赖旧 `src/app/api/*`

## REMOVED Requirements
### Requirement: `phase07-01` 中的最小运行时骨架即可长期充当正式服务端入口
**Reason**: `phase07-01` 的目标是建立工作区与最小可运行表达，不足以单独承担后续 API、认证与静态托管的正式服务端宿主职责。
**Migration**: 在 `phase07-03-runtime-entry-and-health-check-foundation` 中正式收口 `server/index.ts`、`server/app.ts`、基础中间件链、`/api/health`、错误处理、环境变量读取与静态托管预留位。
