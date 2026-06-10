# architecture_map.md

> 职责：仓库结构、模块职责、运行时入口与正式/legacy 落点说明。
> 阶段状态只看 `plan.md`，硬规则只看 `project_rules.md`，方法论只看 `global_skills.md` 与 `project_skills.md`。

## 1. 当前结构判断
- 当前仓库已完成 `Rento -> Rento-miniX` 原地重构主线切换，后续开发继续在同一仓库内推进。
- `Rento-miniX` 是唯一正式主线；旧 `Rento` 相关页面、API 与部署资产继续保留为只读参考 / 差异对照资产。
- 本文件只回答“代码和资产放在哪里、谁承担什么职责、哪些是正式主线、哪些是 legacy 参考”，不重复承载阶段流水账。

## 2. 正式运行时落点
### 前端正式宿主
- `src/minix/`
- 职责：正式前端路由、运行时布局、登录守卫、页面级宿主适配与纯新主线页面入口。

### 后端正式宿主
- `server/`
- 职责：统一 Hono 宿主、`/api/*` 路由、中间件、错误出口、静态资源托管与健康检查入口。

### 共享业务与数据访问层
- `src/lib/domain/`
- 职责：正式主链业务语义与共享领域服务。
- `src/lib/prisma.ts`
- 职责：Prisma Client 单例入口。
- `src/lib/transaction-manager.ts`
- 职责：正式事务边界承接位。
- `src/lib/queries.ts`、`src/lib/optimized-queries.ts`、`src/lib/dashboard-queries.ts`、`src/lib/search-queries.ts`
- 职责：正式查询、兼容查询与治理查询承接位。

### 页面与通用组件复用层
- `src/components/pages/`
- 职责：页面主体表达与页面装配复用模块。
- `src/components/business/`
- 职责：业务组件与主链交互单元。
- `src/components/layout/`
- 职责：导航、外壳与布局复用。
- `src/components/ui/`
- 职责：基础 UI 组件。

### 数据模型与静态资源
- `prisma/`
- 职责：`schema.prisma`、迁移链与数据库结构定义。
- `public/`
- 职责：静态资源、PWA manifest、service worker 与公共文件。

### 正式部署与交付资产
- `deploy/caddy/`
- 职责：正式 Caddy 配置。
- `deploy/systemd/`
- 职责：正式 systemd 服务定义。
- `scripts/start-minix.mjs`
- 职责：正式主线服务端启动入口。
- `scripts/health-check.sh`
- 职责：正式健康检查脚本。
- `scripts/prepare-release-host.sh`、`scripts/deploy-release-on-server.sh`、`scripts/pull-release-deploy-bundle.sh`
- 职责：正式 release bundle 部署链路。

## 3. legacy 参考落点
### 旧前端与旧 API 宿主
- `src/app/`
- 职责：旧页面与旧 API 的源码参考基线、差异对照输入与待归档候选区域。
- 说明：不再作为新增正式前端宿主或新增正式业务 API 的默认落点。

### 旧运行脚本与容器化入口
- `scripts/dev-entry.mjs`
- 职责：旧 `Next.js` 开发入口参考。
- `scripts/start-entry.mjs`
- 职责：旧 `Next.js` 生产启动入口参考。
- `docker-compose.yml`
- 职责：旧容器化运行线编排参考。
- `nginx/nginx.conf`
- 职责：旧容器化 HTTPS 代理参考。
- `scripts/cloud-deploy.sh`、`scripts/bootstrap-deploy-assets.sh`
- 职责：旧部署链路参考。

### legacy 边界
- 以上资产只承担历史实现参考、差异对照与后续归档前审计职责。
- 是否归档或移除 legacy 资产，交由后续独立治理任务决定，不在普通 fix 中处理。

## 4. 根目录结构
```text
Rento/
├── src/
│   ├── app/                # legacy 页面与 legacy API 参考基线
│   ├── components/         # 正式/迁移复用组件
│   ├── lib/                # 共享业务语义、数据访问、查询与工具
│   └── minix/              # 正式前端宿主
├── server/                 # 正式 Hono 宿主
├── prisma/                 # Prisma schema 与迁移链
├── public/                 # 静态资源与 PWA 资源
├── deploy/                 # 正式部署资产
├── scripts/                # 正式与 legacy 脚本并存区
├── docs/                   # 阶段文档、fix 文档与归档入口
├── nginx/                  # legacy 代理配置参考
├── README.md               # 项目总览
├── DEPLOYMENT.md           # 正式部署真相源
├── DEPLOY_RUNBOOK.md       # 操作手册
├── AGENTS.md               # 入口摘要与协作约束
├── plan.md                 # 阶段路线图与状态
├── project_rules.md        # 硬规则与门禁
├── global_skills.md        # 通用方法论
├── project_skills.md       # 项目专属经验
└── architecture_map.md     # 当前文件
```

## 5. 文档与执行资产落点
- `docs/phase*_architecture_plan.md`
- 职责：说明某个 `phase` 的整体目标、边界、设计取舍与为什么要拆成该阶段。
- `docs/phase*_dev_plan.md`
- 职责：说明某个 `phase` 的子任务集合、执行顺序、DoD 与实现边界。
- `docs/phase*_shared_baseline.md`
- 职责：冻结某个 `phase` 的共享基线、分类口径、矩阵或统一判断依据。
- `docs/fix/fix_*_issue_*.md`
- 职责：记录 fix 的问题现象、复现路径、影响面与初步观察。
- `docs/fix/fix_*_analysis_*.md`
- 职责：记录 fix 的根因分析、证据链、候选方案、推荐方案、验收标准与回滚条件。
- `.trae/specs/`
- 职责：承接已批准的 `phase` 子任务或 fix 修复项的 `/spec` 产物。
- `phase` 子任务 spec 目录默认命名：
  - `.trae/specs/phaseX-<workflow>-<nn>-<task-name>/`
  - 示例：`.trae/specs/phase16-parity-verification-cutover-and-legacy-exit-04-legacy-exit-decision-and-root-sync/`
- `fix` 修复项 spec 目录默认命名：
  - `.trae/specs/fix-<nn>-<task-name>/`
  - 示例：`.trae/specs/fix-014-prisma-browser-bundle-boundary-leak/`
- 命名含义：
  - `phaseX` 或 `fix-<nn>`：标识该 spec 从属的推进单元
  - `<workflow>`：沿用 `plan.md` / `docs/phase*` 中已冻结的阶段工作流命名
  - `<nn>`：对应 `dev_plan` 子任务编号或 fix 编号
  - `<task-name>`：使用稳定、可读、kebab-case 的英文短语

## 6. 代码阅读顺序
- 看正式前端：从 `src/minix/`、`src/components/` 开始。
- 看正式后端：从 `server/`、`src/lib/domain/`、`src/lib/prisma.ts` 开始。
- 看查询与数据边界：从 `src/lib/queries*`、`src/lib/transaction-manager.ts`、`prisma/schema.prisma` 开始。
- 看部署主线：从 `DEPLOYMENT.md`、`deploy/`、`scripts/prepare-release-host.sh`、`scripts/deploy-release-on-server.sh` 开始。
- 看 legacy 参考：按需查看 `src/app/`、`docker-compose.yml`、`nginx/nginx.conf` 与旧入口脚本。
