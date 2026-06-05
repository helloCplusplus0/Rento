# Tasks
- [x] Task 1: 复核正式部署主线与 legacy 运行线的现状，冻结 `phase11-02` 的实现边界。
  - [x] SubTask 1.1: 核对 `server/index.ts`、`server/lib/static.ts`、`DEPLOYMENT.md` 与 `phase11` 文档，确认 Hono 继续承接 `/api/*` 与 `dist/`
  - [x] SubTask 1.2: 核对 `docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh`、`scripts/start-entry.mjs`，确认 legacy 运行线仍只承担回滚参考职责
  - [x] SubTask 1.3: 结合 Context7 冻结 `Caddy` 与 `systemd` 的最小职责，避免把第二套路由或第二套守护语义带入正式主线

- [x] Task 2: 落地正式部署资产基线与命名规则。
  - [x] SubTask 2.1: 新增 `deploy/caddy/Caddyfile`，固定公网域名入口、HTTPS 与 `reverse_proxy` 到 `127.0.0.1:${MINIX_SERVER_PORT}`
  - [x] SubTask 2.2: 新增 `deploy/systemd/rento-minix.service`，固定 `WorkingDirectory`、`EnvironmentFile`、`ExecStart` 与自动重启策略
  - [x] SubTask 2.3: 明确 `Caddy` 不承担 `file_server` / SPA fallback 正式主路径，`systemd` 不引入第二套进程管理逻辑

- [x] Task 3: 同步部署文档与结构映射，使正式部署资产边界成为单一真相源。
  - [x] SubTask 3.1: 更新 `DEPLOYMENT.md`，写清 `deploy/caddy/`、`deploy/systemd/`、服务命名、内部端口和工作目录口径
  - [x] SubTask 3.2: 更新 `README.md`、`architecture_map.md` 与 `docs/phase11_deployment_cutover_and_cutline_closure_*` 的相关表述，保持与实现一致
  - [x] SubTask 3.3: 明确 legacy 资产继续保留在 `nginx/`、`docker-compose.yml` 与旧脚本路径，不与正式部署资产混淆

- [x] Task 4: 验证正式部署基线可解释且不与 legacy 边界冲突。
  - [x] SubTask 4.1: 复核 `Caddyfile` 与 `rento-minix.service` 内容是否符合 spec 与 Context7 口径
  - [x] SubTask 4.2: 运行 `npm run lint`、`npm run type-check`，确认本轮新增部署资产没有引入实现回归
  - [x] SubTask 4.3: 对照 `DEPLOYMENT.md`、legacy 资产与新部署资产，确认职责、路径和命名没有冲突

# Task Dependencies
- `Task 2` depends on `Task 1`
- `Task 3` depends on `Task 2`
- `Task 4` depends on `Task 2` and `Task 3`
