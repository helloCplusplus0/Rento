# Phase14 Route Inventory Host Matrix Spec

## Why
`phase14-01` 需要把旧 `src/app/api/*`、Hono `server/routes/*`、shared compat helper 与共享领域服务之间的当前关系冻结成单一 route inventory host matrix，否则后续 `phase14-02 ~ phase14-07` 会继续重复定义分类、宿主与 drain 顺序。

## What Changes
- 冻结 `formal-host-owned`、`compat-wrapper`、`retained-legacy` 三类 route inventory 在 `phase14` 语境下的统一判定规则。
- 补充每个业务域的“当前分类 + 当前正式宿主 + bridge 边界 + 页面影响面 + drain 优先级”矩阵。
- 明确“已有 Hono 路由但仍不算正式宿主”的统一判断标准。
- 明确 `dashboard`、`settings`、`rooms/buildings/meters`、`contracts/checkout`、`bills`、`renters`、`meter-readings/utility`、`governance` 的分域边界与排序输入。
- 保持本子任务只做冻结与解释，不实现 API 切流，不删除旧 `src/app/api/*`，不重写 query helper。

## Impact
- Affected specs: `phase14-api-query-parity-and-legacy-route-drain`、`phase13-frontend-page-parity-implementation`、`phase10-data-access-and-migration-closure`
- Affected code: `server/lib/legacy-route-inventory.ts`、`server/routes/domain.ts`、`server/routes/*.ts`、`src/app/api/**/route.ts`、`src/lib/page-closure-compat/*`、`docs/phase14_*`

## ADDED Requirements
### Requirement: Phase14 Route Inventory Host Matrix
系统 SHALL 为 `phase14-01` 提供单一的 route inventory host matrix，用于解释旧 Next API、Hono 子宿主、shared compat helper 与共享领域服务之间的当前职责关系。

#### Scenario: 统一分类解释
- **WHEN** 团队查看任一路由条目
- **THEN** 能从同一套矩阵中看到该路由的当前分类、正式宿主、bridge 边界、退出前提与回滚条件

#### Scenario: 分域 drain 输入可复用
- **WHEN** 后续 `phase14-02 ~ phase14-07` 子任务引用本结果
- **THEN** 不需要重新定义业务域分类、优先级或当前宿主身份

### Requirement: Domain Priority And Page Impact Binding
系统 SHALL 为每个 `phase14` 业务域补充分域 drain 优先级与页面影响面绑定，且该绑定直接继承 `phase13` 的页面 parity / 页面-API/query 交接结果。

#### Scenario: 页面影响面可追溯
- **WHEN** 团队评估 `dashboard`、`settings`、`rooms`、`contracts`、`bills`、`renters`、`meter-readings` 等域
- **THEN** 能明确看到对应 `src/minix` 页面、受影响 API/query 与后续 drain 顺序之间的关系

#### Scenario: 延后治理接口不被误判
- **WHEN** 团队检查 `/api/validation`、`/api/data-consistency`、健康辅助或 repair/status-check 等治理接口
- **THEN** 这些路径不会被误标记为“正式业务 API 已完成切流”

### Requirement: Formal Host Qualification Rule
系统 SHALL 明确“已有 Hono 路由但仍不算正式宿主”的统一判定规则，避免把 bridge 或 compat 误判为 `formal-host-owned`。

#### Scenario: Hono bridge 不被误判为正式宿主
- **WHEN** 某条旧路由已经有对应 `server/routes/*` 承接位
- **THEN** 只有当正式语义、调用方向、事务边界与退出前提都具备单一解释时，才能标记为 `formal-host-owned`

#### Scenario: Compat wrapper 保留边界可解释
- **WHEN** 某条旧路由仍承担 compat wrapper 或双入口 bridge
- **THEN** 矩阵会保留其 bridge host、保留原因、退出条件与回滚条件，而不会直接判定为已完成 drain

## MODIFIED Requirements
### Requirement: Legacy Route Inventory Governance
`server/lib/legacy-route-inventory.ts` 在 `phase14` 中不再只承担 `phase09-06` 的静态分类清单职责，而是继续作为 route inventory 真相源，并被补充解释为：
- 分域 drain 优先级输入
- 页面影响面绑定输入
- 正式宿主 / bridge 边界判断输入

#### Scenario: 旧分类清单被 phase14 继承
- **WHEN** 团队读取 `server/lib/legacy-route-inventory.ts`
- **THEN** 仍以原有 `formal-host-owned` / `compat-wrapper` / `retained-legacy` 为基础，但会得到 `phase14` 层的进一步排序与宿主解释

### Requirement: Phase13 Page To API Handoff Reuse
`phase13` 已冻结的页面 parity、浏览器验收基线与页面-API/query 交接 SHALL 作为 `phase14-01` 的直接上游输入，而不是被重新审计或改写。

#### Scenario: 页面迁移结论直接复用
- **WHEN** `phase14-01` 生成 host matrix
- **THEN** 直接继承 `phase13` 的页面影响结论，并把页面作为 route drain 优先级的输入

## REMOVED Requirements
### Requirement: None
**Reason**: 本子任务只新增 `phase14-01` 的冻结与解释要求，不移除既有阶段能力。
**Migration**: 无。
