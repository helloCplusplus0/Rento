# architecture_map.md

## 1. 仓库总览
Rento 当前是一个 `Next.js 15 + React 19 + Prisma + PostgreSQL + Redis + Nginx` 的单仓库全栈应用。目录以“前端页面 + App Router API + Prisma 数据层 + 容器部署脚本”为主。

## 2. 根目录结构
```text
Rento/
├── src/                    # 应用源码
├── prisma/                 # Prisma schema 与迁移
├── scripts/                # 运行、部署、初始化脚本
├── docs/                   # 当前分析文档与归档文档
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
- `src/app/settings`、`system-health`、`data-consistency`：运维/治理页面。
- `src/app/performance-*`、`layout-demo`、`components`、`business-flow-validation`：开发辅助或治理辅助页面，后续需要进一步标记和门禁化。

### `src/components`
- `src/components/pages`：页面级组合组件。
- `src/components/business`：业务组件。
- `src/components/layout`：移动端/桌面端布局壳。
- `src/components/ui`：基础 UI 组件。
- 当前 UI 风格是既有资产，后续以复用和微调为主。

### `src/lib`
- `prisma.ts`：Prisma Client 单例。
- `queries.ts`：核心查询封装。
- `api-error-handler.ts`：API 统一错误处理、CORS、请求体限制与认证接入点。
- `auth/session.ts`、`auth/password.ts`、`auth/guard.ts`：最小会话方案、密码校验与服务端守卫。
- `auto-bill-generator.ts`、`business-flow-validator.ts`、`health-checker.ts` 等：业务规则与运行治理能力。
- `optimized-queries.ts` 等文件包含性能优化尝试，但存在历史字段漂移问题，需持续治理。

### `src/hooks` / `src/types`
- 用量较小，承担局部交互与共享类型。

## 4. `prisma/` 结构说明
- `schema.prisma`：当前数据库主真相源，已固定为 PostgreSQL。
- `migrations/`：保留历史迁移；其中 `migration_lock.toml` 仍残留 SQLite 时代标记，当前部署脚本用兼容逻辑兜底。
- `dev.db`：历史 SQLite 文件，已从主路径移除。

## 5. `scripts/` 结构说明
- `cloud-deploy.sh`：云服务器端到端部署入口。
- `migrate-and-seed.sh`：容器启动后的数据库同步与种子逻辑，当前含历史兼容分支。
- `health-check.sh`、`init-db.sh`：健康验证与数据库初始化辅助脚本。
- `scripts/archive/`：历史性脚本归档位置，例如 SQLite -> PostgreSQL 一次性迁移脚本。

## 6. `docs/` 结构说明
- `docs/` 根目录保留当前仍有参考价值的分析文档、策略文档和设计说明。
- `docs/archive/tasks/`：历史 `task_*.md` 实施记录。
- `docs/archive/README.md`：归档说明与使用边界。
- 历史任务文档默认只读，不再代表当前执行计划。

## 7. 运行入口
- Web 应用入口：`src/app`。
- API 入口：`src/app/api/**/route.ts`。
- 页面门禁入口：`src/middleware.ts`。
- 认证入口：`src/app/login/page.tsx` 与 `src/app/api/auth/**/route.ts`。
- 会话与守卫入口：`src/lib/auth/**`。
- 数据库入口：`prisma/schema.prisma`。
- 本地开发热加载入口：`package.json` 中的 `npm run dev`。
- 容器部署验证入口：`docker-compose.yml`。
- 云部署入口：`scripts/cloud-deploy.sh`。

## 8. 当前目录治理判断
- 当前主线目录结构整体可继续沿用，无需重做大规模源码搬迁。
- `phase02-auth-gate-*` 已完成，页面与核心 API 均已接入最小认证闭环。
- `src/app` 中若干开发辅助页面仍混在正式页面旁边，后续应在不破坏 UI 的前提下做“分类 + 门禁 + 导航治理”。

## 9. 已知结构债务
- `.env` 仍有历史跟踪痕迹，后续应完成真正的模板化与去跟踪化收口。
- SQLite 时代遗留仍体现在迁移锁、迁移 SQL、兼容脚本和少量注释中。
- 部分辅助页面与性能页面未明确“只在开发使用”还是“长期保留”。
- 房间、合同、账单、仪表主链的删除门禁与状态约束仍需在服务端进一步加固。
