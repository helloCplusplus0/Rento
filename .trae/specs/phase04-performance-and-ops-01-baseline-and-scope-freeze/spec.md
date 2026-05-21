# Phase04 基线与范围冻结 Spec

## Why

`phase04-performance-and-ops-*` 已被确定为当前默认工作流，但若不先冻结共享边界、页面分类原则与子任务顺序，后续很容易把性能优化、运维增强、辅助页治理和新功能扩写混成一次高复杂度改动。当前需要先把 `phase04` 的边界、允许路线和禁止路线写成后续 `/spec` 可直接继承的阶段真相源。

## What Changes

- 冻结 `phase04-performance-and-ops-*` 的阶段定位、允许路线、禁止路线和子任务顺序
- 冻结性能治理、轻量观测、dev-only 页面分层的共享判断标准
- 明确辅助页面的初始分类口径，区分 dev-only 候选入口与运维治理候选入口
- 同步顶层规范文档与 `phase04` 三份阶段文档的默认入口和当前下一步说明
- **BREAKING**：项目默认工作流从 `phase03-consistency-hardening-*` 切换为 `phase04-performance-and-ops-*`

## Impact

- Affected specs:
  - `phase04` 阶段定位
  - `phase04` 子任务顺序
  - 性能与运维治理共享边界
  - dev-only 页面分类与门禁原则
- Affected code:
  - `AGENTS.md`
  - `global_skills.md`
  - `project_rules.md`
  - `project_skills.md`
  - `plan.md`
  - `architecture_map.md`
  - `docs/phase04_performance_and_ops_architecture_plan.md`
  - `docs/phase04_performance_and_ops_dev_plan.md`
  - `docs/phase04_performance_and_ops_shared_baseline.md`

## ADDED Requirements

### Requirement: Phase04 共享边界冻结

系统 SHALL 在进入 `phase04` 首个实现子任务前，提供可直接引用的阶段共享边界文档，明确本阶段的目标、允许路线、禁止路线、默认顺序与判断标准。

#### Scenario: 冻结阶段边界

- **WHEN** 用户审核 `phase04` 阶段文档
- **THEN** 用户可以明确看到 `phase04` 的阶段目标、子任务顺序、共享判断标准与禁止路线
- **AND** 后续 `/spec` 不需要再次讨论本阶段是否允许混入重型运维平台、UI 重构或主链语义返工

### Requirement: 页面分类初始口径冻结

系统 SHALL 在 `phase04` 文档中显式声明辅助页面的初始分类口径，以便后续页面治理子任务可以直接继承。

#### Scenario: 明确候选入口归类

- **WHEN** 用户阅读 `phase04` 的共享基线与开发规划
- **THEN** 用户可以明确区分 `performance-*`、`layout-demo`、`components`、`business-flow-validation` 等页面属于 dev-only 或治理辅助候选入口
- **AND** 用户可以明确 `system-health`、`data-consistency` 更接近运维治理候选入口

## MODIFIED Requirements

### Requirement: 顶层默认工作流

项目的顶层规范文档 SHALL 将当前默认工作流、当前下一步和阶段重点从 `phase03-consistency-hardening-*` 同步切换到 `phase04-performance-and-ops-*`，并保持与阶段级文档口径一致。

#### Scenario: 顶层真相源与阶段文档一致

- **WHEN** 用户同时查看 `AGENTS.md`、`plan.md`、`architecture_map.md` 与 `phase04` 三份文档
- **THEN** 不会出现顶层文档仍指向 `phase03`、而阶段文档已切换到 `phase04` 的双重真相

## REMOVED Requirements

### Requirement: Phase03 仍为当前默认工作流

**Reason**: `phase03-consistency-hardening-*` 已完成当前阶段收口，继续将其保留为默认工作流会与 `phase04` 的阶段规划冲突。

**Migration**: 顶层文档统一将“当前默认工作流”“当前下一步”“当前阶段重点”切换为 `phase04-performance-and-ops-*`，`phase03` 仅保留为已完成阶段与上游前提。
