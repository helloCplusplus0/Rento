# Phase12-04 UI 保真边界与适配范围 Spec

## Why
`phase12-01` 到 `phase12-03` 已冻结页面范围、路由映射和页面装配复用策略，但后续页面 parity 仍可能因为“体验优化”“移动端改善”或“组件重构”而偏离旧 `Rento` 原型。`phase12-04` 需要把 UI 保真边界、允许的最小技术适配和明确禁止路线冻结为单一解释，供后续所有 `/spec` 直接继承。

## What Changes
- 在 `docs/phase12_*` 中冻结 UI 保真边界、允许的最小改动范围和禁止路线
- 明确哪些调整属于宿主适配、明显 bug 修复、移动端可用性改善、最小信息架构优化
- 明确哪些调整会被视为越界，例如重做设计系统、引入新视觉语言、以用户体验优化名义放大改动
- 把顶层真相源中分散的 UI 承接规则统一为可复用的 `phase12-04` 共享输入

## Impact
- Affected specs: `phase12-frontend-parity-and-shell-cutover`
- Affected code: `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`, `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`, `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`, `project_rules.md`, `project_skills.md`, `src/app/*`, `src/components/*`, `src/minix/layout/*`

## ADDED Requirements
### Requirement: UI 保真边界冻结
系统 SHALL 在 `phase12` 真相源文档中明确把旧 `Rento` 的页面信息结构、导航节奏、表单交互、组件表达与整体视觉风格定义为默认 UI 原型参考。

#### Scenario: UI 原型边界可复用
- **WHEN** 后续子任务审阅 `phase12-04` 产物
- **THEN** 能直接得到“哪些 UI 语义必须保持不变”的单一判断

### Requirement: 允许改动范围受限
系统 SHALL 把允许的 UI 调整限制为宿主适配、明显 bug 修复、移动端可用性改善和最小信息架构优化，并要求每类调整都具备最小技术适配或明确收益解释。

#### Scenario: 允许改动具备边界
- **WHEN** 审阅 `phase12-04` 的允许改动清单
- **THEN** 每一类允许改动都能对应到顶层真相源或当前代码中的真实适配需求

### Requirement: 禁止路线冻结
系统 SHALL 明确禁止在 `phase12` 中重做设计系统、引入新视觉语言，或以“用户体验优化”为名扩大页面 parity 的改动范围。

#### Scenario: 禁止路线可判定
- **WHEN** 后续 `/spec` 试图扩写 UI 调整范围
- **THEN** 可以基于 `phase12-04` 文档直接判断为越界

## MODIFIED Requirements
### Requirement: phase12 共享输入包含 UI 适配判断规则
`phase12` 的共享输入不仅包含页面范围、路由映射和页面装配复用策略，还必须包含 UI 保真边界、允许的最小改动范围与禁止路线，作为后续 `phase12-*` 实施与验收的统一约束。

## REMOVED Requirements
- 无
