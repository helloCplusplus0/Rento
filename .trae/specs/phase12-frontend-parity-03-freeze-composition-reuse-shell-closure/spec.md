# Phase12-03 页面装配复用与壳层收口 Spec

## Why
`phase12-01` 已冻结页面范围，`phase12-02` 已冻结页面到新宿主的路由映射，但仍缺少“表达层复用什么、宿主绑定层适配什么、哪些目录暂不处理”的单一解释。`phase12-03` 需要把页面壳、页面装配层、导航壳、布局壳与数据加载边界的复用关系冻结为后续实现和验收的共同输入。

## What Changes
- 在 `docs/phase12_*` 中补齐页面壳、页面装配层、数据加载边界、导航壳与布局壳的复用/适配/舍弃策略
- 明确 `src/components/pages/*`、`src/components/business/*`、`src/components/layout/*`、`src/components/ui/*` 的直接承接策略
- 明确 `src/minix/router/*`、`src/minix/layout/*`、`src/minix/routes/*` 作为新宿主绑定层的职责边界
- 明确哪些旧 `src/app` 宿主绑定逻辑需要拆出，哪些治理/辅助层目录暂不处理

## Impact
- Affected specs: `phase12-frontend-parity-and-shell-cutover`
- Affected code: `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`, `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`, `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`, `src/components/pages/*`, `src/components/business/*`, `src/components/layout/*`, `src/components/ui/*`, `src/minix/router/index.tsx`, `src/minix/layout/*`, `src/minix/routes/*`

## ADDED Requirements
### Requirement: 页面装配复用矩阵冻结
系统 SHALL 在 `phase12` 真相源文档中提供页面壳、页面装配层、数据加载边界、导航壳与布局壳的复用矩阵，清楚回答“复用什么、适配什么、舍弃什么及原因”。

#### Scenario: 复用矩阵完整
- **WHEN** 审阅 `phase12-03` 的文档产物
- **THEN** 至少能看到每一层对应的参考来源、目标承接位、处理策略与原因

### Requirement: 宿主绑定层与业务组件层边界冻结
系统 SHALL 明确区分业务组件层与新宿主绑定层，避免在 `src/minix` 内重新复制旧表达层，或把 `next/navigation`、`next/link`、`next/*` 绑定逻辑继续混入可复用组件层。

#### Scenario: 绑定层边界可解释
- **WHEN** 审阅导航壳、布局壳与页面壳的说明
- **THEN** 能明确知道哪些逻辑留在 `src/minix/*`，哪些表达层继续复用 `src/components/*`

### Requirement: 目录级承接策略冻结
系统 SHALL 至少按目录级列出可直接复用的组件层目录、需要迁移或改造的页面装配层目录，以及暂不处理的治理/辅助层目录。

#### Scenario: 目录级策略可追溯
- **WHEN** 审阅目录策略表
- **THEN** 被引用的目录和关键文件都能在当前仓库中找到真实依据

## MODIFIED Requirements
### Requirement: phase12 共享输入不只包含页面映射表
`phase12` 的共享输入不再只包含页面范围和路由映射，还必须包含页面装配复用策略、宿主绑定层拆分边界、布局壳与导航壳的复用规则，作为 `phase13 ~ phase15` 的共同输入。

## REMOVED Requirements
- 无
