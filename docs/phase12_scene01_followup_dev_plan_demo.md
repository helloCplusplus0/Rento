# AIFirstWorldModel Phase 12 Scene-01 后继验证开发规划

## 一、文档定位

本文档用于把 `phase12-scene01-followup-*` 拆分为可执行的子任务，确保项目下一步推进继续遵循：

- 单一样本
- 强门禁
- 强审计
- 低复杂度

本文档不替代：

- [phase12_scene01_followup_architecture_plan.md](file:///home/dell/Projects/AIFirstWorldModel/docs/phase12_scene01_followup_architecture_plan.md) 的架构定位职责
- [api_intake_standard.md](file:///home/dell/Projects/AIFirstWorldModel/api_intake_standard.md) 的长期 SOP 职责
- 具体 `.trae/specs/phase12-scene01-followup-*` 的任务细化与验收职责

## 二、总体推进结论

`phase12-scene01-followup-*` 的执行顺序固定为：

```text
先冻结样本与范围
    ->
再冻结 contract / gate / bridge readiness
    ->
再做单样本验证
    ->
最后做 acceptance 与路线判断
```

原因：

- 若不先冻结样本，就无法保证验证口径不会滑向新的批量扩容
- 若不先冻结 contract / gate / bridge readiness，就无法保证验证失败时能够精确归因
- 若不通过正式 acceptance 收口，就会再次出现“代码/样本跑过一次，但路线结论未接管”的问题

## 三、任务拆分建议

## phase12-scene01-followup-01-boundary-and-sample-freeze

### 目标

冻结本轮后继任务的唯一受控样本与范围边界。

### 范围

- 盘点当前 `scene-01` 后继候选
- 选择 `1` 个唯一受控样本
- 明确该样本为何需要进入 `sourceprep`
- 明确该样本的 Source Intake、handoff target、验收边界与非范围
- 形成 shared baseline 与首个 spec

### 不在范围内

- 不直接做新的实现扩写
- 不恢复 `scene-02 ~ 05`
- 不恢复观察面后继任务

### DoD

- 受控样本冻结为 `1` 个
- 进入 `sourceprep` 的理由可追溯
- 非范围明确包含：不恢复批量场景、不恢复 monitor 后继任务、不恢复常规扩源

## phase12-scene01-followup-02-contract-and-bridge-readiness

### 目标

冻结该样本在前半段 bridge 中所需的契约字段、handoff / gate 语义与最小审计字段。

### 范围

- 对齐 `API Capability Contract.processing`
- 对齐 `Canonical Source Envelope -> sourceprep -> Completion / Hydration -> Normalized Observation -> RawObservation`
- 明确 handoff / gate / route / write 所需的最小 bridge 字段
- 明确 viewer / monitor 若未来重排需要消费的最小输入

### 不在范围内

- 不直接重做 `sourceprep` 边界
- 不实现新的观察面工作流

### DoD

- 契约字段齐备并可执行
- handoff / gate 语义与下游消费方式一致
- bridge 最小字段清单冻结

## phase12-scene01-followup-03-single-sample-validation

### 目标

对该单一样本跑通新的最小闭环，形成正式运行证据。

### 范围

- 跑最小真实样本
- 跑 targeted tests
- 跑必要的全仓回归
- 验证数据库/读模型/审计查询
- 若样本需要 `sourceprep`，验证 `PreparedArtifact / PreparedArtifactHandoff / PreparedArtifactHandoffGate`

### 不在范围内

- 不把单一样本结论扩大为复杂来源整体恢复
- 不直接启动 `scene-02 ~ 05`

### DoD

- 单一样本闭环成立
- 阻塞点可被清晰归因
- 问题分级可收口为 `fix-now / defer / escalate-architecture`

## phase12-scene01-followup-04-acceptance-and-route-decision

### 目标

对 `phase12` 的单样本结果做正式 acceptance，并给出后续路线判断。

### 范围

- 形成独立复核记录
- 形成 acceptance 结论
- 明确是否允许进入 `scene-02 ~ 05` 的预备规划
- 明确观察面是否具备新 `phase*` 工作流的重排前提

### 不在范围内

- 不直接执行 `scene-02 ~ 05`
- 不直接启动新的观察面实现

### DoD

- 独立复核记录已形成
- acceptance 文档已形成
- 对 `scene-02 ~ 05` 与观察面后继路线有显式结论

## 四、推荐实施顺序

建议严格按如下顺序推进：

```text
phase12-scene01-followup-01-boundary-and-sample-freeze
phase12-scene01-followup-02-contract-and-bridge-readiness
phase12-scene01-followup-03-single-sample-validation
phase12-scene01-followup-04-acceptance-and-route-decision
```

## 五、默认路线约束

`phase12-scene01-followup-*` 全部子任务都必须遵守：

- 默认只做 `scene-01`
- 默认只做 `1` 个样本
- 不得把 `scene-02 ~ 05` 变成隐性并行范围
- 不得把 `post-phase8-monitor-01` 重新当作默认下一步
- 不得把 `api_intake_standard.md` 写成“当前已恢复默认执行入口”

## 六、结语

`phase12` 的价值不在于“多做一个场景”，而在于：

```text
把 `phase10-05` 已经给出的“可以继续判断 scene-01 后继任务”
落实为一轮正式、受控、可审计的新验证链，
然后再决定项目是否有资格进入更后面的场景或观察面重排。
```