# 根级真相源切换 Spec

## Why
当前仓库已经从旧 `Rento` 主仓切换为 `Rento-miniX` 主线仓，但根级文档仍可能残留旧主线叙事。若不先完成根级真相源切换，后续原地重构会继续建立在旧 `Rento` fix 主线语义上，导致阶段边界、实施顺序和回滚判断持续分叉。

## What Changes
- 将根级项目文档统一切换为 `Rento-miniX` 原地重构主线口径
- 明确当前仓库、`Rento-legacy`、旧存量运行线与后续 `phase06` 的关系
- 冻结 `plan.md` 与 `docs/phase06_*` 的职责分层
- 在必要时为 `DEPLOYMENT.md` 增加“旧容器化运行线参考说明”
- 不改动任何业务实现代码、部署脚本行为或运行时代码

## Impact
- Affected specs: 项目定位、阶段工作流、文档治理、原地重构边界
- Affected code: `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`global_skills.md`、`project_skills.md`、`plan.md`、必要时 `DEPLOYMENT.md`

## ADDED Requirements
### Requirement: 根级主线叙事切换
系统 SHALL 将根级真相源统一描述为 `Rento-miniX` 原地重构主线，而不再将当前仓库定义为旧 `Rento` fix 主线。

#### Scenario: 根级文档统一
- **WHEN** 用户阅读根级 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`global_skills.md`、`project_skills.md` 与 `plan.md`
- **THEN** 文档应一致表述当前仓库已进入 `phase06-minix-replatform`
- **AND** 文档不再把当前默认工作流表述为旧 `Rento` 的 `fix` 闭环

### Requirement: 阶段职责分层冻结
系统 SHALL 明确 `plan.md` 只承接整体阶段总览，而 `docs/phase06_*` 负责阶段级边界、子任务拆分与共享基线。

#### Scenario: 阶段文档职责明确
- **WHEN** 用户阅读 `plan.md` 与 `docs/phase06_*`
- **THEN** `plan.md` 只描述阶段顺序、目标、关键交付、验收条件与当前结论
- **AND** `docs/phase06_minix_replatform_dev_plan.md` 负责子任务、范围、DoD 与顺序
- **AND** `docs/phase06_minix_replatform_shared_baseline.md` 负责共享边界与允许/禁止路线

### Requirement: 旧运行线关系可解释
系统 SHALL 在根级真相源中明确旧 `Rento` 存量运行线、`Rento-legacy` 备份仓与当前仓库之间的关系。

#### Scenario: 旧运行线不再误读为未来主线
- **WHEN** 用户查看项目总览、架构说明或部署说明
- **THEN** 文档应明确 `Rento-legacy` 负责旧主线保留备份
- **AND** 当前容器化部署链只作为旧存量运行线与回滚参考
- **AND** 文档不得把旧容器化部署主线直接表述为未来 `Rento-miniX` 的正式部署主线

### Requirement: UI 与数据库底线冻结
系统 SHALL 在根级真相源中明确当前 UI 默认承接、PostgreSQL 固定主线、云端不构建等底线。

#### Scenario: 关键底线一致
- **WHEN** 用户阅读根级规则与计划文档
- **THEN** 文档应明确当前 `Rento` 前端 UI 展示效果默认承接
- **AND** 文档应明确 PostgreSQL 继续固定为数据库主线
- **AND** 文档应明确未来主线默认云端不做源码构建

## MODIFIED Requirements
### Requirement: 当前默认工作流
当前默认工作流从旧 `Rento` 的“真实场景验证与 fix 闭环”修改为 `phase06-minix-replatform`，其职责是冻结原地重构边界与实施顺序，而不是直接进入实现。

#### Scenario: 默认入口更新
- **WHEN** 用户查看当前默认入口说明
- **THEN** 文档应显示 `phase06-minix-replatform`
- **AND** 文档应说明当前下一步是完成根级真相源切换与 `phase06` 阶段文档审核

### Requirement: 部署文档状态说明
`DEPLOYMENT.md` 在需要时应被修改为“旧存量运行线参考说明”，而不是默认被解读为当前新主线的未来部署真相源。

#### Scenario: 部署文档状态声明
- **WHEN** 用户打开 `DEPLOYMENT.md`
- **THEN** 文档应能说明其当前承担的是旧容器化运行线的部署与回滚参考职责

## REMOVED Requirements
### Requirement: 旧 fix 闭环作为当前默认主工作流
**Reason**: 当前仓库已经切换为 `Rento-miniX` 主线规划阶段，继续把默认入口定义为旧 `fix` 闭环会与新的阶段文档形成双重真相源。
**Migration**: 将旧 `fix` 闭环降级为历史参考与旧运行线维护语境；当前默认入口改由 `phase06-minix-replatform` 承接。
