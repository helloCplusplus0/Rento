# AIFirstWorldModel Phase 12 Scene-01 后继验证架构规划

## 一、文档定位

本文档用于承接 `phase10-sourceprep-realignment-*` 与 `phase11-intake-standard-01-sourceprep-sop-sync` 已完成后的下一阶段工作流，回答以下问题：

- 为什么下一步不应直接恢复 `scene-02 ~ 05`
- 为什么下一步不应直接恢复 `post-phase8-monitor-01`
- 为什么当前最合适的新工作流是 `phase12-scene01-followup-*`
- `phase12-scene01-followup-*` 应冻结哪些边界、验证哪些链路、输出哪些正式结论

本文档不替代：

- [api_intake_standard.md](file:///home/dell/Projects/AIFirstWorldModel/api_intake_standard.md) 的长期常规引入 SOP 职责
- [phase10_sourceprep_realignment_architecture_plan.md](file:///home/dell/Projects/AIFirstWorldModel/docs/phase10_sourceprep_realignment_architecture_plan.md) 对 `sourceprep` 与 Core 边界整改的说明职责
- 具体 `.trae/specs/phase12-scene01-followup-*` 对单个子任务范围、回归要求与验收方式的承载职责

## 二、当前阶段结论

### 2.1 已完成前提

当前已完成并可直接复用的正式前提包括：

- `phase9-sourceprep-01 ~ 05`
- `post-phase8-scene-01-major-change-text-expansion`
- `post-phase8-scene-01-reentry-rerun`
- `phase10-sourceprep-realignment-*`
- `phase11-intake-standard-01-sourceprep-sop-sync`

### 2.2 当前已知路线结论

基于 `phase10-05 acceptance` 与 `phase11` 文档同步结果，当前正式路线结论收口为：

- `scene-01`：允许继续判断，但尚未形成新的单样本后继验证结论
- `scene-02 ~ 05`：继续保持 `not-yet`
- 观察面后继路线：`replan-under-new-phase`
- `api_intake_standard.md`：已完成长期规则同步，但尚未重新激活为当前默认执行入口

### 2.3 为什么不能直接恢复 `scene-02 ~ 05`

原因如下：

- `phase10-05` 证明的是 `sourceprep -> handoff -> rerun consumer -> coreverify` 的最小闭环已成立，不是复杂来源全面恢复前提已经齐备
- 当前缺少对 `scene-01` 后继任务“最小范围、样本选择、契约齐备性、bridge 审计字段”的新一轮冻结
- 若跳过这一步，`scene-02 ~ 05` 仍会建立在“边界已收口，但后续验证口径未重建”的不稳定前提上

### 2.4 为什么不能直接恢复 `post-phase8-monitor-01`

原因如下：

- `phase10-05 acceptance` 已明确观察面路线应 `replan-under-new-phase`
- 当前观察面应消费的是新的 `sourceprep` handoff / gate / front-half bridge 语义，而不是旧的 `post-phase8-monitor-01` 假设
- 若不先验证 `scene-01` 后继任务所需的最小 bridge 字段，就没有足够依据判断新观察面应该承接什么表达职责

## 三、工作流定位

### 3.1 新增 `phase12-scene01-followup-*`

当前最合适的新工作流是：

```text
phase12-scene01-followup-*
```

它的职责不是恢复批量复杂来源扩容，而是：

- 选定 1 个 `scene-01` 后继单样本
- 冻结该样本的 Source Intake、`sourceprep` 进入条件与 handoff target
- 验证该样本的 contract / gate / front-half bridge / route / audit 最小口径
- 基于新的正式 acceptance 再判断是否具备进入后续场景或观察面重排的前提

### 3.2 核心原则

`phase12-scene01-followup-*` 必须坚持：

- 单一样本优先
- 强门禁优先
- 强审计优先
- 低复杂度优先
- 继续保持 `sourceprep` 与 Core 的既有边界，不得再次回灌

## 四、架构边界

### 4.1 本阶段允许复用的稳定前提

本阶段允许直接复用以下稳定结论：

- `sourceprep` 是 Core 之前的独立前置子系统
- 稳定输出契约为 `PreparedArtifact / PreparedArtifactHandoff / PreparedArtifactHandoffGate`
- `scene rerun orchestration` 与 `coreverify` 不属于 `sourceprep` 本体职责
- 长期 SOP 由 `api_intake_standard.md` 承载，但其“恢复默认入口”状态仍需新阶段结论支撑

### 4.2 本阶段要验证的新问题

本阶段需要新增验证的是：

- 哪个 `scene-01` 后继样本最适合作为唯一受控验证对象
- 该样本的 `API Capability Contract.processing` 字段是否已足够支撑前半段 bridge
- 该样本所需的 handoff / gate / route / write 审计字段是否已足以支持新的 acceptance
- 该样本验证通过后，是否真的足以支持进入 `scene-02 ~ 05` 预备规划或观察面重排

### 4.3 本阶段明确不做

- 不恢复 `scene-02 ~ 05`
- 不恢复 `post-phase8-monitor-01`
- 不宣布常规小批次引入已恢复
- 不重做 `sourceprep` 与 Core 的边界整改
- 不新增开放式爬取、开放式 ETL 或无边界调试台

## 五、推荐输出

`phase12-scene01-followup-*` 最终至少应产出：

- `scene-01` 后继单样本的正式范围冻结结论
- 该样本的 contract / gate / bridge readiness 结论
- 最小真实样本 + targeted tests + 必要回归的证据链
- 一份新的 acceptance 文档，用于决定：
  - 是否允许进入 `scene-02 ~ 05` 的预备规划
  - 是否允许启动新的观察面 `phase*` 工作流

## 六、结论

当前最科学、最稳妥的下一阶段推进方向，不是继续停留在 `phase10-*` 余波上，也不是直接恢复后续场景，而是：

```text
先用 `phase12-scene01-followup-*`
冻结并验证 `scene-01` 后继任务的最小范围，
再用新的正式 acceptance 决定后续路线。
```

这既符合 `phase10-05 acceptance` 的显式路线结论，也符合项目“先闭环再扩展”的总原则。