# Phase12-02 页面到 Minix 路由映射冻结 Spec

## Why
`phase12-01` 已冻结旧页面范围与分类，但 `phase12-02` 仍需要把“旧页面迁到哪里、当前承接位是什么、缺口在哪里、优先顺序如何、哪些会阻塞 `phase13`”写成单一真相源。

## What Changes
- 在 `docs/phase12_*` 中补齐 `phase12-02` 所需的页面到 `src/minix` 路由承接位映射表
- 明确每个正式页面的目标新路由/承接位、当前承接现状与迁移优先级
- 标记哪些页面映射会直接阻塞 `phase13` retained-legacy API 退出顺序
- 补齐缺失的新宿主承接位命名规则与优先级解释

## Impact
- Affected specs: `phase12-frontend-parity-and-shell-cutover`
- Affected code: `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`, `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`, `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`, `src/minix/router/index.tsx`, `src/minix/routes/route-manifest.tsx`

## ADDED Requirements
### Requirement: 页面路由映射表冻结
系统 SHALL 在 `phase12` 真相源文档中提供一张可追溯的旧页面到 `src/minix` 路由承接位映射表。

#### Scenario: 正式页面映射字段完整
- **WHEN** 审阅 `phase12-02` 的映射表
- **THEN** 每条正式页面映射至少包含 `旧页面路径`、`页面类别`、`当前新宿主承接现状`、`目标新路由/承接位`、`优先级`、`是否阻塞 phase13`

#### Scenario: 映射表引用真实承接位
- **WHEN** 映射表引用已有新宿主路由或占位承接位
- **THEN** 这些引用必须能在 `src/minix/router/index.tsx`、`src/minix/routes/*` 或明确命名的待新增承接位规则中找到依据

### Requirement: 优先顺序单一解释
系统 SHALL 为登录、首页、核心主链列表/详情/编辑页冻结单一可解释的迁移优先顺序。

#### Scenario: P0 与 P1 顺序明确
- **WHEN** 审阅优先级定义
- **THEN** 能明确区分已存在路由承接位的首批迁移页面与需要新增路由壳的核心详情/编辑页面

### Requirement: phase13 阻塞关系显式标记
系统 SHALL 在映射表中显式标记哪些页面 parity 会直接阻塞 `phase13` retained-legacy API 退出顺序。

#### Scenario: 主链页面阻塞关系可追溯
- **WHEN** 审阅房源、合同、账单、租客、抄表、设置/工作台相关页面
- **THEN** 能直接看出其是否阻塞 `phase13`，且口径与 `shared_baseline` 中的页面-API 联动规则一致

## MODIFIED Requirements
### Requirement: phase12 当前页面 parity 基线映射表
`phase12` 当前页面 parity 基线映射表不再只描述“当前承接现状、判断与优先级”，而必须提升为 `phase12-02` 可直接复用的正式映射表，至少覆盖正式业务主链页面，并补齐 `目标新路由/承接位` 与 `是否阻塞 phase13` 字段。

## REMOVED Requirements
- 无
