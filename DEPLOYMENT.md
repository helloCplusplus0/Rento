# DEPLOYMENT.md

> 状态说明：
> - 本文件当前承接 `Rento-miniX` 的正式部署主线说明与 legacy 回滚基线边界。
> - 当前仓库已完成 `phase11-deployment-cutover-and-cutline-closure` 的阶段文档产出，但尚未进入 `phase11-*` `/spec` 或正式部署实现。
> - 因此，本文档当前冻结的是“正式部署目标、资产边界、发布门禁与回滚职责”，而不是宣称所有正式部署资产已经落地。

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
- `phase11` 当前只完成阶段级文档产出，正式部署资产仍待后续 `/spec` 顺序落地
- 当前脚本边界固定为：
  - `npm run dev:minix`：本地开发入口，使用 `tsx watch + Vite` 双进程拓扑
  - `npm run build:minix`：当前仅产出前端 `dist/` 静态壳，不产出服务端 JS
  - `npm run start:minix`：当前生产模式校验入口，仍通过 `tsx server/index.ts` 运行源码，不能误读为“云端只运行预构建产物”的正式部署入口

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
- `docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md`
- `docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md`
- `docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md`

后续 `phase11` 实施应补齐但当前尚未落地的正式资产包括：
- 服务端 JS 预构建产物链
- `Caddy` 正式配置
- `systemd` 服务单元
- 与正式主线对齐的部署手册、健康检查与发布验证脚本

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
- legacy 容器化运行线继续保留回滚职责，但不再承担默认主入口职责
- 在 `phase11` 阶段文档审核通过前，不直接进入正式部署实现或切线执行
