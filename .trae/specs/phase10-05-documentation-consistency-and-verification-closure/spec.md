# Phase10-05 文档一致性与验证收口 Spec

## Why
`phase10` 的四个子任务已经分别冻结了数据访问层方案、事务边界、查询分层和迁移兼容项，但顶层真相源、阶段文档互链、验证命令要求与 `phase11` 最小上游输入仍需要做最后一轮统一收口。若没有这一步，仓库会再次出现“阶段文档已完成，但顶层入口、验证口径和下一阶段 handoff 仍各说各话”的风险。

## What Changes
- 复核并按需同步 `AGENTS.md`、`plan.md`、`architecture_map.md`、`project_rules.md`
- 复核三份 `docs/phase10_*` 的互链、阶段状态与当前结论
- 冻结 `phase10` 后续实施前必须执行的验证命令要求
- 冻结供 `phase11` 直接继承的最小上游输入清单
- 明确本子任务只做文档与验证收口，不新增实现代码、不切换默认工作流到 `phase11`

## Impact
- Affected specs:
  - `phase10-data-access-and-migration-closure`
  - `phase10-05-documentation-consistency-and-verification-closure`
- Affected code:
  - `AGENTS.md`
  - `plan.md`
  - `architecture_map.md`
  - `project_rules.md`
  - `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
  - `docs/phase10_data_access_and_migration_closure_shared_baseline.md`
  - `docs/phase10_data_access_and_migration_closure_dev_plan.md`
  - `.trae/documents/phase10_data_access_and_migration_closure_plan.md`

## ADDED Requirements
### Requirement: 顶层真相源必须与 `phase10` 阶段文档保持一致
系统 SHALL 确保 `AGENTS.md`、`plan.md`、`architecture_map.md` 与 `project_rules.md` 对 `phase10` 的当前状态、下一步和边界描述与三份 `docs/phase10_*` 一致。

#### Scenario: 审核顶层入口状态
- **WHEN** 审核 `phase10-05` 的输出
- **THEN** 顶层真相源都明确 `phase10` 已完成当前轮阶段文档与 `/spec` 收口
- **AND** 不再残留“待启动”“仅完成部分子任务”或“下一步直接进入 `phase11`”的漂移表述

### Requirement: `phase10` 三份阶段文档必须形成单一互链闭环
系统 SHALL 确保 `architecture_plan`、`shared_baseline` 与 `dev_plan` 三份 `docs/phase10_*` 已齐备、互相引用正确，且其阶段状态与顶层真相源一致。

#### Scenario: 审核阶段文档互链
- **WHEN** 检查三份 `docs/phase10_*`
- **THEN** 能从任一文档跳转到另外两份文档
- **AND** 三份文档对 `phase10` 的当前结论、边界与下一步没有相互冲突的表述

### Requirement: 验证命令与验证脚本必须被冻结
系统 SHALL 为 `phase10` 收口冻结至少一组可复用的验证命令与验证脚本，作为后续阶段继续复核的最低门槛。

#### Scenario: 审核验证口径
- **WHEN** 审核 `phase10-05` 输出
- **THEN** 至少能看到以下验证要求被明确记录：
  - `npm run audit:phase09:legacy-routes`
  - `npm run lint`
  - `npm run type-check`
- **AND** 若本轮仅涉及文档，也至少完成文档互链与路径存在性复核

### Requirement: `phase11` 最小上游输入必须被明确冻结
系统 SHALL 为 `phase11` 冻结一份最小但足够的直接继承输入清单，避免部署切线阶段重新回头争论 `phase10` 已完成的架构判断。

#### Scenario: 审核 `phase11` handoff
- **WHEN** 审核 `phase10-05` 输出
- **THEN** 能看到 `phase11` 至少直接继承：
  - 长期数据访问层方案判断
  - 正式/兼容/治理查询分层与 canonical read path 判断
  - 统一事务边界与单一策略来源
  - 迁移兼容项、`db push` compat path 与 `migrate deploy` 正式目标的边界
  - 与 `phase09-06` route inventory 对齐后的退出/保留判断

## MODIFIED Requirements
### Requirement: `phase10` 的阶段收口状态
`phase10` 的阶段收口状态从“文档与 `/spec` 已分别产出”升级为“顶层真相源、阶段文档、验证命令和 `phase11` handoff 已形成单一稳定闭环”。

#### Scenario: 进入后续阶段前复核
- **WHEN** 后续阶段准备进入部署切线或最终总体验收
- **THEN** 不再需要重新确认 `phase10` 的主真相源、验证命令或最小 handoff 范围
- **AND** `phase10` 可作为稳定上游输入被直接继承

## REMOVED Requirements
### Requirement: 默认假设顶层真相源会自然跟上阶段文档进度
**Reason**: 之前多个阶段都出现过实现完成但顶层入口未同步的漂移风险，不能再依赖“默认自然一致”。
**Migration**: 改为在 `phase10-05` 中显式复核顶层真相源、阶段文档互链、验证命令与 `phase11` handoff，并把结果冻结为单一闭环。
