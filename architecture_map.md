# architecture_map.md

## 1. 仓库总览
Rento 当前是一个 `Next.js 15 + React 19 + Prisma + PostgreSQL + Redis + Nginx` 的单仓库全栈应用。目录以“前端页面 + App Router API + Prisma 数据层 + 容器部署脚本”为主。

## 2. 根目录结构
```text
Rento/
├── src/                    # 应用源码
├── prisma/                 # Prisma schema 与迁移
├── scripts/                # 运行、部署、初始化脚本
├── docs/                   # 当前分析文档、fix 文档与归档文档
├── public/                 # 静态资源
├── nginx/                  # 反向代理配置
├── backups/                # 运行时备份目录（本地/容器挂载）
├── logs/                   # 运行时日志目录（本地/容器挂载）
├── AGENTS.md               # 顶层执行规范
├── project_rules.md        # 刚性规则与门禁
├── architecture_map.md     # 当前文件，仓库结构地图
├── plan.md                 # 当前阶段计划与验收
├── README.md               # 项目总览
├── QUICK_START.md          # 快速启动
├── DEPLOYMENT.md           # 部署说明
├── ENVIRONMENT_GUIDE.md    # 环境变量与配置说明
├── docker-compose.yml      # 容器编排
└── .env.example            # 环境模板
```

## 3. `src/` 模块分层
### `src/app`
- `src/app/page.tsx`：工作台首页入口。
- `src/app/rooms`、`renters`、`contracts`、`bills`：核心业务页面。
- `src/app/add/*`：新增房间、合同等创建入口。
- `src/app/api/*`：App Router Route Handlers，承载后端 API。
- `src/app/login/page.tsx`：管理员登录页。
- `src/app/settings`：正式业务设置入口。
- `src/app/system-health`、`data-consistency`：运维治理页，保留直达路由但不应与正式业务导航等价暴露。
- `src/app/performance-*`、`layout-demo`、`components`、`business-flow-validation`：`dev-only` 辅助页面，最终分类矩阵与最小门禁策略见 `src/lib/page-governance.ts`。

### `src/components`
- `src/components/pages`：页面级组合组件。
- `src/components/business`：业务组件。
- `src/components/layout`：移动端/桌面端布局壳。
- `src/components/layout/AuxiliaryPageNotice.tsx`：辅助页面统一用途说明入口，按分类矩阵展示用途、保留理由与门禁口径。
- `src/components/ui`：基础 UI 组件。
- 当前 UI 风格是既有资产，后续以复用和微调为主。

### `src/lib`
- `prisma.ts`：Prisma Client 单例。
- `queries.ts`：核心查询封装。
- `api-error-handler.ts`：API 统一错误处理、CORS、请求体限制与认证接入点。
- `auth/session.ts`、`auth/password.ts`、`auth/guard.ts`：最小会话方案、密码校验与服务端守卫。
- `page-governance.ts`：辅助页面分类矩阵、最小门禁策略与访问决策真相源。
- `auto-bill-generator.ts`、`business-flow-validator.ts`、`health-checker.ts` 等：业务规则与运行治理能力。
- `optimized-queries.ts` 等文件包含性能优化尝试，但存在历史字段漂移问题，需持续治理。

### `src/hooks` / `src/types`
- 用量较小，承担局部交互与共享类型。

## 4. `prisma/` 结构说明
- `schema.prisma`：当前数据库主真相源，已固定为 PostgreSQL。
- `migrations/`：保留历史迁移；其中 `migration_lock.toml` 仍残留 SQLite 时代标记，当前只能作为历史兼容项存在，不能被误读为 PostgreSQL 正式迁移锁。
- `dev.db`：历史 SQLite 文件，已从主路径移除。

## 5. `scripts/` 结构说明
- `cloud-deploy.sh`：云服务器端到端部署入口。
- `migrate-and-seed.sh`：容器启动后的数据库同步与种子逻辑，当前含历史兼容分支。
- `health-check.sh`、`init-db.sh`：健康验证与数据库初始化辅助脚本。
- `scripts/archive/`：历史性脚本归档位置，例如 SQLite -> PostgreSQL 一次性迁移脚本。

## 6. `docs/` 结构说明
- `docs/` 根目录保留当前仍有参考价值的分析文档、策略文档和设计说明。
- `docs/fix/`：真实场景验证阶段的问题报告目录，存放 `fix_XXX_issue_<topic>.md` 与 `fix_issue_template.md`。
- `docs/fix/fix_analysis_template.md`：`analysis` 文档模板，用于固定根因、方案、影响面、数据修复策略、验收与回滚结构。
- `docs/fix/fix_XXX_analysis_<topic>.md`：单个问题的根因与方案分析文档，作为后续 `/spec` 的直接上游真相源。
- `phase03` 已完成当前阶段文档冻结与子任务收口。
- `phase04` 阶段文档已生成并保留为最近一轮已完成工作流的冻结记录：
  - `docs/phase04_performance_and_ops_architecture_plan.md`
  - `docs/phase04_performance_and_ops_dev_plan.md`
  - `docs/phase04_performance_and_ops_shared_baseline.md`
- `phase04-performance-and-ops-01` 至 `phase04-performance-and-ops-04` 已按顺序完成当前阶段收口；若需继续推进，当前应先回到新一轮 `/plan`，再决定是否进入新的 `phase*` 工作流。
- 当前默认已进入真实场景验证与 fix 闭环：问题先落 `issue` 文档，再落 `analysis` 文档，审核后才进入 `/spec`。
- `fix_008` 已在 `analysis` 层完成收口，结论为：移动端/PWA 议题已超出单个 fix 的局部修补边界，后续统一由 `phase05-pwa-delivery-*` 承接。
- `phase05` 候选阶段文档已生成并冻结：
  - `docs/phase05_pwa_delivery_architecture_plan.md`
  - `docs/phase05_pwa_delivery_dev_plan.md`
  - `docs/phase05_pwa_delivery_shared_baseline.md`
- 当前 `phase05-pwa-delivery-*` 已成为正式候选下一阶段，但尚未切换当前默认工作流。
- `docs/archive/tasks/`：历史 `task_*.md` 实施记录。
- `docs/archive/README.md`：归档说明与使用边界。
- 历史任务文档默认只读，不再代表当前执行计划。

## 7. 运行入口
- Web 应用入口：`src/app`。
- API 入口：`src/app/api/**/route.ts`。
- 页面门禁入口：`src/middleware.ts`。
- 辅助页面分类矩阵入口：`src/lib/page-governance.ts`。
- 辅助页面用途说明入口：`src/components/layout/AuxiliaryPageNotice.tsx`。
- 认证入口：`src/app/login/page.tsx` 与 `src/app/api/auth/**/route.ts`。
- 会话与守卫入口：`src/lib/auth/**`。
- 数据库入口：`prisma/schema.prisma`。
- 本地开发热加载入口：`package.json` 中的 `npm run dev`。
- 容器部署验证入口：`docker-compose.yml`。
- 云部署入口：`scripts/cloud-deploy.sh`。

## 8. 当前目录治理判断
- 当前主线目录结构整体可继续沿用，无需重做大规模源码搬迁。
- `phase02-auth-gate-*` 已完成，页面与核心 API 均已接入最小认证闭环。
- `phase04-performance-and-ops-01-*` 已冻结辅助页面的初始分类口径。
- `phase04-performance-and-ops-04 Task1` 已在 `src/lib/page-governance.ts` 固化最终分类矩阵：
  - `performance-*`、`layout-demo`、`components`、`business-flow-validation`：`dev-only`
  - `system-health`、`data-consistency`：运维治理
- `phase04-performance-and-ops-04 Task2` 已完成正式入口收口：
  - `dev-only` 页面已退出首页功能网格、默认快捷操作与正式设置页默认暴露
  - `system-health`、`data-consistency` 已收口到设置页的运维治理分组
- `phase04-performance-and-ops-04 Task3` 已完成统一门禁与说明接入：
  - `src/middleware.ts` 已消费 `page-governance.ts` 的访问决策，对 `dev-only` 页面执行开发环境限制
  - 保留辅助页面已通过 `AuxiliaryPageNotice` 显示用途、保留理由与门禁说明
- `phase04-performance-and-ops-*` 已完成当前阶段收口。
- 当前默认工作流已切换为真实场景验证与 fix 闭环：
  - 新问题先进入 `docs/fix/fix_XXX_issue_<topic>.md`
  - 完成根因与方案分析后进入 `docs/fix/fix_XXX_analysis_<topic>.md`
  - 经审核后再进入 `/spec`
- 若 fix 已超出局部修补边界，仍需以 `plan.md` 与 `AGENTS.md` 为准，回到新一轮 `/plan` 再决定后续工作流。

## 9. 已知结构债务
- `.env` 仍有历史跟踪痕迹，后续应完成真正的模板化与去跟踪化收口。
- SQLite 时代遗留仍体现在迁移锁、迁移 SQL、兼容脚本和少量注释中。
- `src/lib/validation.ts`、`src/lib/queries.ts` 与 `src/app/api/rooms/[id]/route.ts`、`src/app/api/contracts/[id]/route.ts`、`src/app/api/meters/[meterId]/route.ts` 仍存在“业务门禁已部分存在，但默认删除路径仍偏向物理删除”的张力。
- `src/lib/optimized-queries.ts` 仍存在字段漂移，当前已确认至少包括 `Room.rent` / `monthlyRent` 与 `Renter.idCard` / `idNumber` 的不一致。
- `src/lib/dashboard-queries.ts` 曾存在待收金额与趋势统计的历史语义漂移；`phase03` 已完成当前阶段口径收口，若后续再发现统计偏差，应进入新一轮 `/plan` 评估，而不是继续引用旧阶段待办。
- `scripts/migrate-and-seed.sh` 与 `prisma/migrations/migration_lock.toml` 当前仍承担迁移兼容层：
  - `migration_lock.toml` 仍指向 SQLite，说明现有迁移目录不是可直接在 PostgreSQL 上回放的正式迁移链
  - `migrate-and-seed.sh` 当前采用两级兜底：检测到 SQLite 锁时直接 `db push`；其余情况先 `migrate deploy`，失败后仍回退 `db push`
  - 该兼容层的当前作用是“保证 PostgreSQL 环境可按现状 schema 启动”，不是“提供正式、可审计、可回放的 PostgreSQL 迁移基线”
  - 正式退出条件至少包括：完成 PostgreSQL 基线方案、在空 PostgreSQL 库上验证通过、确认可替代 `db push` 兼容分支后，才能清理该历史路径
- 房间、合同、账单、仪表主链的删除门禁与状态约束仍需在服务端进一步加固。
- 关键列表接口与统计接口已完成当前阶段的数据库侧过滤、分页和聚合收口；若后续出现新的性能瓶颈，应通过新一轮 `/plan` 重新评估，而不是沿用旧阶段未完成表述。
- 辅助页面已完成分类、导航收口与最小门禁接入，但是否继续长期保留，仍需在后续阶段按开发辅助价值与维护成本继续评估。
