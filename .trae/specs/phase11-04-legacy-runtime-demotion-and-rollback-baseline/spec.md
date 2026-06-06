# Phase11-04 Legacy 运行线降级与回滚基线收口 Spec

## Why
当前根级文档已经切到 `Rento-miniX` 的正式部署主线，但 legacy 容器化运行线仍散落在多个入口中，容易被误读为并行正式部署路径。需要把旧运行线明确降级为 legacy 回滚基线，写清保留条件、退出条件与不得继续扩写的边界。

## What Changes
- 盘点 legacy 回滚资产集合，并统一到单一说明
- 冻结 legacy 回滚职责边界、保留条件与 cutline 退出条件
- 明确 `Rento-legacy` 只承担 GitHub 侧只读历史备份与对照职责
- 同步 `DEPLOYMENT.md`、根级真相源与 `docs/phase11_*`，消除“正式主线”和“legacy 基线”混写
- 不删除 legacy 资产，不恢复并行部署入口

## Impact
- Affected specs: `phase11-deployment-cutover-and-cutline-closure`
- Affected code: `docker-compose.yml`, `nginx/nginx.conf`, `scripts/cloud-deploy.sh`, `scripts/bootstrap-deploy-assets.sh`, `scripts/start-entry.mjs`, `README.md`, `DEPLOYMENT.md`, `AGENTS.md`, `architecture_map.md`, `project_rules.md`, `docs/phase11_deployment_cutover_and_cutline_closure_*`

## ADDED Requirements
### Requirement: Legacy 回滚资产清单
系统 SHALL 提供完整、可复核的 legacy 回滚资产集合清单，明确这些资产只服务于旧容器化运行线的历史运行与回滚参考。

#### Scenario: 盘点 legacy 资产
- **WHEN** 仓库文档描述 legacy 回滚基线
- **THEN** 必须至少包含 `docker-compose.yml`
- **AND** 必须至少包含 `nginx/nginx.conf`
- **AND** 必须至少包含 `scripts/cloud-deploy.sh`
- **AND** 必须至少包含 `scripts/bootstrap-deploy-assets.sh`
- **AND** 必须至少包含 `scripts/start-entry.mjs`
- **AND** 必须说明历史容器化镜像、容器、`nginx` 与 `redis` 变量口径只继续作为 legacy 回滚参考

### Requirement: Legacy 职责边界
系统 SHALL 将旧容器化运行线的职责边界冻结为“历史运行线与回滚基线”，不得再与正式主线混写。

#### Scenario: 描述 legacy 边界
- **WHEN** 文档描述 `docker-compose + nginx + Next.js standalone`
- **THEN** 必须明确其只承担历史运行与回滚参考职责
- **AND** 必须明确不得继续扩写为 `Rento-miniX` 的未来正式部署主线
- **AND** 必须明确不得作为当前默认部署入口、默认运维入口或正式真相源

### Requirement: Cutline 保留与退出条件
系统 SHALL 冻结 legacy 回滚基线的保留条件与退出条件，使 cutline 过程可解释、可审计。

#### Scenario: 定义保留条件
- **WHEN** 文档说明 legacy 资产为何继续保留
- **THEN** 必须说明在正式部署主线完成稳定验证前，legacy 资产仍作为回滚基线保留
- **AND** 必须说明其保留目的仅限历史运行参考、故障回滚与差异对照

#### Scenario: 定义退出条件
- **WHEN** 文档说明 legacy 基线何时可以退出
- **THEN** 必须要求正式部署主线、发布门禁、部署演练与回滚验证都已完成并通过审核
- **AND** 必须要求 legacy 资产的替代真相源与回滚记录已经冻结
- **AND** 不得在本任务直接删除 legacy 资产

### Requirement: `Rento-legacy` 职责冻结
系统 SHALL 明确 `Rento-legacy` 的唯一职责是 GitHub 侧只读历史备份与对照参考。

#### Scenario: 描述 `Rento-legacy`
- **WHEN** 根级真相源或部署文档提到 `Rento-legacy`
- **THEN** 必须明确它不是部署入口
- **AND** 必须明确它不是回滚入口
- **AND** 必须明确它不是默认 remote、默认上游或第二真相源

## MODIFIED Requirements
### Requirement: 正式部署真相源描述
正式部署真相源的描述必须从“已有正式部署资产与 legacy 回滚说明”升级为“正式主线与 legacy 基线边界完全分离、保留条件和退出条件明确”的状态。

## REMOVED Requirements
### Requirement: Legacy 容器化运行线仍可被视为并行部署主线候选
**Reason**: 该叙事会重新制造双重真相源与双部署入口风险，与 `phase11` 的 cutline 收口目标冲突。
**Migration**: 继续保留 legacy 资产，但仅作为历史运行线、回滚基线与对照参考；正式部署与当前实现全部围绕当前仓库和 `Rento-miniX` 主线展开。
