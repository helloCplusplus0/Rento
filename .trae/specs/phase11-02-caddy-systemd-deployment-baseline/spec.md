# Phase11-02 Caddy 与 systemd 正式部署基线 Spec

## Why
当前仓库已经在 `phase11` 文档中冻结了 `Caddy + systemd + Hono + PostgreSQL` 作为正式部署主线，但仓库内仍缺少可执行的正式部署资产承接位、服务命名和端口职责定义。若不先把这条基线具体化，后续部署切线会继续和 legacy `docker-compose + nginx` 运行线混淆。

## What Changes
- 新增正式部署资产目录基线，使用独立的 `deploy/` 主路径承接 `Caddy` 与 `systemd` 资产，避免与 legacy `nginx/`、`docker-compose.yml` 和旧部署脚本混用
- 新增 `deploy/caddy/Caddyfile` 作为正式公网入口配置基线，只负责域名、HTTPS 和 `reverse_proxy`
- 新增 `deploy/systemd/rento-minix.service` 作为正式应用进程基线，只负责单一 Hono 运行时守护
- 更新 `DEPLOYMENT.md` 与 `phase11` 相关文档，冻结正式部署资产命名、工作目录、内部端口与 legacy 边界
- 明确 `Caddy` 不承担第二套静态文件托管与 SPA fallback 语义，`dist/` 继续由 Hono 承接

## Impact
- Affected specs: `phase11-deployment-cutover-and-cutline-closure`
- Affected code: `DEPLOYMENT.md`, `architecture_map.md`, `README.md`, `docs/phase11_deployment_cutover_and_cutline_closure_*`, `deploy/caddy/Caddyfile`, `deploy/systemd/rento-minix.service`

## ADDED Requirements
### Requirement: 正式部署资产主路径
系统 SHALL 为正式部署主线提供独立的部署资产主路径，使正式 `Caddy` / `systemd` 资产不再与 legacy `nginx` / `docker-compose` 资产混放。

#### Scenario: 正式资产落位
- **WHEN** 仓库为 `phase11-02` 落地正式部署资产
- **THEN** `Caddy` 资产位于 `deploy/caddy/`
- **AND** `systemd` 资产位于 `deploy/systemd/`
- **AND** legacy 运行线仍保留在 `nginx/`、`docker-compose.yml` 与既有 legacy 脚本路径

### Requirement: Caddy 职责单一
系统 SHALL 将 `Caddy` 固定为正式公网入口，只负责域名入口、自动 HTTPS 与反向代理，不复制 Hono 已冻结的静态壳和 API 路由语义。

#### Scenario: Caddy 反向代理到 Hono
- **WHEN** 正式部署使用 `Caddyfile`
- **THEN** 配置应将公网流量反向代理到 `127.0.0.1:${MINIX_SERVER_PORT}`
- **AND** 不额外启用 `file_server` 作为正式主路径
- **AND** 不在 `Caddy` 中复制一套 SPA fallback 规则

### Requirement: systemd 服务单元基线
系统 SHALL 提供单一 `systemd` 服务单元来托管 Hono 生产运行时，并冻结服务命名、工作目录和环境文件职责。

#### Scenario: systemd 托管生产进程
- **WHEN** 正式部署启用应用守护进程
- **THEN** 服务名应固定为 `rento-minix.service`
- **AND** 服务单元应显式声明 `WorkingDirectory`
- **AND** 服务单元应通过 `EnvironmentFile` 读取私有 `.env`
- **AND** 服务单元应通过 `ExecStart` 启动 `scripts/start-minix.mjs`
- **AND** 服务单元应配置基础的自动重启策略

### Requirement: 端口与职责边界
系统 SHALL 冻结正式部署内部端口与服务边界，避免 `Caddy`、`systemd`、Hono 出现职责重叠。

#### Scenario: 正式部署拓扑解释
- **WHEN** 审核正式部署拓扑
- **THEN** `Caddy` 只占用 `80/443`
- **AND** Hono 只监听 `MINIX_SERVER_PORT`
- **AND** PostgreSQL 不直接暴露给公网入口
- **AND** `Caddy`、`systemd`、Hono 的职责描述在代码与文档中保持一致

## MODIFIED Requirements
### Requirement: 正式部署说明
当前部署说明必须从“只冻结目标口径”升级为“同时冻结正式部署资产承接位、命名规则与服务职责”，并明确它与 legacy 运行线的边界。

## REMOVED Requirements
### Requirement: 复用 legacy nginx 目录承接正式部署配置
**Reason**: `nginx/` 与 `docker-compose.yml` 已被明确降级为 legacy 运行线与回滚基线，继续复用会形成双重真相源。
**Migration**: 正式部署资产迁移到新的 `deploy/caddy/` 与 `deploy/systemd/`，legacy 资产继续保留在原路径仅供回滚参考。
