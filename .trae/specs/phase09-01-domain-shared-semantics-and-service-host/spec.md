# Phase09-01 Shared Semantics And Service Host Spec

## Why
`phase09` 后续所有主链迁移都依赖一个稳定的共享领域服务承接位和统一的正式宿主边界。若不先冻结 `src/lib/domain/`、`server/routes/*` 与旧 `src/app/api/*` 的职责关系，后续实现会继续在新旧宿主之间漂移，重新制造双重真相源。

## What Changes
- 冻结共享领域服务的正式目录边界，默认落点为 `src/lib/domain/`
- 冻结正式领域路由的正式目录边界，默认落点为 `server/routes/*`
- 冻结 `server/app.ts` 中新增领域路由的挂接方式与顺序
- 冻结旧 `src/app/api/*` 与共享领域服务之间的 compat wrapper / 薄包装职责
- 冻结写路径的事务归属候选口径，供 `phase09-02` 及后续子任务复用
- 明确本子任务不迁移合同、账单、抄表等具体业务逻辑

## Impact
- Affected specs: `phase09-domain-service-migration`
- Affected code: `server/app.ts`, `server/routes/*`, `src/lib/domain/*`, `src/app/api/*`, `src/lib/queries.ts`, `src/lib/prisma.ts`

## ADDED Requirements
### Requirement: Shared Domain Service Layout
系统 SHALL 为 `phase09` 的共享领域服务提供唯一正式承接位，并将其定位为新旧宿主共同复用的业务真相层。

#### Scenario: Freeze shared domain directories
- **WHEN** `phase09-01` 开始实现共享领域服务承接位
- **THEN** 共享目录必须固定在 `src/lib/domain/` 或经 spec 明确批准的等价目录
- **AND** 该目录至少能承接 `contracts`、`billing`、`meters`、`delete-guards`、`shared` 等主链分组
- **AND** 该层不得直接承担 Hono/Next.js 宿主适配职责

### Requirement: Formal Domain Route Host
系统 SHALL 把正式领域 API 的新增承接位固定在 `server/routes/*`，并继续由 `server/app.ts` 的统一 `/api` 宿主负责挂接。

#### Scenario: Mount migrated domain routes
- **WHEN** 后续 `phase09` 子任务新增领域路由
- **THEN** 路由文件必须放入 `server/routes/*`
- **AND** 必须通过 `apiApp.route(...)` 方式挂接到 `server/app.ts`
- **AND** 路由挂接必须发生在 `apiApp.all('*', requireAuth(), ...)` 兜底保护之前
- **AND** 路由仍需服从 `phase08` 已冻结的认证门禁、中间件链与统一错误出口

### Requirement: Legacy Compat Wrapper Boundary
系统 SHALL 将旧 `src/app/api/*` 已迁接口限定为 compat wrapper、薄包装或只读参考，而不是继续承载新增主链业务真相。

#### Scenario: Reuse old Next.js API route after migration
- **WHEN** 某个主链接口已在 `server/routes/*` 或共享领域服务层中被正式承接
- **THEN** 对应旧 `src/app/api/*` 入口只能调用共享领域服务、转发到正式宿主，或保持只读参考
- **AND** 不得在旧入口继续新增独立业务规则
- **AND** 必须能解释其存在原因与退出条件

### Requirement: Transaction Ownership Contract
系统 SHALL 为共享领域服务冻结最小事务归属约定，避免后续写路径在路由层和服务层之间反复漂移。

#### Scenario: Execute cross-entity write workflow
- **WHEN** 后续子任务实现合同激活、账单生成、抄表出账、退租结算等跨实体写流程
- **THEN** 必须由共享领域服务声明事务边界候选
- **AND** 路由层只负责请求解析、鉴权、响应适配与调用编排
- **AND** 并发敏感写场景必须允许沿用现有 Prisma 事务和重试策略

## MODIFIED Requirements
### Requirement: Unified API Host
`phase08` 已冻结的统一 `/api` 宿主继续有效，但在 `phase09-01` 之后，系统还必须为正式领域 API 预留稳定的挂接位，而不再把新增领域接口默认写回旧 `src/app/api/*`。

#### Scenario: Add first phase09 domain endpoint
- **WHEN** 团队开始实现 `phase09-02` 及后续领域接口
- **THEN** 默认新增入口必须优先进入 `server/routes/*`
- **AND** `server/app.ts` 必须能明确表达 `/api` 下健康检查、认证路由、正式领域路由与兜底保护的层级关系

## REMOVED Requirements
### Requirement: New Domain Logic In Legacy Host
**Reason**: 继续把新增主链语义写回旧 `src/app/api/*` 会让 `server/` 与 `src/app/api/*` 长期并行争夺正式宿主职责。
**Migration**: 后续迁移中，旧入口仅保留 compat wrapper、未迁移存量接口或只读参考职责，新增正式领域语义统一进入共享领域服务层和 `server/routes/*`。
