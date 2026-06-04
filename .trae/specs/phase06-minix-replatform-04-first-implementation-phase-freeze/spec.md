# 首个正式实现阶段冻结 Spec

## Why
`phase06-minix-replatform` 已经完成根级真相源切换、内嵌规划材料收口与仓库/remote 状态收口，但后续正式实现仍缺少一个被明确命名、具备边界和承接关系的首个实施阶段。若不先冻结这个入口，后续重构容易回到“想到哪改到哪”的高风险推进方式。

## What Changes
- 明确 `phase06` 之后的首个正式实现阶段名称与核心目标
- 明确该阶段与 `phase06` 的承接关系，以及为什么它应成为第一个实施阶段
- 冻结首个阶段的目标、边界、非目标与粗粒度工作顺序
- 明确该阶段只具备 `/plan` 入口条件，不直接展开全部 `/spec`
- 不直接进入实现，不一次性写死所有后续阶段细节

## Impact
- Affected specs: 阶段规划、实施顺序、原地重构边界、正式实现入口治理
- Affected code: `plan.md`、`docs/phase06_minix_replatform_architecture_plan.md`、`docs/phase06_minix_replatform_dev_plan.md`、`docs/phase06_minix_replatform_shared_baseline.md`、必要时 `README.md` 或 `architecture_map.md`

## ADDED Requirements
### Requirement: 首个正式实现阶段命名冻结
系统 SHALL 为 `phase06` 之后的首个正式实现阶段提供明确名称与目标，使用户在 `phase06` 审核通过后能直接知道下一步进入哪个阶段。

#### Scenario: 用户查看后续阶段入口
- **WHEN** 用户阅读 `plan.md`、`docs/phase06_*` 或本 spec
- **THEN** 用户应能看到首个正式实现阶段的明确名称
- **AND** 用户应能理解该阶段要解决的核心问题
- **AND** 用户不需要再从多个候选方向中重新猜测下一步顺序

### Requirement: 首阶段边界冻结
系统 SHALL 明确首个正式实现阶段的目标、边界与非目标，避免在第一个实施阶段同时混入过多高风险变量。

#### Scenario: 用户评估阶段范围
- **WHEN** 用户查看首个正式实现阶段定义
- **THEN** 用户应能知道该阶段要做什么
- **AND** 用户应能知道该阶段明确不做什么
- **AND** 用户应能判断该阶段不会一次性绑定 UI 重做、领域重写、部署切换和所有数据访问层决策

### Requirement: 粗粒度顺序冻结
系统 SHALL 为首个正式实现阶段提供粗粒度候选顺序，用于指导后续 `/plan` 与 `/spec` 拆分，而不是直接写死全部实现细节。

#### Scenario: 用户查看后续拆分方向
- **WHEN** 用户阅读阶段规划文档
- **THEN** 用户应能看到诸如前端应用壳/路由承接、API 与认证骨架承接、领域逻辑迁移、数据访问层收口、部署主线切换等顺序候选
- **AND** 用户应能理解这些只是粗粒度顺序，不等同于当前回合已冻结全部实现细节

### Requirement: `/plan` 入口条件可执行
系统 SHALL 让首个正式实现阶段达到 `/plan` 入口条件，使后续可以基于该阶段继续进入更细的阶段文档，而不是直接跳入实现。

#### Scenario: 用户准备进入下一阶段
- **WHEN** 用户完成 `phase06` 审核并准备推进下一步
- **THEN** 用户应能基于已冻结的阶段名称、目标、边界与非目标直接进入该阶段 `/plan`
- **AND** 用户不需要在实现开始前再次临时补定义首阶段职责

## MODIFIED Requirements
### Requirement: `phase06` 的完成条件
`phase06-minix-replatform` 的完成条件修改为：除完成根级真相源、内嵌目录治理与仓库/remote 收口外，还必须明确首个正式实现阶段的入口定义。

#### Scenario: 用户判断 `phase06` 是否足以收口
- **WHEN** 用户评估 `phase06` 的子任务闭环
- **THEN** 用户应能确认 `phase06` 已不仅冻结“当前不要做什么”
- **AND** 用户应能确认 `phase06` 同时给出了审核通过后的下一阶段入口

## REMOVED Requirements
### Requirement: `phase06` 审核通过后再临时决定首个实现阶段
**Reason**: 若把首个正式实现阶段留到审核后再临时判断，会导致阶段衔接重新回到口头讨论和隐性决策，削弱 `phase06` 作为上游冻结阶段的价值。
**Migration**: 在 `phase06-minix-replatform-04-first-implementation-phase-freeze` 中先冻结首个正式实现阶段名称、目标、边界与 `/plan` 入口条件，再进入后续阶段规划。
