# Rento-miniX

Rento-miniX 是一个面向房东和运营者的私有化租赁管理后台重构主线，目标是在保留当前 `Rento` 业务骨架、UI 展示效果与主链规则的前提下，完成轻量化、低部署门槛的原地重构。

## 当前状态
- 当前仓库已经从原 `Rento` 主仓切换为 `Rento-miniX` 主线仓。
- 原 `Rento` 已通过 GitHub import 方式保留为备份仓：[`Rento-legacy`](https://github.com/helloCplusplus0/Rento-legacy)。
- 当前本地目录仍位于 `/home/dell/Projects/Rento`，但逻辑主线已切换到 `Rento-miniX`。
- 当前仓库的 `git origin` 已收口到 `https://github.com/helloCplusplus0/Rento-miniX.git`，后续提交与实现默认只围绕当前主仓展开。
- `phase07-app-shell-and-runtime-foundation` 已完成阶段收口：新前端应用壳、新运行时入口、旧运行线映射与退出条件已冻结为后续阶段上游输入。
- `phase08-api-and-auth-foundation` 已完成阶段收口：统一 API 宿主、认证门禁、错误处理、环境变量“新主旧兼”口径与最小页面守卫已冻结为后续阶段上游输入。
- `phase09-domain-service-migration` 已完成当前轮子任务收口：共享领域服务落点、正式宿主边界、主链 smoke 路径、旧 `src/app/api/*` compat wrapper 清单与 `phase10` 上游输入已冻结。
- `phase10-data-access-and-migration-closure` 已完成阶段文档与 `phase10-01 ~ phase10-05` `/spec` 收口：长期数据访问层方案、查询分层、事务边界、迁移兼容项、最低验证要求与 `phase11` 最小上游输入已冻结。
- `phase11-deployment-cutover-and-cutline-closure` 已完成 `phase11-01 ~ phase11-05` 当前轮已批准 spec 收口：`deploy/caddy/Caddyfile`、`deploy/systemd/rento-minix.service`、`.env.example`、`scripts/health-check.sh`、`/api/health`、文档最小验证要求与部署/回滚演练记录要求已收口到统一部署口径。
- `phase14-api-query-parity-and-legacy-route-drain` 已完成 `phase14-01 ~ phase14-07` 当前轮收口：正式业务 API/query 已迁入统一 Hono 宿主，旧 `src/app/api/*` 中已不存在承担正式业务主职责的 retained-legacy 路由。
- `phase15-minix-pwa-and-runtime-parity` 已完成当前轮收口：纯新主线 `manifest`、`service worker`、安装/更新提示、最小离线兜底、静态头与 PWA smoke 口径已收口到 `Vite + Hono` 主线，并已补齐当前轮工程验证、独立审核与本地人工验收记录。
- `phase16-parity-verification-cutover-and-legacy-exit` 已完成当前轮 `/plan`、`phase16-01` 证据盘点、`phase16-02` 自动化验证、`phase16-03` 源码层对齐复核，以及 `phase16-04` 当前轮任务 `1 ~ 4` 的 legacy-exit 决策与 root sync；四类 parity matrix 固定落位到 `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`，过程记录固定落位到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`，当前轮最终结论固定为 `未通过但单值化`。
- 正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练尚未在当前环境执行；由于当前开发环境不具备真实云服务器与公认 HTTPS 条件，这三类记录已明确延后到真实云服务器执行，不伪造“已完成”结果。

## 项目定位
- 产品定位固定为受控私有部署的租赁管理后台，不面向公网匿名访问。
- 核心业务链继续覆盖房源、租客、合同、账单、仪表与抄表。
- 当前 `Rento` 前端 UI 展示效果已符合预期，`Rento-miniX` 默认承接该展示效果，非必要不擅自改变。
- 任何迁移操作都必须以旧 `Rento` 源代码为直接原型；除已批准的最小技术适配外，接近 `100%` 还原旧页面的信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义，是验收通过的硬门槛之一。
- 数据库主线继续固定为 PostgreSQL，不因轻量化而回退到 SQLite。

## 重构目标
- 移除当前 `Next.js + Redis + Docker-heavy` 运行形态带来的部署门槛，并逐步退出旧 `src/app` / `src/app/api/*` 宿主依赖。
- 当前冻结的正式目标方案为：`React + Vite + Hono + Prisma + PostgreSQL + Caddy + systemd`。
- 保持合同、账单、支付周期、多仪表、删除门禁、历史保留等主链语义不失真。
- 当前 `Prisma + PostgreSQL` 继续作为正式数据访问主线保留；是否替换 Prisma 只作为后续条件成熟后的独立议题评估，不进入当前默认路线图。
- 默认坚持云端不构建，只运行预构建产物。

## 部署状态
- 当前正式部署目标已冻结为：`Caddy + systemd + Hono + PostgreSQL`。
- 当前 GitHub 发布链已切换为：`.github/workflows/release-deploy-bundle.yml` 负责执行 `npm run build:minix:pwa`、校验 `dist/` 与 `build/minix-server/`，并把 PWA-enabled 部署包上传为 GitHub Release asset；推送 `main` 会自动生成 `prerelease deploy bundle`，推送 `v*` tag 会自动生成正式 release bundle，`workflow_dispatch` 保留为基于当前选定 ref 的手工正式发包入口。
- 当前云服务器正式部署路径已切换为：从 GitHub Release 拉取正式部署包到 `/opt/rento-minix/current`，放置私有环境文件 `/etc/rento-minix/rento-minix.env`，随后刷新 `systemd` 与 `Caddy`；服务器不执行 build。
- `main` 自动生成的 `prerelease deploy bundle` 也按 PWA-enabled 口径构建，用于快速验证、预演练与待验收环境；正式部署默认仍使用 `v*` 正式 release bundle。
- 当前操作者入口已拆分为：`DEPLOYMENT.md` 负责治理真相源，`DEPLOY_RUNBOOK.md` 负责简洁操作手册；服务器准备与正式部署分别由 `scripts/prepare-release-host.sh`、`scripts/deploy-release-on-server.sh` 承接，`scripts/pull-release-deploy-bundle.sh` 退为底层拉包脚本。
- 正式部署资产基线已落位到 `deploy/caddy/` 与 `deploy/systemd/`，分别承接公网入口与 Hono 守护进程配置。
- `.env.example` 已升级为正式共享模板，默认变量矩阵与 `server/lib/env.ts`、`scripts/start-minix.mjs` 保持一致。
- 若 `phase13` 过渡期仍需从 `src/minix` 打开 legacy 二级详情/新建/治理页，应在本地或过渡环境显式配置 `VITE_LEGACY_APP_ORIGIN`；未配置时，`dev:minix` 仅保证已迁移的一级正式页面可验收。
- `/api/health` 继续作为唯一主健康入口；`scripts/health-check.sh` 默认优先命中 `NEXTAUTH_URL`，否则回退到 `MINIX_SERVER_HOST:MINIX_SERVER_PORT`。
- `scripts/migrate-and-seed.sh` 继续原样继承 `phase10` 已冻结的 `migrate deploy` / `db push` 兼容边界，并同时兼容容器回滚线与 `/opt/rento-minix/current` 正式主线目录。
- 当前正式部署包默认包含：PWA-enabled 的 `dist/`、`build/minix-server/`、运行时 `node_modules/`、`prisma/`、`deploy/`、`.env.example`、`package.json`、`package-lock.json` 与正式启动/健康检查/迁移/拉包脚本。
- 当前 legacy 回滚基线仍是旧 `docker-compose + nginx` 容器化运行线，其资产清单固定为 `docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh`、`scripts/bootstrap-deploy-assets.sh`、`scripts/start-entry.mjs` 以及历史镜像、容器、`nginx`、`redis` 变量口径；其中历史 `Next.js standalone` 直接启动入口继续由 `scripts/start-entry.mjs` 保留，而 rollback-only GHCR 镜像已切换为构建当前可用的 `minix` 产物链，以维持 CI/CD 与回滚镜像产出连续性。
- legacy 基线只承担历史运行参考、故障回滚与差异对照职责，不再作为默认部署入口、默认运维入口或正式真相源。
- legacy 基线当前已统一降级为 `rollback-only`；legacy GHCR 镜像、legacy deployment artifact 与 `scripts/bootstrap-deploy-assets.sh` 都不得再被描述为正式入口；在正式部署主线、发布门禁、正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练完成并通过审核前继续保留，本轮不直接删除 legacy 资产。
- 当前回滚窗口保持打开；只有在真实云服务器补齐上述三类记录并把 `phase16` 当前轮结论改写为 `通过` 后，legacy 资产才允许进入归档或退出判断。
- `phase11-05` 已冻结：若本轮仅涉及 `phase11` 文档，至少完成 `docs/phase11_*` 互链复核、被引用路径存在性复核与根级真相源状态复核；若进入后续实施、演练或发布验证，最低工程验证命令固定为 `npm run lint`、`npm run type-check`、`npm run build:minix`、`npm run audit:phase09:legacy-routes`，并在条件允许时执行 `npm run smoke:phase09:all`。
- 上述 `build:minix` 属于阶段级历史最小验证门槛，不改写“GitHub Release 部署包默认按 `npm run build:minix:pwa` 构建”的当前正式口径。
- 后续部署/回滚演练记录至少需要包含演练时间、目标环境、执行命令、健康检查结果、主链 smoke 结果、回滚触发条件与最终结论，并明确标注“正式主线验证”或“legacy 回滚验证”。
- 根级 [DEPLOYMENT.md](file:///home/dell/Projects/Rento/DEPLOYMENT.md) 现在负责承接正式部署主线说明，并同时记录 legacy 回滚基线的保留边界。
- 根级 [DEPLOY_RUNBOOK.md](file:///home/dell/Projects/Rento/DEPLOY_RUNBOOK.md) 现在负责承接首次部署、升级部署、健康检查与回滚入口的实际操作步骤。
- `Rento-legacy` 只承担 GitHub 侧只读历史对照与备份职责，不作为部署入口、回滚入口、默认 remote、默认上游或第二真相源。

## 当前阅读入口
- [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md)：项目入口摘要与执行总约束
- [project_rules.md](file:///home/dell/Projects/Rento/project_rules.md)：刚性规则、门禁与禁止事项
- [architecture_map.md](file:///home/dell/Projects/Rento/architecture_map.md)：当前仓库结构、运行形态与重构承接位
- [plan.md](file:///home/dell/Projects/Rento/plan.md)：整体阶段总览与当前默认入口
- [DEPLOYMENT.md](file:///home/dell/Projects/Rento/DEPLOYMENT.md)：正式部署主线、cutover 审核与 legacy 回滚基线说明
- [DEPLOY_RUNBOOK.md](file:///home/dell/Projects/Rento/DEPLOY_RUNBOOK.md)：面向操作者的简洁部署手册
- [phase06_minix_replatform_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_architecture_plan.md)：`phase06` 架构规划
- [phase06_minix_replatform_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_dev_plan.md)：`phase06` 开发规划
- [phase06_minix_replatform_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_shared_baseline.md)：`phase06` 共享基线
- [phase07_app_shell_and_runtime_foundation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_architecture_plan.md)：`phase07` 架构规划
- [phase07_app_shell_and_runtime_foundation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_dev_plan.md)：`phase07` 开发规划
- [phase07_app_shell_and_runtime_foundation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_shared_baseline.md)：`phase07` 共享基线
- [phase08_api_and_auth_foundation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_architecture_plan.md)：`phase08` 架构规划
- [phase08_api_and_auth_foundation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_dev_plan.md)：`phase08` 开发规划
- [phase08_api_and_auth_foundation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_shared_baseline.md)：`phase08` 共享基线
- [phase09_domain_service_migration_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_architecture_plan.md)：`phase09` 架构规划
- [phase09_domain_service_migration_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_dev_plan.md)：`phase09` 开发规划
- [phase09_domain_service_migration_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_shared_baseline.md)：`phase09` 共享基线
- [phase10_data_access_and_migration_closure_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_architecture_plan.md)：`phase10` 架构规划
- [phase10_data_access_and_migration_closure_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_dev_plan.md)：`phase10` 开发规划
- [phase10_data_access_and_migration_closure_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_shared_baseline.md)：`phase10` 共享基线
- [phase11_deployment_cutover_and_cutline_closure_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md)：`phase11` 架构规划
- [phase11_deployment_cutover_and_cutline_closure_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md)：`phase11` 开发规划
- [phase11_deployment_cutover_and_cutline_closure_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md)：`phase11` 共享基线
- [phase12_frontend_parity_and_shell_cutover_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md)：`phase12` 架构规划
- [phase12_frontend_parity_and_shell_cutover_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md)：`phase12` 开发规划
- [phase12_frontend_parity_and_shell_cutover_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md)：`phase12` 共享基线
- [phase13_frontend_page_parity_implementation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_architecture_plan.md)：`phase13` 架构规划
- [phase13_frontend_page_parity_implementation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_dev_plan.md)：`phase13` 开发规划
- [phase13_frontend_page_parity_implementation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_shared_baseline.md)：`phase13` 共享基线
- [phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md)：`phase14` 架构规划
- [phase14_api_query_parity_and_legacy_route_drain_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md)：`phase14` 开发规划
- [phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md)：`phase14` 共享基线
- [phase15_minix_pwa_and_runtime_parity_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase15_minix_pwa_and_runtime_parity_architecture_plan.md)：`phase15` 架构规划
- [phase15_minix_pwa_and_runtime_parity_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase15_minix_pwa_and_runtime_parity_dev_plan.md)：`phase15` 开发规划
- [phase15_minix_pwa_and_runtime_parity_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md)：`phase15` 共享基线
- [phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md)：`phase16` 架构规划
- [phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md)：`phase16` 开发规划
- [phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md)：`phase16` 共享基线

## 当前说明
- 仓库内原有的 `Rento-miniX/` 目录已在完成内容吸收与引用复核后删除，不再作为长期真相源或临时输入目录保留。
- `phase06`、`phase07`、`phase08`、`phase09` 与 `phase10` 已完成当前轮阶段收口；后续默认以上游冻结结论作为 `phase11` 输入，不再回退到“先补顶层边界还是先做实现”的不确定状态。
- `phase11-05` 已进一步把顶层真相源、`DEPLOYMENT.md`、`docs/phase11_*`、最低工程验证命令与部署/回滚演练记录要求收口为单一闭环。
- `phase12-05` 已把“是否继续沿用旧 UI 设计语言”收口为单一答案；后续 `phase12 ~ phase16` 默认直接沿用当前 `Rento` 页面信息结构、组件表达、导航节奏与整体视觉风格，除非出现明确技术障碍，否则不重做设计。
- 当前已完成 `phase13` 当前轮收口：`phase13-05` 已完成最终复核，`phase13-06` 与 `phase13-07` 已完成首页 `/` 与 `/bills/stats` 尾项收口；后续默认进入 `phase14` 的 retained-legacy API/query drain 规划。
- 当前已完成 `phase14` 当前轮收口：route inventory 分类、正式宿主清单、真实 API/query drain、compat 保留边界与顶层真相源已形成单一结论；后续阶段不再承接正式业务 API 迁移职责。
- 当前已完成 `phase15` 当前轮收口：以 `docs/phase15_*`、`plan.md` 与 `phase05/11/13/14` 的上游输入为真相源，纯新主线 PWA parity 已形成单一结论。
- 当前已进入 `phase16` 当前轮实施阶段：`phase16-01` 已完成证据入口收口、四类 parity matrix 回填与根级真相源一致性复核，`phase16-02` 已完成固定自动化验证，`phase16-03` 当前轮已完成源码层对齐复核与 cutover 审核包字段冻结；后续默认先在真实云服务器补齐正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练，再进入 `phase16-04` 的 legacy 退出判断。
- 当前默认路线图继续固定为以下阶段顺序：
  - `phase12-frontend-parity-and-shell-cutover`
  - `phase13-frontend-page-parity-implementation`
  - `phase14-api-query-parity-and-legacy-route-drain`
  - `phase15-minix-pwa-and-runtime-parity`
  - `phase16-parity-verification-cutover-and-legacy-exit`
- `Rento-legacy` 只承担旧主线历史备份与只读对照参考职责，不作为当前阶段默认 remote、推送目标或文档真相源。
- 原容器化部署链仍作为当前存量运行线的可运行基线与回滚参考保留，保留目的仅限历史运行参考、故障回滚与差异对照，不自动等同于 `Rento-miniX` 的正式部署主线。
- legacy 基线未来只有在正式部署主线、发布门禁、部署演练与回滚验证全部通过审核，且替代真相源与回滚记录冻结后，才允许进入后续退出决策。
- 当前 remote 收口边界固定为：主动开发默认只保留 `origin -> Rento-miniX`；若需查看旧主线材料，应按临时只读参考处理，不重新引入并行双 remote 工作流。
