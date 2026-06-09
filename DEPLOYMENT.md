# DEPLOYMENT.md

> 状态说明：
> - 本文件当前承接 `Rento-miniX` 的正式部署主线说明与 legacy 回滚基线边界。
> - 当前仓库已完成 `phase11-01 ~ phase11-05` 当前轮已批准 spec 收口；正式环境模板、主健康入口、最低发布门禁、文档最小验证要求与部署/回滚演练记录要求均已冻结。
> - `phase16` 当前轮已完成 `/plan`、`phase16-01` 证据盘点、`phase16-02` 自动化验证、`phase16-03` 当前轮源码层对齐复核与 `phase16-04` 当前轮任务 `1 ~ 4`；四类 parity matrix 已固定落位到 `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`，过程记录已固定落位到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`。当前轮最终结论已单值化为 `未通过但单值化`，因此本文档只承接部署相关摘要结论与引用入口，不扩写第二套过程记录。
> - 正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练尚未在当前开发环境执行；由于缺少真实云服务器与公认 HTTPS 条件，相关结果已明确延后到真实云服务器阶段补齐，不伪造“已完成”记录。
> - 面向操作者的简洁部署步骤已单独收口到 `DEPLOY_RUNBOOK.md`；本文档继续只负责治理真相源、正式/legacy 资产边界与发布门禁。

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
- 当前 GitHub 正式发布链已切换为：`.github/workflows/release-deploy-bundle.yml` 负责执行 `npm run build:minix`、生成正式部署包并上传为 GitHub Release asset；推送 `v*` tag 会自动出包，`workflow_dispatch` 也可直接基于当前选定 ref 创建首个同名 release/tag；若同名 release 已存在，workflow 会直接失败并要求改用新的 `release_tag`；云服务器只拉包、解压、切换 `current`、刷新 `systemd/Caddy`，不在服务器执行 build
- `phase11-05` 已把顶层真相源、`docs/phase11_*`、最低工程验证命令、文档最小验证要求与部署/回滚演练记录要求收口到当前部署主线说明
- `phase15` 当前承接位继续建立在同一部署主线上：`manifest.json`、`sw.js`、`index.html` PWA metadata、`scripts/pwa-smoke-check.sh` 与 `server/lib/static.ts` 的头策略统一由纯新主线交付，不再把旧 Next PWA 宿主作为正式部署必需入口
- `phase16` 当前继续在同一部署主线上执行最终验收：部署相关 matrix 已固定回写 `shared_baseline`，正式部署演练记录、legacy 回滚演练记录、`/api/health`、主链 smoke 与 PWA HTTPS 验收结果将继续固定回写 `dev_plan`，并共同构成 cutover 审核包；当前轮若缺少真实云服务器与公认 HTTPS 条件，则只冻结字段、触发条件与引用入口
- 当前脚本边界固定为：
  - `npm run dev:minix`：本地开发入口，使用 `tsx watch + Vite` 双进程拓扑
  - `npm run build:minix`：当前产出前端 `dist/` 与服务端 `build/minix-server/` 预构建产物
  - `npm run start:minix`：当前生产模式入口，读取预构建产物并启动单一 Hono 运行时

## 部署操作分层
- `DEPLOYMENT.md`
  - 继续承接正式部署主线说明、发布门禁、正式/legacy 资产边界与回滚基线
- `DEPLOY_RUNBOOK.md`
  - 只承接首次部署、升级部署、健康检查与回滚入口的实际操作步骤
- `scripts/prepare-release-host.sh`
  - 只负责服务器前置准备：运行账户、目录、环境模板与 GitHub CLI 前提检查
- `scripts/deploy-release-on-server.sh`
  - 只负责正式部署执行链：拉包、切换 `current`、可选刷新系统级配置、迁移、服务刷新与健康检查
- `scripts/pull-release-deploy-bundle.sh`
  - 只负责底层拉包、校验、解压与切换 `current`，默认不再作为常规手工部署入口

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
- `.github/workflows/release-deploy-bundle.yml`：正式 GitHub Release 部署包产物链
- `scripts/start-minix.mjs`：当前生产模式校验入口，也是后续正式生产启动入口的直接承接位
- `scripts/health-check.sh`：主健康入口检查脚本，默认命中 `/api/health`
- `scripts/migrate-and-seed.sh`：数据库迁移与兼容兜底脚本，继续继承 `phase10` 迁移边界
- `scripts/prepare-release-host.sh`：服务器准备脚本，负责运行账户、目录、环境模板与 GitHub 认证提示
- `scripts/deploy-release-on-server.sh`：正式部署执行脚本，负责串联拉包、迁移、服务刷新与健康检查
- `scripts/pull-release-deploy-bundle.sh`：云服务器从 GitHub Release 拉取正式部署包并落位到 `/opt/rento-minix/current` 的正式部署脚本
- `DEPLOY_RUNBOOK.md`：面向操作者的简洁部署操作手册
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

## GitHub 正式部署包
- 正式部署来源固定为 GitHub Release asset，而不是 `.next`、legacy deployment artifact 或 GHCR 容器镜像。
- 正式发布 workflow 固定为 `.github/workflows/release-deploy-bundle.yml`：
  - 执行 `npm run build:minix`
  - 验证 `dist/` 与 `build/minix-server/`
  - 执行 `npm prune --omit=dev`
  - 打包运行所需文件并上传到 GitHub Release
- `workflow_dispatch` 当前不再要求预先存在 git tag：
  - 手工触发时输入 `release_tag`
  - workflow 直接基于当前选定 ref 的提交构建部署包
  - 若远端尚无同名 tag/release，则由 workflow 自动创建
  - 若远端已存在同名 tag/release，则 workflow 会直接失败并提示改用新的 `release_tag`
- 正式部署包命名规则固定为：
  - `rento-minix-<version>-deploy-bundle.tar.gz`
  - `rento-minix-<version>-deploy-bundle.tar.gz.sha256`
- `<version>` 默认取 Git tag 去掉前缀 `v` 后的值，例如 `v1.2.3 -> 1.2.3`
- 正式部署包当前至少包含：
  - `dist/`
  - `build/minix-server/`
  - `node_modules/`
  - `prisma/`
  - `deploy/caddy/Caddyfile`
  - `deploy/systemd/rento-minix.service`
  - `.env.example`
  - `package.json`
  - `package-lock.json`
  - `DEPLOY_RUNBOOK.md`
  - `scripts/start-minix.mjs`
  - `scripts/health-check.sh`
  - `scripts/migrate-and-seed.sh`
  - `scripts/prepare-release-host.sh`
  - `scripts/deploy-release-on-server.sh`
  - `scripts/pull-release-deploy-bundle.sh`
  - `README.md`
  - `DEPLOYMENT.md`
- 额外运行时依赖说明：
  - 服务器仍需预装 `node`、`systemd`、`caddy`、`postgresql` 与 `gh`
  - 正式部署包已包含运行时 `node_modules`，服务器无需再执行 `npm ci` 或任何 build 命令
  - 数据库迁移仍由 `scripts/migrate-and-seed.sh` 承担，但它属于运行/迁移动作，不属于构建

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
- 正式服务器环境文件固定放置在 `/etc/rento-minix/rento-minix.env`
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

## 服务器部署步骤
- 操作步骤唯一入口固定为 `DEPLOY_RUNBOOK.md`；本文档不再重复维护命令级操作清单。
- `scripts/pull-release-deploy-bundle.sh` 只作为底层拉包脚本保留；除高级诊断、手动回滚或脚本复用场景外，不再作为常规操作入口。
- 正式部署目录固定为：
  - 发布包目录：`/opt/rento-minix/releases/<tag>`
  - 当前活动链接：`/opt/rento-minix/current`
  - 环境文件：`/etc/rento-minix/rento-minix.env`
- 首次部署默认通过 `prepare-release-host.sh --release-tag <tag>` 同步目标 release 的 `.env.example`，随后由 `deploy-release-on-server.sh <tag> --domain <your-domain>` 完成正式部署。
- 需要用当前 release 刷新系统级配置时，继续通过 `deploy-release-on-server.sh --refresh-system-config` 处理，但命令细节统一只保留在 `DEPLOY_RUNBOOK.md`。
- 若只做高级诊断或手动回滚，允许单独执行 `scripts/pull-release-deploy-bundle.sh <tag>`。
- 过程约束：
  - 不执行 `npm run build`
  - 不执行 `vite build`
  - 不执行 `next build`
  - 不把 GHCR 或 `docker-compose` 作为正式入口

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
-   当前容器编排入口，继续承接旧 `app + postgres + redis + nginx` 组合关系；当前分类固定为 `rollback-only`
- `nginx/nginx.conf`
-   当前容器化 HTTPS 反向代理配置，继续服务 legacy 容器网络中的 `app:3001`；当前分类固定为 `rollback-only`
- `scripts/cloud-deploy.sh`
-   当前容器化部署执行脚本，继续服务镜像拉取、编排启动、数据库初始化、`nginx` 启动与 legacy 恢复；当前分类固定为 `rollback-only`
- `scripts/bootstrap-deploy-assets.sh`
-   当前 legacy 部署资产拉取脚本，默认仍拉取容器化部署所需文件集合，用于回滚工作目录重建与部署审计；不得再用于正式主线部署；当前分类固定为 `rollback-only`
- `scripts/start-entry.mjs`
-   当前 `Next.js standalone` 生产启动入口，继续对应旧运行线的启动语义；默认不再直接通过 `npm run start` 启动，只有在明确进行 legacy 对照或回滚验证时才允许使用 `LEGACY_START=1 npm run start`；当前分类固定为 `rollback-only`
- 历史容器化部署所依赖的镜像、容器、`nginx` 与 `redis` 变量口径
- `Dockerfile` / `.github/workflows/docker-build.yml`
-   当前 rollback-only GHCR 镜像构建入口；为维持 legacy 容器回滚链持续可构建，镜像内部已切换为构建 `npm run build:minix` + `scripts/start-minix.mjs` 的当前运行产物，但外层职责仍固定为 legacy 容器编排、差异对照与故障回滚，不得被重新解释为正式主线

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
- 不把 rollback-only GHCR 镜像内部改用 `minix` 产物链，误读成正式部署重新回到容器主线

legacy 资产保留条件：
- 在 `Caddy + systemd + Hono + PostgreSQL` 正式部署主线完成稳定验证前继续保留
- 在正式发布门禁、健康检查、部署演练与回滚演练尚未形成闭环前继续保留
- 保留目的仅限历史运行参考、故障回滚与新旧运行线差异对照
- 当前轮五项命名资产全部继续保留，尚无任何一项满足立即归档或立即退出条件

legacy 资产退出条件：
- 正式部署主线、发布门禁、部署演练与回滚验证均已完成并通过审核
- `DEPLOYMENT.md`、根级真相源与 `docs/phase11_*` 已冻结可替代 legacy 说明的正式真相源
- legacy 回滚记录、替代入口与退出决策已形成可审计记录
- 真实云服务器上的正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练均已补齐并被 `docs/phase16_*`、根级真相源同步引用
- 本任务只冻结退出条件，不直接删除 legacy 资产

cutline 说明：
- 当前 cutline 的目标是把正式主线与 legacy 基线完全分离，而不是立即清空 legacy 资产
- 只有在正式主线验证闭环稳定、回滚记录冻结且退出条件满足后，legacy 基线才允许进入后续归档或下线决策

回滚窗口说明：
- 当前状态：未关闭；由于真实云服务器上的 cutover 审核、正式部署演练与 legacy 回滚演练尚未执行，窗口继续保持打开
- 开启条件：开始在真实云服务器执行正式 cutover、正式部署演练或 legacy 回滚演练
- 关闭条件：正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练全部通过并形成可追溯记录，且 `phase16-04` 最终结论被改写为 `通过`
- 窗口关闭前，所有 legacy 资产一律维持 `rollback-only` 身份，不进入删除、归档或退出执行

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
- GitHub Release 正式部署包已成为唯一正式云端部署来源；legacy GHCR 镜像与 legacy deployment artifact 只保留 `rollback-only`
- `Rento-legacy` 的职责已冻结为只读历史备份与对照参考，不参与当前仓库的部署或回滚入口
- legacy 基线的保留条件、退出条件与 cutline 解释已收口到单一部署说明入口
- `phase16` 当前轮最终结论固定为 `未通过但单值化`：当前未发现新的源码层 parity 缺口，但真实云服务器上的正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练尚未执行，因此仍存在 `cutover-blocker`
