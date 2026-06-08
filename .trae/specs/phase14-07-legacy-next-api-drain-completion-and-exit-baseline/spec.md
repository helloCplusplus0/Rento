# Phase14 Legacy Next API Drain 完成与退出基线 Spec

## Why
`phase14-01 ~ phase14-06` 已分波次完成 route inventory 重分层、核心业务 API cutover 与 query/bridge host 收口，但 `phase14` 仍缺少一次统一的完成性证明：旧 `src/app/api/*` 是否已不再承担正式业务主职责，顶层真相源是否已同步到“迁移完成而非仅冻结”的状态。`phase14-07` 负责收口这一阶段性证明，并为 `phase15/16` 固化 rollback-only 与最终退出基线。

## What Changes
- 统一审计 `src/app/api/**/route.ts` 与 `server/lib/legacy-route-inventory.ts`，清空仍承担正式业务主职责的 retained-legacy API。
- 更新 `docs/phase14_*`、`plan.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md` 及必要时 `README.md`，明确 `phase14` 已完成 API 层真实迁移。
- 为每个仍保留的旧 Next API 补齐单一保留原因、退出条件与回滚条件，冻结 `phase16` 前的 rollback baseline。
- 补一轮覆盖 dashboard / rooms / contracts / checkout / bills / renters / meter-readings 的 inventory 审计与主链 smoke，证明未把 API 主链迁移债务留给 `phase15/16`。

## Impact
- Affected specs: `phase14` API migration completion、legacy route inventory truth source、rollback baseline、phase15/16 输入边界
- Affected code: `src/app/api/**/route.ts`、`server/lib/legacy-route-inventory.ts`、`docs/phase14_*`、`plan.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、必要时 `README.md`

## ADDED Requirements
### Requirement: Phase14 必须明确完成正式业务 API 迁移
系统 SHALL 在 `phase14-07` 中统一证明 `phase14` 范围内的正式业务 API 已完成迁移或降级为 compat/rollback-only，不再把任何业务主链 API 迁移债务留给 `phase15` 或 `phase16`。

#### Scenario: 审计 phase14 范围内所有正式业务 API
- **WHEN** 开发者审计 `src/app/api/**/route.ts` 与 `server/lib/legacy-route-inventory.ts`
- **THEN** 除 governance、明确保留 compat、rollback-only 之外，不再存在仍承担正式业务主职责的 retained-legacy API
- **AND** 所有 dashboard、rooms、contracts、checkout、bills、renters、meter-readings 主链 API 都能映射到当前真实 formal host

### Requirement: Legacy Next API 保留必须具备单一解释
系统 SHALL 为每个仍保留的旧 Next API 明确保留原因、退出条件与回滚条件，使 `phase16` 前的 legacy 保留成为显式 rollback baseline，而不是隐式继续承载正式流量。

#### Scenario: 检查仍保留的旧 Next API
- **WHEN** 开发者检查仍在仓库中的 `src/app/api/**/route.ts`
- **THEN** 每条保留路由都能在 inventory 与文档中找到单一可解释的保留原因
- **AND** 每条保留路由都具备退出条件与回滚条件
- **AND** 不出现“为了安全起见先留着”但没有 formal host / rollback 解释的模糊状态

### Requirement: 顶层真相源必须写清 phase14 完成态
系统 SHALL 在 `phase14-07` 完成后更新 `docs/phase14_*`、`plan.md` 与顶层规则文档，明确 `phase14` 的完成标准是“旧 Next API 不再承担正式业务主职责”，而不是“文件删空”或“仅完成冻结解释”。

#### Scenario: 审计顶层文档与 phase14 状态
- **WHEN** 开发者查看 `docs/phase14_*`、`plan.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`
- **THEN** 能明确看到 `phase14` 已完成 API 层迁移
- **AND** 能明确区分 `phase14` 的迁移完成职责与 `phase16` 的最终退出审核职责

### Requirement: Phase15 与 Phase16 不再承担正式业务 API 迁移职责
系统 SHALL 在 `phase14-07` 完成后把 `phase15` 与 `phase16` 的输入边界明确为“继承 API 迁移结果、PWA parity/cutover 输入”，而不是继续承担正式业务 API 迁移本身。

#### Scenario: 检查后续阶段边界
- **WHEN** 开发者审阅 `phase14` 完成说明与后续阶段文档
- **THEN** `phase15/16` 只继承已完成的 API 迁移结果
- **AND** 不再出现任何正式业务 API 迁移任务被顺延到 `phase15` 或 `phase16`

### Requirement: 必须完成一轮跨域 inventory 审计与主链 smoke
系统 SHALL 为 `phase14-07` 提供至少一轮覆盖 dashboard、rooms、contracts、checkout、bills、renters、meter-readings 的 route inventory 审计与主链 smoke，用于证明 `phase14` API 层迁移闭环已经完成。

#### Scenario: 完成 phase14 收口验证
- **WHEN** `phase14-07` 进入验收
- **THEN** 必须存在覆盖上述域的 inventory 审计结果与主链 smoke
- **AND** 验证结果能证明当前 formal host、compat 保留条件、rollback baseline 与顶层文档一致

## MODIFIED Requirements
### Requirement: Phase14 阶段完成标准
`phase14` 的完成 SHALL 被定义为“正式业务 API 已完成真实迁移，旧 Next API 仅保留显式 compat/rollback-only 职责”，而不是“legacy 文件被删除”或“只完成分类冻结”。

## REMOVED Requirements
### Requirement: 后续阶段可以继续承接正式业务 API 主链迁移
**Reason**: 这会掩盖 `phase14` 是否真正完成 API 层迁移闭环，使 `phase15/16` 持续背负本阶段应完成的业务主链债务。
**Migration**: `phase14-07` 完成后，任何正式业务 API 迁移遗漏都必须在本阶段收口；`phase15/16` 只接收已完成迁移的结果、rollback baseline 与 cutover 输入。
