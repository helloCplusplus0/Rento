# DEPLOYMENT.md

> 状态说明：
> - 本文件当前承接 `Rento-miniX` 的正式部署主线说明与 legacy 回滚基线边界。
> - 当前仓库已进入已批准的 `phase11-*` `/spec` 顺序实现；`phase11-02` 已落地正式 `Caddy` / `systemd` 资产基线。
> - 因此，本文档既承接正式部署目标与边界，也记录已经落位的正式部署资产与仍待后续 `/spec` 收口的内容。

## 正式部署主线
- 正式部署目标固定为：`Caddy + systemd + Hono + PostgreSQL`
- 正式公网入口由 `Caddy` 承担：负责 `80/443`、HTTPS 与反向代理
- 正式业务进程由 `systemd` 托管：负责单一 Hono Node 运行时
- 正式 API 与前端静态壳由 Hono 统一承接：
  - `/api/*`
  - `dist/` 下的静态资源与 SPA fallback
- PostgreSQL 是唯一正式数据库主线
- 正式部署主线默认不再引入 `redis`

## 当前阶段说明
- `phase07` 已冻结 `src/minix/`、`server/`、`dev:minix`、`start:minix` 的运行时承接位
- `phase08` 已冻结统一 `/api` 宿主、认证门禁、错误处理与环境变量口径
- `phase09` 已冻结共享领域服务、正式宿主边界与 compat wrapper 清单
- `phase10` 已冻结长期数据访问层方案、查询分层、统一事务边界与迁移兼容边界
- `phase11-01` 已把 `build:minix` / `start:minix` 收口到“前端 `dist/` + 服务端 `build/minix-server/`”的预构建产物链
- `phase11-02` 已补齐 `deploy/caddy/Caddyfile` 与 `deploy/systemd/rento-minix.service` 正式部署资产基线
- 当前脚本边界固定为：
  - `npm run dev:minix`：本地开发入口，使用 `tsx watch + Vite` 双进程拓扑
  - `npm run build:minix`：当前产出前端 `dist/` 与服务端 `build/minix-server/` 预构建产物
  - `npm run start:minix`：当前生产模式入口，读取预构建产物并启动单一 Hono 运行时

## 正式部署拓扑
```text
Internet
  -> Caddy (:80 / :443)
      -> reverse_proxy 127.0.0.1:<MINIX_SERVER_PORT>
          -> Hono runtime
              -> /api/*
              -> dist/*
              -> SPA fallback
                  -> PostgreSQL
```

## 正式资产边界
正式部署主线后续应以以下资产为核心：
- `.env.example`：正式共享环境模板
- `package.json`：正式构建与启动脚本入口
- `scripts/start-minix.mjs`：当前生产模式校验入口，也是后续正式生产启动入口的直接承接位
- `server/index.ts` / `server/app.ts` / `server/lib/static.ts`：正式运行时承接位
- `deploy/caddy/Caddyfile`：正式公网入口配置基线，只负责域名、HTTPS 与 `reverse_proxy`
- `deploy/systemd/rento-minix.service`：正式 Hono 守护进程基线，只负责单一进程托管
- `docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md`
- `docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md`
- `docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md`

后续 `phase11` 实施应补齐但当前尚未落地的正式资产包括：
- 与正式主线对齐的部署手册、健康检查与发布验证脚本
- `phase11-03 ~ phase11-05` 继续需要收口的环境模板、发布门禁、legacy cutline 与部署演练记录

## 正式部署资产基线
- `deploy/caddy/Caddyfile`
  - 站点入口使用单一公网域名占位
  - 只反向代理到 `127.0.0.1:${MINIX_SERVER_PORT}`
  - 不新增 `file_server` 或第二套 SPA fallback 语义
- `deploy/systemd/rento-minix.service`
  - 服务名固定为 `rento-minix.service`
  - 默认使用专用运行账户 `rento:rento`
  - `WorkingDirectory` 固定为 `/opt/rento-minix/current`
  - `EnvironmentFile` 固定为 `/etc/rento-minix/rento-minix.env`
  - `ExecStart` 固定为 `/usr/bin/node /opt/rento-minix/current/scripts/start-minix.mjs`
  - `Restart=on-failure` 作为最小自动重启策略
- 正式部署边界继续保持：
  - `Caddy` 只占用 `80/443`
  - Hono 只监听 `MINIX_SERVER_PORT`
  - PostgreSQL 不直接暴露给公网入口

## 环境变量主口径
正式部署主线应以以下变量为主：
```env
NODE_ENV=production
NEXTAUTH_URL=https://rento.example.com
ALLOWED_ORIGINS=https://rento.example.com
AUTH_SESSION_SECRET=replace-with-a-secure-random-secret
NEXTAUTH_SECRET=replace-with-a-secure-random-secret
DATABASE_URL=postgresql://...
MINIX_SERVER_HOST=127.0.0.1
MINIX_SERVER_PORT=3002
MINIX_DIST_DIR=dist
CORS_ENABLED=true
MAX_REQUEST_SIZE=10485760
REQUEST_TIMEOUT=30000
```

补充规则：
- `.env.example` 是唯一共享模板，`.env` 仍是私有运行配置
- `AUTH_SESSION_SECRET` 是正式主变量，`NEXTAUTH_SECRET` 仅保留历史兼容回退
- `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS` 默认保持一致
- 任何涉及认证、CORS、健康检查或部署端口的调整，都必须同步更新实现、模板与文档

## 迁移与数据库口径
- PostgreSQL 是唯一正式数据库主线
- 正式迁移目标继续固定为 `prisma migrate deploy`
- `db push` 只保留为 `phase10` 已冻结的兼容兜底，不得在 `phase11` 被重新包装为正式主路径
- `migration_lock.toml` 与历史 SQLite 残留仍按兼容项处理，直到后续专项治理完成退出

## 发布前门禁
正式部署切线前至少完成：
- `npm run lint`
- `npm run type-check`
- `npm run build:minix`
- `npm run audit:phase09:legacy-routes`
- 条件允许时执行 `npm run smoke:phase09:all`
- `/api/health` 可用
- 登录页与房源 / 合同 / 账单主链 smoke 通过

## 健康检查口径
- 主健康入口固定为 `/api/health`
- 正式部署验证至少覆盖：
  - `https://<domain>/api/health`
  - `https://<domain>/login`
  - 首页、房源、合同、账单主链可访问
- 任何更细粒度的健康路径都只能作为辅助定位入口，不替代主健康入口

## legacy 回滚基线
以下资产仍服务于旧容器化运行线的历史运行与回滚参考职责：
- `docker-compose.yml`
- `nginx/nginx.conf`
- `scripts/cloud-deploy.sh`
- `scripts/bootstrap-deploy-assets.sh`
- `scripts/health-check.sh`
- `scripts/start-entry.mjs`
- 旧 `.env.example` 中与镜像、容器和 `nginx` 绑定的变量历史口径

legacy 回滚职责边界：
- 只回滚存量容器化运行线的镜像、部署资产、环境配置与验证路径
- 不通过把当前开发 remote 切回 `Rento-legacy` 来处理运行问题
- 不继续把 `docker-compose + nginx + Next.js standalone` 扩写成未来正式部署主线

## 与 `Rento-legacy` 的关系
- `Rento-legacy` 只承担 GitHub 侧只读历史备份与对照职责
- 它不是部署入口、回滚入口、默认 remote 或第二真相源
- 当前正式部署、正式文档与正式阶段工作流都只围绕当前仓库展开

## 当前结论
- 根级部署说明已经切换到 `Rento-miniX` 的正式部署主线口径
- `deploy/caddy/Caddyfile` 与 `deploy/systemd/rento-minix.service` 已成为正式部署资产承接位
- legacy 容器化运行线继续保留回滚职责，但不再承担默认主入口职责
- 后续仍按 `phase11-03 ~ phase11-05` 顺序继续收口环境模板、发布门禁、legacy cutline 与部署演练要求
