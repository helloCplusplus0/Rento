# Phase12-05 路线图一致性与 Phase12 到 Phase15 收口 Spec

## Why
`phase12-01` 到 `phase12-04` 已分别冻结页面范围、路由映射、页面装配复用和 UI 保真边界，但 `phase12 ~ phase15` 的完整路线图、上游输入、文档状态和最小验证要求仍需要统一收口为单一解释。`phase12-05` 的目标是确保顶层真相源与 `docs/phase12_*` 在同一套路线图、阶段边界和验证口径上闭环，避免后续 `/spec` 再回退成重新定义范围与优先级。

## What Changes
- 在 `docs/phase12_*` 中收口 `phase12 ~ phase15` 的完整路线图、前后依赖、DoD 与退出条件
- 复核并必要时同步 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`plan.md` 与 `docs/phase12_*` 的当前状态
- 冻结本轮仅文档变更时的最小验证要求与互链复核口径
- 明确 `phase13` API / query parity、`phase14` PWA parity、`phase15` parity 验收与 legacy 退出对 `phase12` 的继承关系

## Impact
- Affected specs: `phase12-frontend-parity-and-shell-cutover`, `phase13-api-query-parity-and-legacy-route-drain`, `phase14-minix-pwa-and-runtime-parity`, `phase15-parity-verification-cutover-and-legacy-exit`
- Affected code: `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`, `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`, `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`, `README.md`, `AGENTS.md`, `project_rules.md`, `architecture_map.md`, `plan.md`, `server/lib/legacy-route-inventory.ts`

## ADDED Requirements
### Requirement: `phase12 ~ phase15` 路线图单一解释
系统 SHALL 在 `phase12` 真相源文档中把 `phase12` 页面 parity、`phase13` API / query parity、`phase14` PWA parity、`phase15` parity 验收与 legacy 退出的职责、前后依赖、DoD 与退出条件冻结为单一解释。

#### Scenario: 路线图可复用
- **WHEN** 后续子任务审阅 `phase12-05` 产物
- **THEN** 能直接得到 `phase12 ~ phase15` 的顺序关系、继承输入和不在当前阶段处理的边界

### Requirement: 顶层真相源与阶段文档状态一致
系统 SHALL 确保 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`plan.md` 与 `docs/phase12_*` 对当前阶段状态、路线图和验证口径保持一致。

#### Scenario: 顶层文档无漂移
- **WHEN** 审阅顶层真相源与 `docs/phase12_*`
- **THEN** 不会出现当前阶段状态、阶段顺序或验证要求的互相冲突

### Requirement: 文档轮次最小验证要求冻结
系统 SHALL 明确仅文档变更轮次至少需要完成 `docs/phase12_*` 三份文档互链复核、被引用路径存在性复核，以及顶层真相源与阶段文档状态一致性复核。

#### Scenario: 文档轮次可验收
- **WHEN** 本轮只修改文档
- **THEN** 可以基于冻结的最小验证要求判断本轮是否达到提交门禁

## MODIFIED Requirements
### Requirement: `phase12` 的共享输入包含完整后续路线图
`phase12` 的共享输入不仅包含页面范围、映射表、页面装配复用策略和 UI 保真边界，还必须包含 `phase12 ~ phase15` 的完整路线图、上游输入、最小验证要求和 legacy 退出判断边界。

## REMOVED Requirements
- 无
