# Phase14 Dashboard And Settings Query Host Closure Spec

## Why
`phase14-02` 需要把 dashboard 与 settings 的 query host、bridge 角色、治理边界与后续 drain 顺序冻结成单一解释，否则首页 `/` 与设置页 `/settings` 会继续依赖“已有 Hono 路由但是否算正式宿主”这类模糊判断。

## What Changes
- 冻结 dashboard 域各条 `/api/dashboard/*` 路径的当前宿主解释、bridge 边界与 drain 顺序。
- 冻结 settings 域 `/api/settings*` 的当前 API 身份、治理属性与最小 Hono 宿主解释。
- 明确 dashboard/query helper、page-closure compat helper 与 settings/global-settings 之间的角色分工。
- 明确首页、设置页与治理接口之间的边界，不把 settings 或 dashboard 辅助路径误判为已完成正式业务 API 切流。
- 保持本子任务只做冻结与解释，不实现 dashboard 新 query model，不重做 settings 权限/审计，不进入治理页面迁移。

## Impact
- Affected specs: `phase14-api-query-parity-and-legacy-route-drain`、`phase13-frontend-page-parity-implementation`、`phase10-data-access-and-migration-closure`
- Affected code: `docs/phase14_*`、`server/routes/dashboard.ts`、`server/routes/settings.ts`、`src/app/api/dashboard/**/route.ts`、`src/app/api/settings/**/route.ts`、`src/lib/page-closure-compat/dashboard.ts`、`src/lib/dashboard-queries.ts`、`src/lib/global-settings.ts`

## ADDED Requirements
### Requirement: Dashboard Query Host Freeze
系统 SHALL 为 dashboard 域提供单一的 query host 冻结结论，明确 `/api/dashboard/*` 当前哪些路径仍是 retained-legacy，哪些 Hono 路由只属于 page-closure bridge，而不是正式 query host。

#### Scenario: 首页 dashboard 依赖可解释
- **WHEN** 团队查看首页 `/` 的 dashboard 数据来源
- **THEN** 能明确看到 `server/routes/dashboard.ts`、旧 `src/app/api/dashboard/**/route.ts`、`src/lib/page-closure-compat/dashboard.ts` 与 `src/lib/dashboard-queries.ts` 分别承担什么角色

#### Scenario: dashboard 静态路径不被误判
- **WHEN** 团队检查 `/api/dashboard/stats`、`/contract-alerts`、`/upcoming-contracts`、`/leaving-tenants`、`/overdue-payments`、`/unpaid-rent`、`/vacant-rooms`
- **THEN** 每条路径都能回溯到当前 Hono 承接位、旧 Next 宿主或 retained-legacy 保留原因

### Requirement: Settings API Identity Freeze
系统 SHALL 为 settings 域提供单一的 API 身份解释，明确 `/api/settings` 与 `/api/settings/init` 当前仍属于治理型 retained-legacy，`server/routes/settings.ts` 仅是最小治理兼容宿主。

#### Scenario: 设置页不被误判为正式业务 API 已切流
- **WHEN** 团队查看设置页 `/settings` 的服务端承接方式
- **THEN** 不会因为 `server/routes/settings.ts` 已挂载就把 settings 域误判为正式业务 API 已完成切流

#### Scenario: 初始化入口治理边界可解释
- **WHEN** 团队检查 `/api/settings/init`
- **THEN** 能明确其仍属治理/初始化辅助入口，而不是正式业务主链接口

### Requirement: Dashboard And Settings Boundary Closure
系统 SHALL 冻结首页、设置页与治理接口之间的边界，避免 dashboard / settings / governance 三者继续混写。

#### Scenario: governance 不被包装成 dashboard/settings 正式完成项
- **WHEN** 团队评估 `/api/validation`、`/api/data-consistency`、健康辅助或 settings 初始化类接口
- **THEN** 这些入口不会被包装成 dashboard 或 settings 已完成正式 query host 切流的证据

#### Scenario: 后续 drain 顺序可复用
- **WHEN** 后续 `phase14-03 ~ phase14-07` 继续引用 dashboard/settings 结论
- **THEN** 不需要重新定义首页、设置页与治理辅助入口的边界

## MODIFIED Requirements
### Requirement: Phase14 Domain Host Matrix Reuse
`phase14-01` 已冻结的 host matrix 字段集 SHALL 被 `phase14-02` 直接复用到 dashboard 与 settings 域，不再新增第二套 dashboard/settings 专用矩阵字段。

#### Scenario: phase14-02 继承 phase14-01
- **WHEN** 团队为 dashboard/settings 输出冻结结论
- **THEN** 继续使用 `inventoryScope`、`dominantCategory`、`formalHosts`、`bridgeHosts`、`domainServicePaths`、`pageImpact`、`drainPriority` 与 `freezeConclusion`

### Requirement: Dashboard And Settings Handoff Reuse
`phase13` 已冻结的首页 `/` 与设置页 `/settings` 页面-API/query 交接 SHALL 作为 `phase14-02` 的直接输入，而不是被重新审计。

#### Scenario: 页面影响面直接复用
- **WHEN** `phase14-02` 冻结 dashboard/settings 结论
- **THEN** 直接继承 `phase13` 对首页与设置页的页面影响判断

## REMOVED Requirements
### Requirement: None
**Reason**: 本子任务只新增 `phase14-02` 的冻结与解释要求，不移除既有能力。
**Migration**: 无。
