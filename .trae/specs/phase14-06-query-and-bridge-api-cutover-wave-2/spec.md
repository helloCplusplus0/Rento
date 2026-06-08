# Phase14 Query 与 Bridge API 迁移波次二 Spec

## Why
`phase14-05` 已完成核心业务主链 API cutover，但 dashboard、settings、renters、meter-readings、utility 与残余 bridge/compat helper 仍保留页面级 legacy query host 或 shared compat helper 主真相职责。`phase14-06` 需要把这些剩余 query/bridge 路径真实迁出，避免把正式 API/query 迁移债务留到后续无承接位的阶段。

## What Changes
- 把 dashboard、settings、renters、meter-readings、utility 的页面主消费路径迁到统一 Hono 宿主或最终明确的 compat 宿主。
- 把 `src/lib/page-closure-compat/*` 从上述域的默认主查询来源降级为过渡/回滚职责。
- 同步更新 `server/lib/legacy-route-inventory.ts`，使 query host、bridge helper 与 compat/rollback 边界反映真实运行时真相。
- 补一组覆盖首页、设置、租客、抄表的验证路径，证明页面表现与 API/query 调用方向一致。

## Impact
- Affected specs: `phase14` API/query parity、legacy route drain、query host cutover、bridge helper 降级、route inventory 分类
- Affected code: `server/routes/dashboard.ts`、`server/routes/settings.ts`、`server/routes/renters.ts`、`server/routes/meter-readings.ts`、`src/app/api/dashboard/**/route.ts`、`src/app/api/settings/**/route.ts`、`src/app/api/renters/**/route.ts`、`src/app/api/meter-readings/**/route.ts`、`src/app/api/utility-readings/route.ts`、`src/lib/page-closure-compat/*`、`src/lib/dashboard-queries.ts`、`src/lib/global-settings.ts`、`server/lib/legacy-route-inventory.ts`

## ADDED Requirements
### Requirement: Query 与 Bridge 主路径必须完成真实 cutover
系统 SHALL 在 `phase14-06` 中完成 dashboard、settings、renters、meter-readings、utility 与残余 bridge/compat 路径的真实迁移，使页面主消费路径不再依赖 retained-legacy query host 或 shared compat helper 作为主真相。

#### Scenario: 首页到抄表页的主查询来源统一切换
- **WHEN** 首页、设置页、租客页、抄表页与 utility 相关页面或脚本触发 API/query 调用
- **THEN** 正式查询/写入宿主应统一落到 `server/routes/dashboard.ts`、`server/routes/settings.ts`、`server/routes/renters.ts`、`server/routes/meter-readings.ts` 或明确冻结的最终 compat 宿主
- **AND** 旧 `src/app/api/*` 与 `src/lib/page-closure-compat/*` 不再承担这些路径的默认主查询职责

### Requirement: Bridge Helper 必须降级为过渡或回滚职责
系统 SHALL 在 `phase14-06` 完成后，把 `src/lib/page-closure-compat/dashboard.ts`、`renters.ts`、`meter-readings.ts` 中对应域的 shared helper 降级为过渡、回滚或明确延后边界，而不是继续维持页面默认主真相职责。

#### Scenario: Shared Compat Helper 不再是默认主查询来源
- **WHEN** 开发者审计 dashboard、renters、meter-readings 的页面数据来源
- **THEN** 能明确区分哪些 helper 仍仅保留 compat/rollback 价值
- **AND** 不再出现“页面已迁移但默认查询仍走 shared compat helper”的事实

### Requirement: 新旧路线切换原则必须以旧 Rento 业务逻辑为原型
系统 SHALL 在 `phase14-06` 的 query/bridge cutover 中遵循以下原则：若新旧路线可完美切换，则业务逻辑必须 `100%` 高保真还原旧 `Rento`；若运行路线无法完美切换，则必须以旧 `Rento` 源代码设计的业务逻辑为原型，对新路线做最小且可验证的适配。

#### Scenario: 运行路线不能直接等价复用旧实现
- **WHEN** dashboard、settings、renters、meter-readings、utility 的 query host 或缓存/鲜度策略无法直接沿用旧 Next 路线
- **THEN** 迁移实现必须保留旧 `Rento` 的业务目标、查询语义、状态反馈与历史追溯约束
- **AND** 仅允许对宿主协议、运行时鲜度策略或 compat 边界做最小技术适配
- **AND** 不得借“新路线不同”之名弱化治理型设置、历史抄表、关联账单追溯或租客主链语义

### Requirement: Route Inventory 必须反映 wave-2 迁移后的真实分类
系统 SHALL 在 `phase14-06` 完成后同步更新 `server/lib/legacy-route-inventory.ts`，使 dashboard、settings、renters、meter-readings、utility 的分类、保留原因、退出条件与回滚条件反映真实 cutover 结果。

#### Scenario: Inventory 与 wave-2 运行时真相一致
- **WHEN** 开发者检查 `server/lib/legacy-route-inventory.ts`
- **THEN** dashboard、settings、renters、meter-readings、utility 的分类应与实际宿主一致
- **AND** 不再把已迁移的 query/bridge 主路径记为“仍由旧 Next 承担正式职责”

### Requirement: 必须提供首页到抄表的验证路径
系统 SHALL 为 `phase14-06` 提供至少一组覆盖首页、设置、租客、抄表与 utility 尾项的可执行验证路径，用于证明 query/bridge cutover 已完成且页面表现未被破坏。

#### Scenario: 完成首页/设置/租客/抄表验证
- **WHEN** `phase14-06` 进入验收
- **THEN** 必须能提供一组覆盖首页、设置、租客、历史抄表与 utility 兼容尾项的 smoke 或人工验证记录
- **AND** 该验证能证明页面/API/query 调用方向与页面表现一致
- **AND** 该验证能证明历史抄表、关联账单追溯与治理型设置语义未被破坏

## MODIFIED Requirements
### Requirement: Phase14 阶段完成条件
`phase14` 的完成 SHALL 包含 `phase14-06` 对 dashboard、settings、renters、meter-readings、utility 与残余 bridge/compat query host 的真实迁移结果，而不是只完成这些域的解释性冻结或 helper 归类。

## REMOVED Requirements
### Requirement: Shared Compat Helper 可长期承担页面默认主查询来源
**Reason**: 这会让 `phase14` 继续停留在“页面已迁移、默认 query 仍在 legacy/bridge 层”的不完整状态。
**Migration**: `phase14-06` 后，上述 helper 仅允许保留为过渡、回滚或治理型延后边界；正式页面主查询必须切到统一 Hono 宿主或明确冻结的最终 compat 宿主。
