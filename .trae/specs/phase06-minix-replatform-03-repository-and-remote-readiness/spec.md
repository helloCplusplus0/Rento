# 仓库与 Remote 就绪 Spec

## Why
当前仓库的逻辑主线已经切换为 `Rento-miniX`，但本地 Git remote、GitHub 仓库状态说明与旧容器化运行线的回滚职责仍可能残留旧口径。若不先收口这些仓库级状态，后续正式实现阶段会面临误推送、回滚判断失真与仓库说明继续分叉的风险。

## What Changes
- 确认 GitHub 侧 `Rento-miniX` 与 `Rento-legacy` 的当前状态和职责分工
- 冻结本地 `origin` 应指向新的 `Rento-miniX` 仓库，而不是旧 `Rento` 地址
- 明确是否需要补冻结 tag、仓库切换说明或本地目录改名建议
- 在文档中明确旧容器化运行线只承担存量可运行基线与回滚参考职责
- 不直接执行发布、推送或大规模 Git 操作

## Impact
- Affected specs: 仓库治理、远端关系、回滚基线、`phase06` 阶段门禁、文档一致性
- Affected code: `.git/config`、`README.md`、`AGENTS.md`、`architecture_map.md`、`project_rules.md`、`DEPLOYMENT.md`、`docs/phase06_*`

## ADDED Requirements
### Requirement: GitHub 仓库关系可验证
系统 SHALL 让用户能够确认当前 GitHub 侧的 `Rento-miniX` 与 `Rento-legacy` 均处于可解释状态，并且各自职责清晰。

#### Scenario: 用户核对 GitHub 仓库状态
- **WHEN** 用户查看仓库状态说明或相关实现结果
- **THEN** 用户应能确认 `Rento-miniX` 是当前主线仓
- **AND** 用户应能确认 `Rento-legacy` 负责旧主线备份与追溯
- **AND** 文档不得把两者描述为并行开发主线

### Requirement: 本地 Origin 收口
系统 SHALL 在进入正式实现前，将本地 `origin` 收口到新的 `Rento-miniX` 仓库地址，避免后续误推送到旧仓。

#### Scenario: 用户检查本地 remote
- **WHEN** 用户查看本地仓库 `origin`
- **THEN** `origin` 应指向 `Rento-miniX`
- **AND** 不应继续保留把旧 `Rento` 仓库地址当作默认推送目标的状态

### Requirement: 仓库切换辅助判断
系统 SHALL 给出是否需要补冻结 tag、切换说明或本地目录改名建议的明确判断，而不是把这些项长期保持为隐含决策。

#### Scenario: 用户审视切换辅助项
- **WHEN** 用户查看本子任务的文档结果
- **THEN** 用户应能知道冻结 tag 是否为当前必需项
- **AND** 用户应能知道是否需要新增仓库切换说明
- **AND** 用户应能知道本地目录是否必须从 `/home/dell/Projects/Rento` 立即改名

### Requirement: 旧运行线回滚职责明确
系统 SHALL 在文档中明确旧容器化运行线与 `Rento-legacy` 当前承担的是存量可运行基线与回滚参考职责，而不是未来 `Rento-miniX` 的正式部署主线。

#### Scenario: 用户查看部署与回滚说明
- **WHEN** 用户阅读 `README.md`、`DEPLOYMENT.md`、`architecture_map.md` 或 `phase06` 文档
- **THEN** 文档应明确旧容器化运行线当前承担回滚参考职责
- **AND** 文档应明确 `Rento-legacy` 承担旧主线备份职责
- **AND** 文档不得把旧部署链误写为未来轻量化主线的正式部署方案

## MODIFIED Requirements
### Requirement: `phase06` 的实现前门禁
`phase06-minix-replatform` 在进入首个正式实现阶段前，必须先完成仓库与 remote 就绪收口，包括 GitHub 状态确认、本地 `origin` 收口与回滚职责说明。

#### Scenario: 用户评估是否能进入下一阶段
- **WHEN** 用户阅读 `docs/phase06_minix_replatform_dev_plan.md`
- **THEN** 用户应能看到“repository-and-remote-readiness”位于首个正式实现阶段冻结之前
- **AND** 用户应能理解未完成该子任务时，不应直接进入正式实现阶段

## REMOVED Requirements
### Requirement: 允许在 remote 未收口状态下直接进入后续实现
**Reason**: 若本地 `origin` 仍指向旧仓或文档未明确回滚职责，后续推送、阶段审核与回滚判断都会失真。
**Migration**: 先完成 GitHub 状态确认、本地 `origin` 收口与文档层职责说明，再进入后续实现阶段冻结与实施。
