# DEPLOYMENT.md

> 状态说明：
> - 本文件当前承接 `Rento-miniX` 的正式部署主线说明与 legacy 回滚基线边界。
> - 当前仓库已完成 `phase11-01 ~ phase11-05` 当前轮已批准 spec 收口；正式环境模板、主健康入口、最低发布门禁、文档最小验证要求与部署/回滚演练记录要求均已冻结。
> - `phase16` 当前轮已完成 `/plan`、`phase16-01` 证据盘点、`phase16-02` 自动化验证，以及 `phase16-03` 当前轮源码层对齐复核、cutover 审核包字段冻结与待云端复验占位；四类 parity matrix 已固定落位到 `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`，过程记录已固定落位到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`。因此，本文档只承接部署相关摘要结论与引用入口，不扩写第二套过程记录。
> - 正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练尚未在当前开发环境执行；由于缺少真实云服务器与公认 HTTPS 条件，相关结果已明确延后到真实云服务器阶段补齐，不伪造“已完成”记录。

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
- `phase11-03` 已把 `.env.example`、`scripts/health-check.sh` 与 `/api/health` 收口到正式部署主线口径，并继续原样继承 `phase10` 的迁移兼容边界
- `phase11-05` 已把顶层真相源、`docs/phase11_*`、最低工程验证命令、文档最小验证要求与部署/回滚演练记录要求收口到当前部署主线说明
- `phase15` 当前承接位继续建立在同一部署主线上：`manifest.json`、`sw.js`、`index.html` PWA metadata、`scripts/pwa-smoke-check.sh` 与 `server/lib/static.ts` 的头策略统一由纯新主线交付，不再把旧 Next PWA 宿主作为正式部署必需入口
- `phase16` 当前继续在同一部署主线上执行最终验收：部署相关 matrix 已固定回写 `shared_baseline`，正式部署演练记录、legacy 回滚演练记录、`/api/health`、主链 smoke 与 PWA HTTPS 验收结果将继续固定回写 `dev_plan`，并共同构成 cutover 审核包；当前轮若缺少真实云服务器与公认 HTTPS 条件，则只冻结字段、触发条件与引用入口
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
- `scripts/health-check.sh`：主健康入口检查脚本，默认命中 `/api/health`
- `scripts/migrate-and-seed.sh`：数据库迁移与兼容兜底脚本，继续继承 `phase10` 迁移边界
- `server/index.ts` / `server/app.ts` / `server/lib/static.ts`：正式运行时承接位
- `deploy/caddy/Caddyfile`：正式公网入口配置基线，只负责域名、HTTPS 与 `reverse_proxy`
- `deploy/systemd/rento-minix.service`：正式 Hono 守护进程基线，只负责单一进程托管
- `docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md`
- `docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md`
- `docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md`

`phase11-05` 已把以下部署治理要求冻结为正式资产边界的一部分：
- 文档最小验证要求：`docs/phase11_*` 互链复核、被引用路径存在性复核、根级真相源与 `DEPLOYMENT.md` 状态一致性复核
- 后续实施最低工程验证命令：`npm run lint`、`npm run type-check`、`npm run build:minix`、`npm run audit:phase09:legacy-routes`，并在条件允许时执行 `npm run smoke:phase09:all`
- 部署/回滚演练记录要求：最小字段、引用方式与审核用途

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
VITE_ENABLE_PWA=false
CORS_ENABLED=true
MAX_REQUEST_SIZE=10485760
REQUEST_TIMEOUT=30000
```

补充规则：
- `.env.example` 是唯一共享模板，`.env` 仍是私有运行配置
- `AUTH_SESSION_SECRET` 是正式主变量，`NEXTAUTH_SECRET` 仅保留历史兼容回退
- `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS` 默认保持一致
- `VITE_ENABLE_PWA` 是纯新主线 PWA 构建 profile 开关；切换启用/关闭态需要重新构建 `dist/`，不是仅重启 `start:minix` 即可生效
- 迁移脚本兼容变量继续保留 `RUN_SEED` 与 `DB_WAIT_SECS`，但它们不改变正式主线的 PostgreSQL / `migrate deploy` 定位
- 任何涉及认证、CORS、健康检查或部署端口的调整，都必须同步更新实现、模板与文档

## PWA 交付口径
- 纯新主线继续使用根级 `public/manifest.json` 与 `public/sw.js` 作为正式 PWA 产物真相源。
- `server/lib/static.ts` 需要保证：
  - `index.html` 为 `no-cache`
  - `manifest.json` 为 `no-cache`
  - `sw.js` 为 `no-cache, no-store, must-revalidate`
  - `sw.js` 额外返回 `Service-Worker-Allowed: /`
- `scripts/pwa-smoke-check.sh` 是当前最小工程验证入口，用于校验 `/api/health`、`/manifest.json`、`/sw.js` 与 `/offline`。
- 默认 smoke profile 与默认构建保持一致：`bash ./scripts/pwa-smoke-check.sh --profile pwa-disabled --base-url <runtime-url>` 用于验证默认关闭态。
- 正式 PWA 交付链路固定为：
  - `npm run build:minix:pwa`
  - `bash ./scripts/pwa-smoke-check.sh --profile production-ready --base-url <runtime-url>`
- 若只是在本地验证纯新主线运行时、但数据库或其他基础设施尚未完备，可使用：
  - `bash ./scripts/pwa-smoke-check.sh --profile runtime-only --base-url <runtime-url>`
- Android + Chrome + HTTPS 的安装、更新、离线兜底验证仍属于后续人工浏览器验收，不由部署文档自动替代。

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

若本轮仅涉及 `phase11` 文档变更，最小验证要求至少包括：
- `docs/phase11_*` 互链复核
- 被引用路径存在性复核
- 根级真相源与 `DEPLOYMENT.md` 当前状态一致性复核

## 健康检查口径
- 主健康入口固定为 `/api/health`
- `scripts/health-check.sh` 默认优先使用 `NEXTAUTH_URL`，未配置时回退到 `http://127.0.0.1:${MINIX_SERVER_PORT}`；也允许通过 `--url` 显式覆盖做临时诊断
- 正式部署验证至少覆盖：
  - `https://<domain>/api/health`
  - `https://<domain>/login`
  - 首页、房源、合同、账单主链可访问
- 任何更细粒度的健康路径都只能作为辅助定位入口，不替代主健康入口

## 部署演练记录要求
- 后续正式部署演练或回滚演练必须形成可追溯记录。
- 每条记录至少包含：
  - 演练时间
  - 目标环境
  - 执行命令
  - 健康检查结果
  - 主链 smoke 结果
  - 回滚触发条件
  - 最终结论
- 记录必须明确标注本次演练属于“正式主线验证”还是“legacy 回滚验证”。
- 记录可以落位到后续审核材料或阶段文档，但必须能被根级真相源、`DEPLOYMENT.md` 或 `docs/phase11_*` 明确引用。
- 这些记录用于 cutover 审核、legacy 退出判断与回滚基线保留/退出决策，不得以口头确认替代。
- `phase16` 当前轮默认要求把这些记录统一回写到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`，再由 `DEPLOYMENT.md`、根级真相源与 `docs/phase16_*` 互相引用，避免形成第二套部署审计口径。
- 当前若本地环境不具备真实云服务器与公认 HTTPS 条件，允许只冻结这些记录的模板、待补字段、触发条件与引用入口；正式部署演练与 legacy 回滚演练结果延后到真实云服务器执行后补齐。

## legacy 回滚基线
以下资产仍服务于旧容器化运行线的历史运行与回滚参考职责：
- `docker-compose.yml`
-   当前容器编排入口，继续承接旧 `app + postgres + redis + nginx` 组合关系
- `nginx/nginx.conf`
-   当前容器化 HTTPS 反向代理配置，继续服务 legacy 容器网络中的 `app:3001`
- `scripts/cloud-deploy.sh`
-   当前容器化部署执行脚本，继续服务镜像拉取、编排启动与存量运维
- `scripts/bootstrap-deploy-assets.sh`
-   当前 legacy 部署资产拉取脚本，默认仍拉取容器化部署所需文件集合
- `scripts/start-entry.mjs`
-   当前 `Next.js standalone` 生产启动入口，继续对应旧运行线的启动语义；默认不再直接通过 `npm run start` 启动，只有在明确进行 legacy 对照或回滚验证时才允许使用 `LEGACY_START=1 npm run start`
- 历史容器化部署所依赖的镜像、容器、`nginx` 与 `redis` 变量口径

这些资产的统一身份固定为：
- 只服务于旧 `docker-compose + nginx + Next.js standalone` 运行线
- 只承担历史运行参考、故障回滚基线与新旧部署差异对照职责
- 不再作为当前默认部署入口、默认运维入口或正式部署真相源

legacy 回滚职责边界：
- 只回滚存量容器化运行线的镜像、部署资产、环境配置与验证路径
- 只用于正式部署主线稳定验证完成前的应急恢复与差异对照
- `npm run start` 默认不再作为 `phase15` / `phase16` 的正式验证入口；纯新主线继续使用 `npm run build:minix` 或 `npm run build:minix:pwa`、`npm run start:minix` 与 `bash ./scripts/pwa-smoke-check.sh --profile ...`
- 不通过把当前开发 remote 切回 `Rento-legacy` 来处理运行问题
- 不继续把 `docker-compose + nginx + Next.js standalone` 扩写成未来正式部署主线
- 不把 legacy 容器化脚本重新包装成 `Rento-miniX` 的正式发布或运维入口

legacy 资产保留条件：
- 在 `Caddy + systemd + Hono + PostgreSQL` 正式部署主线完成稳定验证前继续保留
- 在正式发布门禁、健康检查、部署演练与回滚演练尚未形成闭环前继续保留
- 保留目的仅限历史运行参考、故障回滚与新旧运行线差异对照

legacy 资产退出条件：
- 正式部署主线、发布门禁、部署演练与回滚验证均已完成并通过审核
- `DEPLOYMENT.md`、根级真相源与 `docs/phase11_*` 已冻结可替代 legacy 说明的正式真相源
- legacy 回滚记录、替代入口与退出决策已形成可审计记录
- 本任务只冻结退出条件，不直接删除 legacy 资产

cutline 说明：
- 当前 cutline 的目标是把正式主线与 legacy 基线完全分离，而不是立即清空 legacy 资产
- 只有在正式主线验证闭环稳定、回滚记录冻结且退出条件满足后，legacy 基线才允许进入后续归档或下线决策

## 与 `Rento-legacy` 的关系
- `Rento-legacy` 只承担 GitHub 侧只读历史备份与对照职责
- 它不是部署入口、回滚入口、默认 remote、默认上游或第二真相源
- 它不承接当前仓库的 cutline 决策、正式部署资产或 legacy 回滚记录
- 当前正式部署、正式文档与正式阶段工作流都只围绕当前仓库展开

## 当前结论
- 根级部署说明已经切换到 `Rento-miniX` 的正式部署主线口径
- `deploy/caddy/Caddyfile` 与 `deploy/systemd/rento-minix.service` 已成为正式部署资产承接位
- `.env.example`、`scripts/health-check.sh` 与 `/api/health` 已收口为正式部署主线的统一环境与健康检查口径
- `phase11-05` 已把文档最小验证要求、最低工程验证命令与部署/回滚演练记录要求收口到当前部署真相源
- `phase16` 已把 cutover 审核、rollback 记录与 legacy 退出判断提升为当前部署真相源的直接继承输入；其中部署相关 matrix 统一回写 `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`，过程记录统一回写 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`，后续部署验收再由 `DEPLOYMENT.md` 与根级真相源引用摘要结论；当前轮正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练均延后到真实云服务器执行
- legacy 容器化运行线继续保留回滚职责，但不再承担默认主入口、默认运维入口或正式真相源职责
- `Rento-legacy` 的职责已冻结为只读历史备份与对照参考，不参与当前仓库的部署或回滚入口
- legacy 基线的保留条件、退出条件与 cutline 解释已收口到单一部署说明入口
