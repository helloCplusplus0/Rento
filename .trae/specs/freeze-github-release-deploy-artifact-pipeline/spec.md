# GitHub 正式部署产物链 Spec

## Why
当前正式部署主线已经冻结为 `Caddy + systemd + Hono + PostgreSQL`，并明确要求云端不执行构建，只运行预构建产物。但仓库现有 `.github/workflows` 仍偏向 legacy 容器化与旧 `Next.js` 构建路径，尚未形成“GitHub 产出正式部署包，云服务器只拉产物部署”的单一路径。

## What Changes
- 新增正式主线 GitHub Actions 产物链：基于 `build:minix` 生成可部署产物，而不是只生成 legacy 容器化 deployment artifact。
- 调整现有 CI 校验路径，从 `npm run build` + `.next` 切换到 `npm run build:minix` + `dist/` + `build/minix-server/`。
- 新增正式部署包清单与发布策略，明确哪些文件必须随发布物交付到云服务器。
- 新增或调整云端拉取部署产物脚本，使服务器从 GitHub 拉正式部署包，而不是拉 legacy 容器化资产。
- 同步 `DEPLOYMENT.md` 与根级真相源，明确 GitHub Release/产物拉取部署是当前正式云端部署路径，legacy 容器化与 GHCR 镜像只保留 rollback-only 职责。

## Impact
- Affected specs: `phase11-deployment-cutover-and-cutline-closure`、`phase16-parity-verification-cutover-and-legacy-exit`
- Affected code: `.github/workflows/ci.yml`、`.github/workflows/docker-build.yml`、`scripts/bootstrap-deploy-assets.sh`、`DEPLOYMENT.md`、`README.md`、`AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md`、`architecture_map.md`

## ADDED Requirements
### Requirement: GitHub 正式部署产物发布链
系统 SHALL 提供一条基于 GitHub Actions 的正式部署产物发布链，使云服务器无需执行 `build` 即可完成正式主线部署。

#### Scenario: GitHub 生成正式部署包
- **WHEN** 仓库在正式发布触发条件下执行 GitHub Actions
- **THEN** 工作流必须运行 `npm run build:minix`
- **AND** 产出可供云服务器直接拉取的正式部署包
- **AND** 该部署包不能依赖 `.next` 或旧 `Next.js` 构建产物

#### Scenario: 正式部署包内容固定
- **WHEN** GitHub Actions 生成正式部署包
- **THEN** 部署包至少包含 `dist/`、`build/minix-server/`、`scripts/start-minix.mjs`、`scripts/health-check.sh`、`scripts/migrate-and-seed.sh`、`deploy/caddy/Caddyfile`、`deploy/systemd/rento-minix.service`、`.env.example`
- **AND** 文档必须说明是否还需要额外的运行时依赖交付步骤

### Requirement: 云端 Pull 产物部署路径
系统 SHALL 提供一条“云端只拉正式部署产物，不执行 build”的部署路径。

#### Scenario: 服务器拉取正式部署包
- **WHEN** 运维在云服务器执行正式部署
- **THEN** 服务器应从 GitHub 拉取正式部署包或正式发布物
- **AND** 不应在服务器执行 `npm run build`、`vite build`、`next build` 等构建操作

#### Scenario: legacy 资产不再充当正式入口
- **WHEN** 运维执行正式主线部署
- **THEN** `docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh`、`scripts/bootstrap-deploy-assets.sh` 当前 legacy 拉取逻辑、`ghcr.io/hellocplusplus0/rento-minix:latest` 旧容器化入口都不得被文档描述为正式主线路径

### Requirement: CI 与正式主线一致
系统 SHALL 让 GitHub CI 校验路径与当前正式部署主线保持一致。

#### Scenario: CI 校验正式构建结果
- **WHEN** GitHub CI 运行构建校验
- **THEN** 必须验证 `build:minix` 成功
- **AND** 必须检查 `dist/` 与 `build/minix-server/` 存在
- **AND** 不再把 `.next` 当作正式主线构建成功标志

### Requirement: 文档与脚本单一解释
系统 SHALL 同步部署说明、脚本与根级真相源，使它们对 GitHub 部署产物链给出单一解释。

#### Scenario: 查看部署文档
- **WHEN** 用户阅读 `DEPLOYMENT.md` 与根级真相源
- **THEN** 能看到明确的 GitHub 产物来源、服务器拉取步骤、环境文件放置位置、服务刷新步骤、健康检查步骤与 rollback-only 边界

## MODIFIED Requirements
### Requirement: 正式部署入口
当前正式部署入口 SHALL 修改为：
- 以 GitHub 发布的正式部署包作为云端部署来源
- 以 `Caddy + systemd + Hono + PostgreSQL` 作为唯一正式运行时主线
- 以服务器拉取正式部署包、落地环境文件并启动服务作为正式部署路径
- 以 legacy 容器化资产和 GHCR 镜像作为 rollback-only 参考，而不是正式发布入口

#### Scenario: 从 GitHub 部署到云服务器
- **WHEN** 用户在云服务器执行部署
- **THEN** 应按正式部署文档拉取发布包、部署到 `/opt/rento-minix/current`、刷新 `systemd`/`Caddy`、执行健康检查
- **AND** 不需要在服务器构建应用

## REMOVED Requirements
### Requirement: CI 使用 `.next` 作为正式构建产物
**Reason**: 当前正式主线已经不是 `Next.js standalone`，继续把 `.next` 作为 CI 成功标志会误导部署路径。
**Migration**: 将 CI 构建与构建产物校验切换为 `build:minix`、`dist/` 与 `build/minix-server/`，并把 legacy 容器化/Next 路线降级为 rollback-only。
