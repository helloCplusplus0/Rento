# Phase16 Legacy Exit Decision And Root Sync 规格

## Why
`phase16-01 ~ phase16-03` 已完成 parity matrix、自动化验证与源码层对齐复核，但正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练仍待真实云服务器补齐。当前需要把 legacy 资产退出顺序、保留条件、回滚窗口与 `phase16` 当前轮最终结论冻结为单一可审计口径，避免文档继续停留在“下一步再看”的漂移状态。

## What Changes
- 冻结 `phase16-04` 当前轮的 legacy 资产分类：继续保留为 rollback-only 基线、满足后续归档前提、仍需等待云端证据闭环后再决策退出。
- 明确 `phase16` 当前轮最终结论采用“未通过但单值化”，而不是误写为“通过”。
- 同步 `docs/phase16_*`、`DEPLOYMENT.md` 与根级真相源，使它们对 legacy 资产保留条件、退出条件、回滚窗口与最终结论保持单一解释。
- 明确本轮不删除 legacy 资产，也不伪造“已完成云端演练”的结果。
- 固定 `phase16` 进入“等待真实云服务器验收完成后再做最终通过判断”的后续入口。

## Impact
- Affected specs: `phase16-parity-verification-cutover-and-legacy-exit`、`freeze-phase16-03-source-alignment-and-cutover-packet`、`phase11-deployment-cutover-and-cutline-closure`
- Affected code: `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`、`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`、`docs/phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md`、`DEPLOYMENT.md`、`README.md`、`AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md`、`architecture_map.md`

## ADDED Requirements
### Requirement: Phase16 Final Status Decision
系统 SHALL 为 `phase16-04` 提供单一、可审计的当前轮最终结论。

#### Scenario: 云端证据尚未闭环
- **WHEN** 正式人工 HTTPS 验收、正式部署演练或 legacy 回滚演练仍未在真实云服务器完成
- **THEN** `phase16` 当前轮结论必须标记为“未通过但单值化”，不得提前标记为“通过”

#### Scenario: 当前轮结论被根级真相源继承
- **WHEN** 团队查看 `plan.md`、`README.md`、`AGENTS.md`、`architecture_map.md`、`DEPLOYMENT.md` 与 `docs/phase16_*`
- **THEN** 所有文档都必须对 `phase16` 当前轮状态给出相同结论

### Requirement: Legacy Asset Exit Classification
系统 SHALL 为 `phase16-04` 提供 legacy 资产的退出顺序、保留条件与后续归档前提。

#### Scenario: rollback-only 资产保持保留
- **WHEN** `docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh`、`scripts/bootstrap-deploy-assets.sh`、`scripts/start-entry.mjs` 仍承担故障回滚与差异对照职责
- **THEN** 文档必须把它们标记为 rollback-only 基线，而不是当前正式入口

#### Scenario: 退出条件尚未满足
- **WHEN** 云端 cutover 审核、正式部署演练与 legacy 回滚演练尚未完成
- **THEN** 文档只能冻结“后续退出前提”与“候选归档条件”，不能声称 legacy 资产已可删除

### Requirement: Root Sync For Phase16
系统 SHALL 同步 `phase16` 文档和根级真相源，使它们对 legacy-exit 决策与回滚窗口给出单一解释。

#### Scenario: 单一真相源一致
- **WHEN** 本轮完成 `phase16-04`
- **THEN** `docs/phase16_*` 与根级真相源都要明确哪些资产继续保留、哪些只满足后续退出前提、以及当前轮最终结论

#### Scenario: 后续入口明确
- **WHEN** 当前轮结论被冻结
- **THEN** 文档必须明确后续只在真实云服务器补齐证据后，才允许重新判断 `phase16` 是否“通过”

## MODIFIED Requirements
### Requirement: Phase16 Legacy Exit Decision
`phase16-04` 当前轮 SHALL 修改为：
- 优先冻结 legacy 资产退出顺序、保留条件、后续归档前提与回滚窗口
- 在云端证据未闭环前，把 `phase16` 当前轮结论固定为“未通过但单值化”
- 只同步文档与根级真相源，不删除 legacy 资产，不伪造云端演练结果

#### Scenario: root sync 不夸大状态
- **WHEN** 团队读取根级真相源
- **THEN** 不会看到“phase16 已最终通过”或“legacy 资产已可删除”的错误表述

## REMOVED Requirements
### Requirement: Current-round final pass without cloud evidence
**Reason**: 当前还缺少真实云服务器上的正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练证据。
**Migration**: 当前轮先冻结“未通过但单值化”结论、rollback-only 资产边界与后续退出条件；待云端证据补齐后，再重新执行最终通过判断。
