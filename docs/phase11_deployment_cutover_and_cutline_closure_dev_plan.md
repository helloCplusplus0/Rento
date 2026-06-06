# Phase11 Deployment Cutover And Cutline Closure 开发规划

## 当前状态
- `phase11` 的开发规划已完成当前轮产出，继续作为 `phase11` 的顺序执行蓝图与收口参考。
- 本文档只负责拆分任务、定义顺序、DoD 与验证要求，不替代：
  - [phase11_deployment_cutover_and_cutline_closure_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md)
  - [phase11_deployment_cutover_and_cutline_closure_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md)
- `phase11` 当前已进入已批准 spec 的顺序实现；`phase11-02` 已完成正式部署资产基线落位，`phase11-03` 已完成环境模板、健康检查与发布门禁的当前轮收口，`phase11-04` 已完成 legacy 回滚基线降级、保留条件、退出条件与 `Rento-legacy` 边界收口，后续继续推进 `phase11-05`。

## 一、文档定位
本文档用于把 `phase11-deployment-cutover-and-cutline-closure` 拆分为顺序执行的子任务，确保仓库先把正式部署主线、服务端产物链、环境模板、健康检查、发布门禁与 legacy 回滚基线解释清楚，再进入具体实现。

## 二、总体推进结论
`phase11` 的固定顺序为：

```text
先收口服务端预构建产物链与正式启动口径
    ->
再冻结 Caddy + systemd 正式部署基线
    ->
再冻结环境模板、健康检查与发布门禁
    ->
再冻结 legacy 回滚基线与 cutline 退出条件
    ->
最后收口文档一致性、部署演练记录与最终审核链路
```

原因如下：
- 若不先收口服务端产物链，后续 `systemd` 启动入口仍会建立在源码运行基础上。
- 若不先冻结正式部署拓扑，环境模板、健康检查和发布门禁会继续漂移。
- 若不先把 legacy 运行线单独降级，根级文档与回滚职责会继续混写。
- 若不把部署演练与文档一致性放到最后，阶段收口后仍会残留“能描述、不能执行”的治理风险。

## 三、任务拆分建议
## phase11-01-production-runtime-artifact-and-startup-closure
### 目标
收口正式部署主线所需的服务端预构建产物链、联合构建命令与正式生产启动入口，使 `Rento-miniX` 满足“云端不构建，只运行预构建产物”的部署底线。

### 范围
- 盘点 `package.json` 中 `build:minix`、`start:minix`、`dev:minix` 的当前职责
- 明确 `scripts/start-minix.mjs` 与 `server/index.ts` 的正式生产关系
- 冻结服务端产物输出策略与正式启动入口
- 冻结开发态 `tsx watch` 与生产态预构建产物的职责分离

### 参考来源
- `package.json`
- `scripts/start-minix.mjs`
- `scripts/dev-minix.mjs`
- `server/index.ts`
- `server/app.ts`
- `server/lib/static.ts`
- `tsconfig.json`
- Context7 / Hono Node 文档

### 不在范围内
- 不新增 `Caddy` / `systemd` 配置实现
- 不切换最终部署主线
- 不调整业务 API 或领域服务语义

### DoD
- 服务端预构建产物链方案完整可解释
- 正式生产启动入口不再依赖 `tsx` 直接跑源码
- 开发态与生产态脚本职责边界清楚

### 验证要求
- 确认文档与当前脚本现状一致，不虚构已存在的服务端产物链
- 确认“云端不构建”与正式启动口径保持一致

## phase11-02-caddy-and-systemd-deployment-baseline
### 目标
冻结 `Caddy + systemd + Hono + PostgreSQL` 正式部署拓扑、配置资产边界、服务命名与端口职责，形成单一正式部署基线。

### 范围
- 冻结 `Caddy` 的职责：公网入口、HTTPS、反向代理
- 冻结 `systemd` 的职责：单一 Hono 守护进程
- 冻结内部端口与工作目录口径
- 冻结正式部署资产的目录承接位与命名规则

### 参考来源
- `server/index.ts`
- `server/lib/static.ts`
- `DEPLOYMENT.md`
- Context7 / Caddy 文档
- Context7 / systemd 文档
- legacy 运行线部署资产集合

### 不在范围内
- 不继续扩写 `docker-compose + nginx`
- 不引入 `redis` 作为正式主线依赖
- 不切换数据库主线

### DoD
- 正式部署拓扑单一且可解释
- `Caddy`、`systemd`、Hono 三者职责不重叠
- 正式部署资产承接位明确

### 当前实现承接位
- `deploy/caddy/Caddyfile`
- `deploy/systemd/rento-minix.service`

### 验证要求
- 确认部署拓扑与 `server/` 当前承接位一致
- 确认正式部署资产与 legacy 运行资产的边界不冲突

## phase11-03-env-template-health-and-release-gate-closure
### 目标
冻结正式环境模板、健康检查、迁移入口与发布门禁，使部署切线具备统一执行口径。

### 范围
- 冻结 `.env.example` 的正式变量矩阵
- 冻结 `AUTH_SESSION_SECRET`、`NEXTAUTH_SECRET`、`NEXTAUTH_URL`、`ALLOWED_ORIGINS`、`DATABASE_URL`、`MINIX_SERVER_PORT` 等正式变量角色
- 冻结 `/api/health` 的主健康入口地位
- 冻结发布前最低工程验证与业务 smoke 要求
- 继承 `phase10` 的迁移兼容边界

### 参考来源
- `.env.example`
- `server/lib/env.ts`
- `scripts/health-check.sh`
- `scripts/migrate-and-seed.sh`
- `docs/phase10_data_access_and_migration_closure_shared_baseline.md`

### 不在范围内
- 不重写认证设计
- 不重新定义迁移兼容边界
- 不直接执行生产切线

### DoD
- 正式环境模板口径完整
- 健康检查、迁移入口与发布门禁形成单一解释
- 不再存在“文档一套、脚本一套、实现一套”的环境与健康检查口径漂移

### 验证要求
- 复核变量名、脚本和文档路径真实存在
- 确认 `phase10` 的 `migrate deploy` / `db push` 边界被原样继承
- 确认 `.env.example`、`scripts/health-check.sh`、`DEPLOYMENT.md`、`README.md`、`architecture_map.md` 与 `docs/phase11_*` 之间不存在口径漂移

## phase11-04-legacy-runtime-demotion-and-rollback-baseline
### 目标
把旧容器化运行线明确降级为 legacy 回滚基线，写清保留条件、退出条件与不得继续扩写的边界。

### 范围
- 盘点 legacy 回滚资产集合
- 冻结 legacy 回滚职责边界
- 冻结 cutline 退出条件与保留条件
- 冻结 `Rento-legacy` 的职责边界

### 参考来源
- `docker-compose.yml`
- `nginx/nginx.conf`
- `scripts/cloud-deploy.sh`
- `scripts/bootstrap-deploy-assets.sh`
- `scripts/start-entry.mjs`
- `README.md`
- `DEPLOYMENT.md`

### 不在范围内
- 不直接删除 legacy 资产
- 不把 `Rento-legacy` 重新引入为并行部署入口
- 不扩写 legacy 容器化运行线为正式主线

### DoD
- legacy 回滚资产清单完整
- 回滚职责边界、保留条件与退出条件明确
- `Rento-legacy` 已明确固定为 GitHub 侧只读历史备份与对照参考
- 不再存在“正式主线”和“legacy 基线”混写状态

### 验证要求
- 复核所有 legacy 资产路径真实存在
- 确认根级真相源与 `DEPLOYMENT.md` 的 legacy 表述一致
- 确认 legacy 基线未被重新写成默认部署入口、默认运维入口或第二真相源

## phase11-05-documentation-consistency-and-deployment-rehearsal-closure
### 目标
收口顶层真相源、阶段文档、部署说明、验证清单与部署演练记录，形成“`phase11` 阶段文档与已批准 spec 实现保持一致”的稳定状态。

### 范围
- 复核：
  - `AGENTS.md`
  - `plan.md`
  - `architecture_map.md`
  - `project_rules.md`
  - `README.md`
  - `DEPLOYMENT.md`
- 复核三份 `docs/phase11_*` 的互链与阶段状态
- 冻结文档最小验证要求
- 冻结后续 `/spec` 的最低验证命令与部署演练记录要求

### 参考来源
- 顶层真相源
- `docs/phase11_*`
- `docs/phase10_*`
- `DEPLOYMENT.md`

### 不在范围内
- 不直接进入 `/spec`
- 不新增部署实现代码
- 不在本子任务中执行正式切线

### DoD
- 顶层真相源与阶段文档状态一致
- 三份 `docs/phase11_*` 已齐备且互相引用正确
- 正式部署主线、legacy 回滚基线、验证命令与后续 `/spec` 输入已形成闭环

### 验证要求
- 若本轮仅涉及文档，至少完成文档互链与路径存在性复核
- 记录后续实施阶段必须执行的最低工程验证命令与部署演练要求

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase11-01-production-runtime-artifact-and-startup-closure
phase11-02-caddy-and-systemd-deployment-baseline
phase11-03-env-template-health-and-release-gate-closure
phase11-04-legacy-runtime-demotion-and-rollback-baseline
phase11-05-documentation-consistency-and-deployment-rehearsal-closure
```

## 五、默认路线约束
`phase11` 的全部子任务都必须遵守：
- 默认继续把 `Caddy + systemd + Hono + PostgreSQL` 视为正式部署主线
- 默认继续把 Hono 视为 `/api/*` 与 `dist/` 静态壳的唯一应用级承接位
- 默认继续把 PostgreSQL 视为唯一正式数据库主线
- 默认继续继承 `phase10` 已冻结的迁移兼容边界
- 默认继续把旧容器化运行线视为 legacy 回滚基线，而不是正式主线
- 默认不新增新的主链领域迁移范围，不切回 `Rento-legacy`，不重做 UI
- 默认由用户审核 `phase11` 阶段文档；审核通过前不进入 `/spec` 或部署切线实现

## 六、当前轮收口输出
- `phase11` 阶段级文档固定为：
  - `docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md`
  - `docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md`
  - `docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md`
- 若本轮仅涉及文档，最小验证要求至少包括：
  - 三份 `docs/phase11_*` 互链复核
  - 被引用文档、脚本与代码路径存在性复核
  - 顶层真相源与 `DEPLOYMENT.md` 状态一致性复核
- `phase11-04` 当前轮已额外收口：
  - legacy 回滚资产清单与统一身份说明
  - legacy 基线保留条件、退出条件与不得继续扩写的边界
  - `Rento-legacy` 只读备份边界与非部署/非回滚入口说明
- 后续进入实现或部署演练前，最低工程验证要求固定为：
  - `npm run lint`
  - `npm run type-check`
  - `npm run build:minix`
  - `npm run audit:phase09:legacy-routes`
  - 条件允许时执行 `npm run smoke:phase09:all`
