# Phase14 核心业务 API 迁移波次一 Spec

## Why
`phase14` 的本质任务是完成正式业务 API 迁移，而不是继续补冻结文档。当前 rooms / contracts / checkout / bills 主链仍存在旧 Next API 承担正式职责的情况，必须在 `phase14-05` 中完成第一波真实 cutover。

## What Changes
- 把 rooms / contracts / checkout / bills 的页面主消费路径切到统一 Hono 宿主。
- 把旧 `src/app/api/rooms*`、`src/app/api/contracts*`、`src/app/api/bills*` 中对应主链路径降级为 `compat-wrapper`、`rollback-only` 或明确退出候选。
- 同步更新 `server/lib/legacy-route-inventory.ts`，使分类结果反映真实迁移后的运行时真相。
- 补一组覆盖 `rooms -> contract -> checkout -> bill` 的主链验证路径。

## Impact
- Affected specs: `phase14` API/query parity、legacy route drain、主链 API cutover、route inventory 分类
- Affected code: `server/routes/rooms.ts`、`server/routes/contracts.ts`、`server/routes/checkout.ts`、`server/routes/bills.ts`、`src/app/api/rooms/**/route.ts`、`src/app/api/contracts/**/route.ts`、`src/app/api/bills/**/route.ts`、`server/lib/legacy-route-inventory.ts`

## ADDED Requirements
### Requirement: 核心业务主链 API 必须完成真实 cutover
系统 SHALL 在 `phase14-05` 中完成 rooms / contracts / checkout / bills 主链 API 的真实迁移，使页面主消费路径不再由旧 Next API 承担正式职责。

#### Scenario: Rooms 到合同主链统一切到 Hono
- **WHEN** `/rooms*`、`/add/contract`、`/contracts*`、`/bills*`、`/bills/stats` 相关页面或脚本触发主链 API 调用
- **THEN** 运行时正式宿主应统一落到 `server/routes/rooms.ts`、`server/routes/contracts.ts`、`server/routes/checkout.ts`、`server/routes/bills.ts`
- **AND** 旧 `src/app/api/*` 不再承担对应主链路径的正式业务职责

### Requirement: 旧 Next API 必须降级为兼容或回滚职责
系统 SHALL 在真实 cutover 完成后，把旧 `src/app/api/rooms*`、`src/app/api/contracts*`、`src/app/api/bills*` 中对应主链路径降级为兼容包装、回滚基线或明确退出候选，而不是继续维持双主宿主状态。

#### Scenario: 旧 rooms/contracts/bills 入口被降级
- **WHEN** 开发者审计旧 Next API 与 Hono 宿主职责
- **THEN** 能明确区分哪些路径已是 `compat-wrapper`
- **AND** 能明确区分哪些路径只保留 `rollback-only` 价值
- **AND** 不再出现“旧 Next 与 Hono 同时承担正式主职责”的描述

### Requirement: Route inventory 必须反映迁移后的真实分类
系统 SHALL 在 `phase14-05` 完成后同步更新 `server/lib/legacy-route-inventory.ts`，使 rooms / contracts / checkout / bills 的分类、保留原因、退出条件与回滚条件反映真实 cutover 结果。

#### Scenario: Inventory 与运行时真相一致
- **WHEN** 开发者检查 `server/lib/legacy-route-inventory.ts`
- **THEN** rooms / contracts / checkout / bills 的分类应与实际宿主一致
- **AND** 不再把已迁移的主链路径记为“仍由旧 Next 承担正式职责”

### Requirement: 主链业务约束必须在迁移后保持稳定
系统 SHALL 在本波次迁移中继续保持房间删除门禁、合同主锚点、退租结算、账单金额/状态/明细语义与历史保留规则不变。

#### Scenario: 迁移不放宽主链门禁
- **WHEN** 开发者执行 rooms / contracts / checkout / bills 主链迁移
- **THEN** `delete-guards`、合同生命周期、checkout 事务编排与账单语义必须保持与迁移前一致
- **AND** 不得因宿主切换放宽历史数据保留或主链阻断条件

### Requirement: 必须提供主链验证路径
系统 SHALL 为 `phase14-05` 提供至少一组覆盖 `rooms -> contract -> checkout -> bill` 的可执行验证路径，用于证明真实 cutover 已完成。

#### Scenario: 完成主链 smoke 或人工验证
- **WHEN** `phase14-05` 进入验收
- **THEN** 必须能提供一组覆盖 rooms、签约、退租结算与账单的验证记录
- **AND** 该验证能证明页面与脚本调用方向已统一切到 Hono 宿主

## MODIFIED Requirements
### Requirement: Phase14 阶段完成条件
`phase14` 的完成 SHALL 包含 `phase14-05` 对核心业务 API 的真实迁移结果，而不是只完成 rooms / contracts / checkout / bills 的解释性冻结。

## REMOVED Requirements
### Requirement: 以冻结结论替代核心业务 API 迁移
**Reason**: 这会让 `phase14` 再次退化成“阶段名是迁移，实际只交付文档”的状态。
**Migration**: 后续 `phase14-05 ~ phase14-07` 一律以代码切流、inventory 重分类、compat 降级与主链验证作为完成标准。
