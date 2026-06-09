# 云端部署操作手册与最小自动化 Spec

## Why
当前仓库已经具备 GitHub 正式部署包链路，但 `DEPLOYMENT.md` 仍承担治理真相源与操作说明双重职责，导致操作者在云服务器执行部署时认知负担较高。需要补一份简洁直观的部署手册，并提供最小的一键化服务器脚本，把“准备前提”和“正式部署”拆成可重复执行的路径。

## What Changes
- 新增一份面向操作者的简洁部署手册，不再要求运维直接从 `DEPLOYMENT.md` 提取操作步骤。
- 新增服务器准备脚本，负责创建运行账户、目录与权限，并检查基本依赖。
- 新增正式部署执行脚本，负责拉取 GitHub Release 正式部署包、刷新 `systemd`/`Caddy`、执行迁移与健康检查。
- 同步 `DEPLOYMENT.md` 与根级真相源，使其把操作步骤入口指向新手册和新脚本，而继续保留治理边界说明。

## Impact
- Affected specs: `phase11-deployment-cutover-and-cutline-closure`、`freeze-github-release-deploy-artifact-pipeline`、`phase16-parity-verification-cutover-and-legacy-exit`
- Affected code: `DEPLOYMENT.md`、`README.md`、`AGENTS.md`、`plan.md`、`architecture_map.md`、`scripts/pull-release-deploy-bundle.sh`
- New code: `DEPLOY_RUNBOOK.md`、`scripts/prepare-release-host.sh`、`scripts/deploy-release-on-server.sh`

## ADDED Requirements
### Requirement: 简洁部署操作手册
系统 SHALL 提供一份面向操作者的简洁部署手册，专门描述云服务器如何完成首次部署、升级部署、健康检查与回滚入口。

#### Scenario: 运维阅读部署文档
- **WHEN** 运维需要在云服务器部署 `Rento-miniX`
- **THEN** 可以直接阅读简洁手册获得按顺序排列的操作步骤
- **AND** 不需要从 `DEPLOYMENT.md` 的治理说明中手工拼接步骤

### Requirement: 服务器准备自动化
系统 SHALL 提供一支服务器准备脚本，帮助运维完成正式部署前的最小前置准备。

#### Scenario: 首次准备服务器
- **WHEN** 运维首次在云服务器准备 `Rento-miniX`
- **THEN** 脚本应创建或校验 `rento:rento` 运行账户、`/opt/rento-minix` 目录与 `/etc/rento-minix` 目录
- **AND** 给出缺失依赖或缺失环境文件的明确提示

### Requirement: 正式部署执行自动化
系统 SHALL 提供一支正式部署执行脚本，使云服务器可在不执行 build 的情况下完成部署。

#### Scenario: 执行正式部署
- **WHEN** 运维提供 Git tag 并执行部署脚本
- **THEN** 脚本应拉取 GitHub Release 正式部署包
- **AND** 落位到 `/opt/rento-minix/current`
- **AND** 刷新 `systemd` 与 `Caddy`
- **AND** 执行迁移与健康检查
- **AND** 不执行 `npm run build`、`vite build` 或 `next build`

### Requirement: 文档入口分层
系统 SHALL 让 `DEPLOYMENT.md` 保留治理边界说明，同时把面向操作者的步骤入口引导到简洁 runbook。

#### Scenario: 查阅部署真相源
- **WHEN** 用户打开 `DEPLOYMENT.md`
- **THEN** 能清楚看到“治理说明看 DEPLOYMENT，实际操作看 DEPLOY_RUNBOOK”的分层

## MODIFIED Requirements
### Requirement: 正式部署说明
当前正式部署说明 SHALL 修改为：
- `DEPLOYMENT.md` 继续作为正式部署真相源
- `DEPLOY_RUNBOOK.md` 作为简洁操作手册
- `scripts/prepare-release-host.sh` 负责服务器准备
- `scripts/deploy-release-on-server.sh` 负责正式部署执行

#### Scenario: 运维首次部署
- **WHEN** 运维第一次上云部署
- **THEN** 可以按“准备脚本 -> 部署脚本 -> 健康检查”的固定顺序执行

## REMOVED Requirements
### Requirement: 仅依赖 DEPLOYMENT.md 手工执行全部部署
**Reason**: 当前 `DEPLOYMENT.md` 已承载大量治理与边界说明，不适合作为唯一操作手册。
**Migration**: 保留 `DEPLOYMENT.md` 作为真相源，并新增 `DEPLOY_RUNBOOK.md` 与服务器脚本承接实际操作路径。
