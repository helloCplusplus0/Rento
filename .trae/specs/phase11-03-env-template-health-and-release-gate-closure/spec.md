# Phase11-03 环境模板、健康检查与发布门禁收口 Spec

## Why
当前 `.env.example` 仍保留大量旧容器化运行线变量，和 `server/lib/env.ts`、`scripts/health-check.sh`、`scripts/start-minix.mjs` 的新主线运行口径并不一致。若不先收口正式环境模板、主健康入口与发布门禁，后续部署切线会继续出现“文档一套、脚本一套、实现一套”的漂移。

## What Changes
- 将 `.env.example` 升级为 `Rento-miniX` 正式部署主线模板，去除旧容器化 / Redis / Nginx 绑定变量的主模板地位
- 对齐 `server/lib/env.ts` 当前读取的正式变量矩阵，并明确 `AUTH_SESSION_SECRET` 与 `NEXTAUTH_SECRET` 的主从关系
- 收口 `scripts/health-check.sh`，固定 `/api/health` 为主健康入口并与 `NEXTAUTH_URL`、`MINIX_SERVER_PORT` 推导逻辑一致
- 同步 `DEPLOYMENT.md`、`README.md`、`architecture_map.md` 与 `docs/phase11_*`，冻结发布前最低工程验证、业务 smoke 与迁移入口口径
- 原样继承 `phase10` 已冻结的 `migrate deploy` / `db push` 兼容边界，不在本任务重新定义迁移链

## Impact
- Affected specs: `phase11-deployment-cutover-and-cutline-closure`
- Affected code: `.env.example`, `server/lib/env.ts`, `scripts/health-check.sh`, `scripts/migrate-and-seed.sh`, `DEPLOYMENT.md`, `README.md`, `architecture_map.md`, `docs/phase11_deployment_cutover_and_cutline_closure_*`

## ADDED Requirements
### Requirement: 正式环境模板矩阵
系统 SHALL 提供与 `Rento-miniX` 正式部署主线一致的共享 `.env.example` 模板，使环境变量命名、默认值和职责与当前 Hono 运行时口径对齐。

#### Scenario: 正式模板落位
- **WHEN** 仓库更新 `.env.example`
- **THEN** 模板应包含 `NODE_ENV`、`NEXTAUTH_URL`、`ALLOWED_ORIGINS`、`AUTH_SESSION_SECRET`、`NEXTAUTH_SECRET`、`DATABASE_URL`、`MINIX_SERVER_HOST`、`MINIX_SERVER_PORT`、`MINIX_DIST_DIR`、`CORS_ENABLED`、`MAX_REQUEST_SIZE`、`REQUEST_TIMEOUT`
- **AND** 模板不得继续把 `CONTAINER_*`、`NGINX_SSL_DIR`、`APP_IMAGE`、`CONTAINER_PREFIX`、`CONTAINER_REDIS_URL` 作为正式主线变量矩阵
- **AND** `.env.example` 仍只作为共享模板，不承载真实私有配置

### Requirement: 会话与来源控制变量角色
系统 SHALL 明确正式认证与来源控制变量的主从角色，避免 `phase08` 已冻结的环境契约在部署阶段被重新改写。

#### Scenario: 正式变量角色解释
- **WHEN** 文档或模板解释会话和来源控制变量
- **THEN** `AUTH_SESSION_SECRET` 必须继续作为正式主变量
- **AND** `NEXTAUTH_SECRET` 仅保留历史兼容回退语义
- **AND** `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS` 默认保持一致

### Requirement: 主健康入口单一
系统 SHALL 将 `/api/health` 固定为唯一主健康入口，并保证脚本默认行为、部署说明与运行实现一致。

#### Scenario: 健康检查脚本默认命中主入口
- **WHEN** 运行 `scripts/health-check.sh`
- **THEN** 默认应命中 `/api/health`
- **AND** 允许通过显式 URL 覆盖做临时诊断
- **AND** 其他更细粒度健康路径只能作为辅助定位入口

### Requirement: 发布前最低门禁
系统 SHALL 冻结正式部署切线前的最低工程验证、路由核验与业务 smoke 要求，并在文档中形成单一解释。

#### Scenario: 发布前验收
- **WHEN** 文档定义正式发布前门禁
- **THEN** 至少包含 `npm run lint`
- **AND** 至少包含 `npm run type-check`
- **AND** 至少包含 `npm run build:minix`
- **AND** 至少包含 `npm run audit:phase09:legacy-routes`
- **AND** 条件允许时包含 `npm run smoke:phase09:all`
- **AND** 要求 `/api/health`、登录页与房源/合同/账单主链可访问

### Requirement: 迁移入口原样继承 phase10
系统 SHALL 原样继承 `phase10` 已冻结的正式迁移目标与 compat path 边界，不在本任务重新定义数据库迁移语义。

#### Scenario: 迁移入口解释
- **WHEN** `scripts/migrate-and-seed.sh` 与部署文档描述迁移入口
- **THEN** `prisma migrate deploy` 继续是正式迁移目标
- **AND** `db push` 继续只保留兼容兜底语义
- **AND** 不得把 SQLite 残留重新包装为正式支持范围

## MODIFIED Requirements
### Requirement: 正式部署说明
正式部署说明必须从“已经冻结目标变量和门禁口径”升级为“模板、脚本、实现和文档四处对齐”的状态。

## REMOVED Requirements
### Requirement: 旧容器化环境模板继续充当正式共享模板
**Reason**: 旧模板围绕容器镜像、Nginx、Redis 和宿主机挂载目录组织，已不再代表 `Rento-miniX` 正式部署主线。
**Migration**: `.env.example` 切换为新主线模板；legacy 容器化变量只保留在历史回滚资产和后续 `phase11-04` 的 legacy 边界说明中。
