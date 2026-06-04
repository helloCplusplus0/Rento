# 内嵌规划材料收口 Spec

## Why
当前仓库已经完成根级真相源切换，但仓库内仍保留一套历史上为未来新仓规划而创建的 `Rento-miniX/` 内嵌目录。若不继续冻结它的角色、抽取边界与退出条件，后续原地重构会在根级真相源之外继续形成第二套规划入口，放大双重真相源风险。

## What Changes
- 盘点 `Rento-miniX/` 目录下的顶层治理文档、方案说明文档与 `phase01` 文档
- 冻结该目录当前只作为“前置规划输入材料”的角色，不再作为长期独立主线
- 明确哪些内容需要被根级真相源吸收，哪些内容只保留为临时参考材料
- 明确后续目录治理顺序必须遵守“抽取 -> 复核 -> 清理”
- 明确何时允许删除该目录，以及删除前必须满足的前置条件
- 不直接删除目录，不创建归档目录，不进入任何业务实现改动

## Impact
- Affected specs: 文档治理、单一真相源、`phase06-minix-replatform` 阶段顺序、原地重构边界
- Affected code: `Rento-miniX/README.md`、`Rento-miniX/AGENTS.md`、`Rento-miniX/project_rules.md`、`Rento-miniX/architecture_map.md`、`Rento-miniX/global_skills.md`、`Rento-miniX/project_skills.md`、`Rento-miniX/plan.md`、`Rento-miniX/docs/rento_minix_solution_overview.md`、`Rento-miniX/docs/rento_to_minix_transition_workflow.md`、`Rento-miniX/docs/phase01_*`、`architecture_map.md`、`docs/phase06_minix_replatform_shared_baseline.md`

## ADDED Requirements
### Requirement: 内嵌目录角色冻结
系统 SHALL 将仓库内 `Rento-miniX/` 目录统一定义为前置规划输入材料，而不是当前仓库下长期并存的第二套正式主线。

#### Scenario: 用户查看目录治理说明
- **WHEN** 用户阅读 `architecture_map.md`、`docs/phase06_minix_replatform_shared_baseline.md` 或本 spec
- **THEN** 文档应明确 `Rento-miniX/` 目录只允许被盘点、抽取与引用
- **AND** 文档应明确该目录不得继续争夺根级真相源
- **AND** 文档不得把该目录描述为未来需要长期保留的正式实现主线

### Requirement: 规划材料分类口径
系统 SHALL 为 `Rento-miniX/` 目录中的材料提供明确分类，区分“应吸收到根级真相源的有效内容”与“只保留为临时输入材料的历史规划内容”。

#### Scenario: 盘点内嵌目录材料
- **WHEN** 用户盘点 `Rento-miniX/` 顶层治理文档、方案说明文档与 `phase01` 文档
- **THEN** 用户应能识别哪些内容已经被根级 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`global_skills.md`、`project_skills.md`、`plan.md` 与 `docs/phase06_*` 吸收
- **AND** 用户应能识别哪些文件只保留为临时输入材料，不再作为后续阶段直接真相源

### Requirement: 清理顺序门禁
系统 SHALL 将内嵌目录治理顺序冻结为“先抽取有效内容 -> 再完成根级文档吸收 -> 再复核是否仍有引用 -> 最后再清理目录”。

#### Scenario: 评估是否允许删除目录
- **WHEN** 用户准备删除 `Rento-miniX/` 内嵌目录
- **THEN** 必须先确认有效内容已被根级真相源吸收
- **AND** 必须先确认仓库内已不存在对该目录的有效引用或依赖
- **AND** 只有在前置条件全部满足后，目录才允许进入实际清理步骤

### Requirement: 删除前置条件可解释
系统 SHALL 让用户能够清楚理解该目录何时允许删除，以及在删除前仍承担什么参考职责。

#### Scenario: 用户判断目录是否还能保留
- **WHEN** 用户审视 `Rento-miniX/` 当前是否仍需存在
- **THEN** 文档应说明该目录在有效内容未完全吸收前仍承担临时输入材料职责
- **AND** 文档应说明一旦抽取、吸收与引用复核完成，该目录就不再具备长期保留必要性

## MODIFIED Requirements
### Requirement: `phase06` 的默认推进顺序
`phase06-minix-replatform` 的默认推进顺序修改为：先完成根级真相源切换，再冻结内嵌 `Rento-miniX/` 目录的处理策略，再收口 Git / 仓库 / 文档状态，最后冻结首个正式实现阶段。

#### Scenario: 用户查看阶段顺序
- **WHEN** 用户阅读 `docs/phase06_minix_replatform_dev_plan.md`
- **THEN** 用户应能看到“内嵌规划材料收口”位于“仓库与 remote 就绪”之前
- **AND** 用户应能理解这是为了先消除双重真相源风险，再进入仓库状态收口

## REMOVED Requirements
### Requirement: 内嵌 `Rento-miniX/` 目录可长期作为并行规划主线
**Reason**: 当前仓库已经切换为 `Rento-miniX` 原地重构主线，继续让内嵌目录长期并行为第二套规划主线会破坏单仓库、单主线、单一真相源原则。
**Migration**: 将该目录降级为临时输入材料；完成“抽取 -> 复核 -> 清理”后，再执行目录层面的正式清理。
