# Phase03 迁移兼容退出计划 Spec

## Why
当前项目虽然已经明确以 PostgreSQL 为主线，但迁移链仍残留 SQLite 时代的兼容项，导致脚本、文档与真实迁移状态之间存在理解成本。需要先把兼容项的存在原因、当前作用和退出条件写清楚，为后续专项迁移治理提供上游输入。

## What Changes
- 审视 `migration_lock.toml` 当前状态与其历史兼容角色
- 审视 `scripts/migrate-and-seed.sh` 中 `sqlite -> db push` 兼容分支的当前作用
- 在文档中显式标注兼容项、风险边界、继续保留的原因与正式退出条件
- 必要时为脚本补充最小注释，确保脚本文档口径一致
- **BREAKING**：停止把历史兼容路径误读为当前推荐迁移路径

## Impact
- Affected specs: 迁移链兼容项显式化、部署与迁移口径一致性、后续迁移专项治理输入
- Affected code: `prisma/migrations/migration_lock.toml`、`scripts/migrate-and-seed.sh`、`architecture_map.md`、必要时 `README.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md`

## ADDED Requirements
### Requirement: 显式化迁移兼容项
系统 SHALL 显式记录当前迁移链中的历史兼容项，并说明其存在原因、当前作用与风险边界。

#### Scenario: 识别历史兼容项
- **WHEN** 用户审查迁移链相关脚本与文档
- **THEN** 能明确知道 `migration_lock.toml` 与 `sqlite -> db push` 分支属于历史兼容项
- **THEN** 不会把它们误认为当前 PostgreSQL 主线的推荐迁移方式

### Requirement: 定义兼容退出条件
系统 SHALL 为现有兼容项提供明确、可验证的退出条件，便于后续专项任务按条件清退。

#### Scenario: 后续进入迁移专项治理
- **WHEN** 团队后续启动迁移专项任务
- **THEN** 可直接复用本子任务产出的退出条件、前置条件与风险说明
- **THEN** 不需要重新解释当前为何仍保留兼容项

### Requirement: 保持脚本文档口径一致
系统 SHALL 保证迁移脚本与相关文档对当前迁移状态的描述一致。

#### Scenario: 阅读脚本与文档
- **WHEN** 用户同时查看迁移脚本与架构/部署文档
- **THEN** 对“当前主线路径”“兼容分支用途”“不在当前阶段内做的事”不会产生矛盾理解

## MODIFIED Requirements
### Requirement: PostgreSQL 主线迁移说明
当前迁移说明必须明确 PostgreSQL 是唯一主真相源，而 SQLite 相关逻辑仅作为历史兼容项保留，不能继续作为默认推荐路径。

## REMOVED Requirements
### Requirement: 隐式保留历史兼容
**Reason**: 隐式兼容会制造双重真相，增加后续迁移治理与部署判断成本。  
**Migration**: 将历史兼容项迁移为显式记录对象，保留最小必要说明，并给出正式退出条件与专项治理入口。
