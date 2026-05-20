# Phase17 完结后的下一步推进计划

## Summary

`phase17-scene02-peer-position-capability-closure-*` 已在 spec、实现、验证、acceptance 与独立复核层面全部收口完成。

当前最合理、最稳妥的下一步，不是继续停留在 `phase17` 收口层，也不是直接恢复 `scene-03 ~ 05`、观察面路线或常规小批次引入，而是：

```text
先同步全局真相源
    ->
新增 `phase18-scene02-peer-position-implementation-entry-*`
    ->
先补 phase18 的 architecture / dev / shared_baseline
    ->
进入 `phase18-01` 的 /spec
    -> 
直接进入一个更偏实现打包的 phase18，而不是再复制一轮 4 子任务微收口
```

本计划的核心判断是：

- `phase17` 已把 `scene-02` 的最小能力输出、query / audit 承接位、peer / industry scope explanation、capability validation 与 acceptance 边界全部收口为新的 scene 级真相源
- 顶层真相源仍滞后在“当前默认入口是 `phase17`”的状态，必须先同步
- `scene-02` 的真实剩余缺口，已不再是 capability closure 是否成立，而是如何把已成立的 closure 落为正式的后继实现入口
- 该后继实现入口最自然的承接位，是现有 `internal/query` / `internal/viewer` 服务边界上的场景级查询落点，而不是重新打开 engine 主链、观察面重排或多 scene 并行恢复
- 因此，`phase18` 的正确改进方向不是“扩大到更多 scene”，而是“保持 `scene-02` 边界不变，但把节奏从验证型 phase 切换为实现型 phase”

## Current State Analysis

### 1. `phase17` 已正式完成

- `phase17-04` 的 acceptance 已形成，并将主结论收口为：
  - 当前 `scene-02 capability closure` 已具备首轮 `growth / valuation` 范围内的最低稳定可复用性
  - 当前允许继续推进 `scene-02` 的后续实现入口，但只限首轮 `growth / valuation peer-position capability closure` 链路
  - `scene-03 ~ 05` 继续 `not-yet`
  - 观察面路线继续 `replan-under-new-phase`
  - 常规小批次引入继续冻结
  - `stock_zh_scale_comparison_em` 继续 `candidate-only`
- 依据：
  - `.trae/specs/phase17-scene02-peer-position-capability-closure-04-acceptance-and-next-scene-gate-decision/acceptance.md`
  - `.trae/specs/phase17-scene02-peer-position-capability-closure-04-acceptance-and-next-scene-gate-decision/independent_review.md`

### 2. 顶层真相源仍停留在“准备进入 phase17”

- `AGENTS.md` 仍写到“默认下一步应先同步全局真相源，再进入 `phase17-scene02-peer-position-capability-closure-*`”
- `project_rules.md` 仍把 `phase17` 视为当前默认工作流，而不是已完成阶段
- `global_skills.md` 仍把 `phase16-04 -> phase17` 视为最新阶段切换
- `plan.md` 的当前阶段顺序仍停在 `phase17-01 -> 02 -> 03 -> 04`
- `architecture_map.md` 仍写“当前默认下一步：先完成全局真相源同步，再进入 `phase17-*`”
- `api_intake_standard.md` 仍写“当前默认入口已切换为 `phase17-*`，在 `phase17` 给出正式 acceptance 前继续只作为长期 SOP”

这说明仓库当前真实状态与顶层真相源已再次出现时滞，但这次时滞不是能力边界不清，而是“阶段状态快照未同步”。

### 3. `scene-02` 的真实剩余缺口已经改变

- `phase17` 已完成的部分：
  - `internal/query/scene02_output.go` 已把 scene 级输出统一为单一读模型
  - `internal/query/scene02_capability_validation.go` 已把最小受控样本、问题分级与 `phase17-04` 准入判断固化为统一验证报告
  - `internal/query/viewer_collector_review_query.go` 与 `internal/viewer/app_test.go` 已证明 `collector review` 能展示最小 scene-02 capability 信息
- 但当前剩余缺口仍然存在：
  - `internal/query` 里尚未看到面向场景能力的正式服务级查询入口
  - 当前 scene-02 capability validation 更像内部构造器 + 测试驱动结果，而不是正式对外查询承接位
  - 这意味着下一步的主问题不再是“closure 是否成立”，而是“已成立的 closure 如何进入正式实现入口”

### 4. 因此下一阶段不应做的事

- 不应继续停留在 `phase17` acceptance 总结层
- 不应直接恢复 `scene-03 ~ 05`
- 不应直接重启新的观察面工作流
- 不应把 `stock_zh_scale_comparison_em` 从 `candidate-only` 放开
- 不应把当前 scene-02 最小受控样本结论外推为更多 API 或更多 scene 已 ready

## Pace Judgment

### 结论

`phase15 ~ phase17` 的小步频，在当时总体上是“必要且偏正面的”，但如果 `phase18` 继续机械复制“每 phase 4 个子任务”的节奏，就会从好事转为坏事。

### 为什么前 3 个 phase 不是纯粹的坏事

- `phase15` 解决的是 `scene-02` 的 direct structured admission 真实性，主问题是 front-half admission 与 `bridge proof`
- `phase16` 解决的是 growth / valuation structured stable fact 模板与 contract / runtime / audit / Claim Gate / tests 的治理同构
- `phase17` 解决的是 scene 输出口径、query / audit 承接位、peer / industry scope explanation 与 capability closure

这三个 phase 虽然都停留在 `scene-02`，但它们解决的并不是同一个问题，而是在逐层清除同一路径上的不同阻塞面。因此它们不是简单的“重复原地打转”，而是把一个原本不具备直接实现条件的 scene，逐层推进到“能力闭环成立”。

### 为什么从现在开始不能再机械维持同样步频

- `phase17` 已经把 capability closure 收口完成，剩余问题已经从“边界是否成立”切换为“正式实现入口如何落地”
- 如果 `phase18` 仍按 `01 边界冻结 -> 02 实现 -> 03 单场景验证 -> 04 acceptance` 原样复制，会再次引入过多 phase splitting tax：
  - 文档/验收开销重复
  - 上游/下游切换频繁
  - 实际代码推进速度被流程本身吞掉
- 但另一方面，当前仓库证据仍不支持直接把范围扩张到 `scene-03 ~ 05`，因为这些 scene 在既有文档中仍持续被明确为 `not-yet`

### 因此应采取的节奏调整

- 覆盖面不扩大到更多 scene
- 步频从“验证型四段 phase”切换为“实现型打包 phase”
- 也就是：
  - 边界继续只做 `scene-02`
  - 但 `phase18` 不再拆成一轮新的 4 个微子任务
  - 而是把“实现 + 验证”打包在更少的子任务里完成

## Proposed Changes

### A. 先同步顶层真相源

#### 目标

把“`phase17` 已完成”与“下一步应进入新的 `phase18`”同步为仓库单一真相源。

#### 文件与改动

- `AGENTS.md`
  - 把当前默认入口从 `phase17-*` 切换为“先同步全局真相源，再进入 `phase18-scene02-peer-position-implementation-entry-*`”
  - 明确 `phase17-04` 已正式通过，以及其唯一放开范围
- `project_rules.md`
  - 把当前阶段顺序从 `phase16 -> phase17` 更新为“`phase17` 已完成，下一步进入 `phase18`”
  - 固化 `phase18` 的边界：只承接 `scene-02` 首轮 growth / valuation 的后继实现入口
- `global_skills.md`
  - 补一条新的阶段切换方法论：`phase17-04` 通过后，默认进入 `phase18-scene02-peer-position-implementation-entry-*`
- `project_skills.md`
  - 补一条新的项目级阶段切换规则：`phase18` 的主问题是 scene-02 后继实现入口的正式落地，而不是再次讨论 capability closure 是否成立
- `plan.md`
  - 把“当前阶段顺序”从 `phase17-01 -> 04` 更新为“`phase17` 已完成 -> 同步全局真相源 -> 进入 `phase18-*`”
- `architecture_map.md`
  - 把“当前默认下一步”更新为 `phase18-*`
  - 继续只做最小路线同步，不预写未来模块目录
- `api_intake_standard.md`
  - 把状态快照从“当前默认入口是 `phase17-*`”更新为“`phase17` 已完成，当前默认入口不是本 SOP，而是新的 `phase18-*`”

#### 为什么先做

- 这是项目既有规则要求的最小前置动作
- 若不同步，后续 `phase18` 会再次建立在旧阶段状态快照之上，形成新的双重真相

### B. 新增 `phase18-scene02-peer-position-implementation-entry-*`

#### 建议工作流命名

```text
phase18-scene02-peer-position-implementation-entry-*
```

#### 选择这个方向的原因

- `phase17` 已完成 capability closure，下一步不应再围绕“closure 是否成立”做抽象冻结
- 代码真实缺口已变成“scene-02 正式实现入口如何落在现有 query / viewer 服务边界”
- 这个方向比“恢复观察面”或“继续扩 API 范围”更窄、更真实、更符合现有落点

#### `phase18` 的定位

- 只负责把 `scene-02` 首轮 `growth / valuation peer-position capability closure` 落成正式的后继实现入口
- 优先承接：
  - scene 级 query service 入口
  - scene capability validation 的正式查询落点
  - 与现有 viewer 只读能力的最小承接
- 不负责：
  - 恢复 `scene-03 ~ 05`
  - 重启观察面后继工作流
  - 恢复常规小批次引入
  - 放开 `stock_zh_scale_comparison_em`

#### `phase18` 的节奏调整

- `phase18` 应改为“实现型 phase”，不再复制 `phase17` 的 4 子任务节奏
- 推荐最多 3 个子任务，而不是 4 个：
  - `phase18-01-boundary-and-service-entry-freeze`
  - `phase18-02-query-service-landing-and-validation`
  - `phase18-03-acceptance-and-next-gate-decision`
- 其中：
  - `phase18-02` 直接把实现与验证打包完成
  - 不再单独拆一个“仅做单场景 capability validation”的子任务
  - acceptance 仍保留，但前置切换次数减少

### C. 先补 `phase18` 上游文档，再进入 `/spec`

#### 新增文档

- `docs/phase18_scene02_peer_position_implementation_entry_architecture_plan.md`
- `docs/phase18_scene02_peer_position_implementation_entry_dev_plan.md`
- `docs/phase18_scene02_peer_position_implementation_entry_shared_baseline.md`

#### 三份文档建议收口的核心问题

- architecture_plan
  - 为什么 `phase17` 已完成其职责
  - 为什么下一个工作流应围绕 `scene-02` 的 implementation entry 展开
  - 为什么正式落点应优先位于 `internal/query` / `internal/viewer` 现有服务边界，而不是新开观察面工作流
- dev_plan
  - 拆分 `phase18-01 ~ 04` 的推荐顺序
  - 明确先冻结服务入口与输出边界，再做实现、验证、acceptance
- shared_baseline
  - 固化允许/禁止路线
  - 固化首轮 API 仍只限 valuation / growth
  - 固化 `stock_zh_scale_comparison_em = candidate-only`

### D. 推荐的 `phase18` 首个子任务

#### 建议 change-id

```text
phase18-scene02-peer-position-implementation-entry-01-boundary-and-service-entry-freeze
```

#### 该子任务应冻结的内容

- `scene-02` 正式实现入口的最小目标输出
- 该入口应落在 `internal/query.Service` 的哪一类查询接口上
- 是否需要同步在 `internal/viewer` 增加只读承接位，还是先保持 `collector review` 内嵌展示
- `scene02_capability_validation.go` 的构建器与对外服务入口之间的职责边界
- `stock_zh_scale_comparison_em` 是否继续保持 `candidate-only`

#### 为什么不是直接编码

- 当前还没有把“正式服务入口”冻结为新的 scene 级真相源
- 先冻结边界，能避免把 capability validation 构建器、viewer 展示与正式服务 API 混成一团

### E. 修订后的 `phase18` 子任务建议

#### `phase18-01-boundary-and-service-entry-freeze`

- 冻结：
  - `scene-02` 正式服务入口的最小输出
  - `internal/query.Service` 的正式承接位
  - `internal/viewer` 是否需要最小只读着陆位
  - `scene02_capability_validation.go` 与正式服务 API 的职责边界

#### `phase18-02-query-service-landing-and-validation`

- 直接打包完成：
  - `internal/query` 正式 scene-02 查询入口
  - 与现有 `viewer` 的最小只读承接
  - targeted tests 与必要关联回归
  - 对“实现入口已成立”的最小运行证据

#### `phase18-03-acceptance-and-next-gate-decision`

- 收口：
  - `scene-02` 后继实现入口是否已正式成立
  - 是否允许在 `scene-02` 内继续进入下一层更具体实现
  - `scene-03 ~ 05`、观察面路线、常规小批次引入是否继续冻结

## Assumptions & Decisions

### 已确认的事实

- `phase17` 已完成并通过独立复核
- 顶层真相源尚未吸收 `phase17-04` 的正式结论
- `scene-02` 当前能力已足以支撑进入一个新的、极窄的后继实现工作流
- 当前实现最自然的承接位在 `internal/query.Service` 附近，因为已有：
  - `GetCollectorReviewSnapshot()`
  - `buildScene02PeerPositionOutput()`
  - `buildScene02CapabilityValidationReport()`

### 本计划的决策

- 决策 1：不在 `phase17` 层继续扩写，正式升级为新的 `phase18` 工作流
- 决策 2：`phase18` 先做 implementation entry，而不是直接做更大范围的 scene 实现
- 决策 3：`phase18` 首轮仍只覆盖：
  - `stock_zh_valuation_comparison_em`
  - `stock_zh_growth_comparison_em`
- 决策 4：`stock_zh_scale_comparison_em` 继续保持 `candidate-only`
- 决策 5：在进入 `phase18-01 /spec` 前，必须先完成顶层真相源同步与 phase18 三份上游文档
- 决策 6：`phase18` 不再机械复制 4 子任务节奏，而采用 3 子任务的实现型打包节奏

### 当前不需要额外向用户澄清的点

- 下一步是否恢复 `scene-03 ~ 05`：不恢复
- 下一步是否恢复观察面路线：不恢复
- 下一步是否恢复常规小批次引入：不恢复
- 下一步是否放开 `stock_zh_scale_comparison_em`：不放开

## Verification Steps

### 计划阶段验证

- 复核 `phase17-04` 的 acceptance 与 independent review
- 复核顶层真相源当前仍停留在“进入 phase17”的状态
- 复核 `internal/query` 现有服务入口与 `scene02_*` 构建器之间的真实落点关系

### 执行阶段验证

- 顶层真相源同步后，检查以下文件是否一致指向 `phase18-*`
  - `AGENTS.md`
  - `project_rules.md`
  - `global_skills.md`
  - `project_skills.md`
  - `plan.md`
  - `architecture_map.md`
  - `api_intake_standard.md`
- 检查 phase18 三份上游文档是否都已存在且口径一致
- 检查 `.trae/specs/phase18-...-01-.../` 是否只冻结边界而未越界进入实现

### 后续实现阶段验证

- `internal/query` 是否形成正式的 scene-02 实现入口，而不只是测试辅助构建器
- query / audit / validation 是否继续围绕同一 scene 级语义
- `stock_zh_scale_comparison_em` 是否仍保持 `candidate-only`
- `scene-03 ~ 05`、观察面路线、常规小批次引入是否仍保持冻结

## 推荐执行顺序

```text
1. 同步全局真相源到 phase17 完成态
2. 新增 phase18 的 architecture / dev / shared_baseline
3. 进入 phase18-01-boundary-and-service-entry-freeze /spec
4. 进入 phase18-02-query-service-landing-and-validation
5. 进入 phase18-03-acceptance-and-next-gate-decision
```

## 结论

`phase17` 已经把 `scene-02` 从“模板已成立”推进到“scene capability closure 已成立”。

下一步项目开发方向，应切换为一个新的、极窄的 `phase18`：

```text
phase18-scene02-peer-position-implementation-entry-*
```

它的职责不是继续讨论 capability closure，也不是恢复更大范围功能，而是把已经成立的 `scene-02` 能力闭环，落实为正式、可复用、可继续扩展的后继实现入口。

换句话说：

- 方向上，继续停留在 `scene-02` 仍然是对的
- 节奏上，继续复制 `phase15 ~ 17` 的 4 子任务微收口已经不对了
- 所以，`phase18` 应当是“边界不扩、步频加快”的第一个实现型 phase