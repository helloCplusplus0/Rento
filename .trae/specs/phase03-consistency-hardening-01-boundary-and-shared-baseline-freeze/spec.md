# Phase03 Boundary And Shared Baseline Freeze Spec

## Why

`phase03-consistency-hardening-*` 已进入阶段冻结期，但当前阶段文档和全局规范仍可进一步吸收“真实租务流程优先、事实表达优先于最简关系”的判断标准。需要先把这些边界正式冻结为 spec，避免后续 `/spec` 和实现阶段重新滑回理想化 CRUD 设计。

## What Changes

- 调整 `docs/phase03_consistency_hardening_architecture_plan.md`，把“真实经营流程优先”的理由与行为边界写得更明确
- 调整 `docs/phase03_consistency_hardening_dev_plan.md`，把子任务 01 的目标与范围扩展为吸收上述判断标准和文档补强
- 调整 `docs/phase03_consistency_hardening_shared_baseline.md`，把“业务真实、状态可解释、历史可追溯、实现低复杂度”固化为共享基线
- 调整 `AGENTS.md`，补入适用于租务系统的高层判断标准，作为后续阶段的全局评审尺度

## Impact

- Affected specs:
  - `phase03-consistency-hardening-*`
  - 阶段共享基线
  - 全局设计判断标准
- Affected code:
  - `docs/phase03_consistency_hardening_architecture_plan.md`
  - `docs/phase03_consistency_hardening_dev_plan.md`
  - `docs/phase03_consistency_hardening_shared_baseline.md`
  - `AGENTS.md`

## ADDED Requirements

### Requirement: 真实租务流程优先的阶段边界

系统 SHALL 在 `phase03-consistency-hardening-*` 的阶段文档中明确：行为边界必须以真实租务经营流程为先，而不是以最简化数据关系或理想化 CRUD 操作为先。

#### Scenario: 冻结房间、合同、仪表、账单边界

- **WHEN** 阶段文档定义删除与状态流转的边界
- **THEN** 文档必须说明这些实体是经营事实链的一部分，而不是孤立对象
- **AND** 文档必须强调状态切换会牵连多个实体，不能只按单表删除或单字段修改理解

### Requirement: 阶段共享基线吸收四项判断标准

系统 SHALL 在 `phase03` 共享基线和全局规范中固定以下判断优先级：

- 业务上真实
- 状态上可解释
- 历史上可追溯
- 实现上低复杂度

#### Scenario: 评审后续 `/spec` 与实现

- **WHEN** 后续子任务进入 `/spec` 或实现
- **THEN** 必须以这四项判断标准作为默认评审尺度
- **AND** 不得为了表面简洁牺牲真实经营流程与历史追溯

### Requirement: 全局规范补入事实表达优先原则

系统 SHALL 在 `AGENTS.md` 中补充适用于租务系统的高层设计判断标准：正确设计应优先追求最接近真实经营流程、且长期可维护的事实表达，而不是最简化的数据关系。

#### Scenario: 全局规范指导阶段设计

- **WHEN** 后续阶段文档或实现与全局规范发生解释冲突
- **THEN** 应优先遵循“真实业务、可解释状态、可追溯历史、低复杂度实现”的判断标准

## MODIFIED Requirements

### Requirement: Phase03 子任务 01 的职责

`phase03-consistency-hardening-01-boundary-and-shared-baseline-freeze` 不仅负责同步阶段快照与共享基线，还必须吸收对真实租务联动边界的讨论结果，并将其固化进阶段文档与全局规范。

#### Scenario: 扩展子任务 01 范围

- **WHEN** 执行子任务 01
- **THEN** 允许同步调整 `architecture_plan`、`dev_plan`、`shared_baseline` 与 `AGENTS.md`
- **AND** 调整范围仅限边界冻结、判断标准补强与后续 `/spec` 的上游对齐
- **AND** 不得在此子任务中直接进入服务端代码实现
