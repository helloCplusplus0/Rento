# architecture_map.md

## 仓库总览
当前仓库的逻辑主线已切换为 `Rento-miniX`，但代码实现现状仍然是 `Next.js + Prisma + PostgreSQL + Redis + Nginx` 的旧 `Rento` 承载形态。换句话说：

- 当前仓库同时包含：
  - 旧 `Rento` 的现有实现与存量运行资产
  - `Rento-miniX` 原地重构所需的根级真相源与阶段文档
- 当前阶段的核心任务不是回退重做应用壳、运行时基础或最小 API/Auth 骨架，而是以已完成的 `phase07`、`phase08` 结论为前提，冻结 `phase09` 的共享领域服务落点、正式宿主边界、主链验证路径与历史数据保留约束。

## 当前双层结构说明
### 现有实现层
- 现有代码仍位于根级 `src/`、`prisma/`、`public/`、`scripts/` 等目录。
- 这部分是旧 `Rento` 的现状实现，也是后续原地重构的直接参考基线。
- 在 `phase09` 审核前，不把这部分现有实现一次性大爆炸改写成新架构。

### 新主线规划层
- 根级 `README.md`、`AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md` 与 `docs/phase06_*`、`docs/phase07_*`、`docs/phase08_*`、`docs/phase09_*` 组成当前 `Rento-miniX` 的主真相源。
- 仓库内曾创建的 `Rento-miniX/` 子目录，已在完成内容吸收与引用复核后删除；相关治理结论已由根级真相源与 `docs/phase06_*` 承接，并继续作为 `phase07` 的上游输入。

## `phase07` 目标结构说明
### 规划中的新应用壳层
- `phase07` 规划中的前端新壳将收口到 `src/minix/`，用于承接 `Vite + React + React Router` 的正式前端入口。
- 该层的职责是承接现有 `AppLayout`、导航壳、路由骨架、全局样式和最小页面壳，不在本阶段直接迁移全部业务页面逻辑。

### 规划中的新运行时层
- `phase07` 规划中的服务端运行时将收口到根级 `server/`，用于承接 `Hono + @hono/node-server` 的 Node 入口、中间件和 `/api/health`。
- 该层只负责新的基础运行时承接位，不在本阶段直接承接账单、合同、抄表等正式业务 API。

## `phase08` 目标结构说明
### 规划中的统一 API 宿主层
- `phase08` 规划中的统一 API 宿主继续收口到根级 `server/`，在 `phase07` 已完成的运行时壳基础上继续冻结：
  - 统一 `/api` 宿主
  - 认证会话提取与门禁中间件
  - 请求约束与统一错误处理
  - 最小公开 API 白名单
- 该层在 `phase08` 只承接最小 API/Auth 骨架，不在本阶段直接迁移账单、合同、房源、租客、仪表、抄表等正式领域服务。

### 规划中的最小页面门禁层
- `phase08` 规划中的前端页面门禁继续收口到 `src/minix/`，只冻结：
  - 最小登录态探测
  - 未登录跳转 `/login?next=...`
  - 已登录访问 `/login` 自动回跳
- 该层只负责让新前端壳与新 API/Auth 骨架保持最小一致性，不在本阶段迁移完整页面数据加载和领域页面逻辑。

### 规划中的脚本层
- `phase07` 规划中的运行脚本将补充到 `scripts/`，例如 `scripts/dev-minix.mjs`、`scripts/start-minix.mjs`。
- 开发态采用 `Vite + Hono` 双服务代理；生产态最终切线不在 `phase07` 冻结。

### `phase07-04` 旧运行线映射口径
- 旧 `src/app`
  - 继续保留为现状页面壳、未迁移页面与 UI 参考基线
  - 不再作为新增前端宿主逻辑和新路由骨架的默认落点
- 旧 `src/app/api/*`
  - 在 `phase08` 期间继续保留为存量业务 API、治理/辅助 API、未迁移认证逻辑与兼容宿主
  - 不再作为新增 API 宿主、认证骨架或中间件默认落点
- 旧启动脚本
  - `scripts/dev-entry.mjs` 继续服务于旧 `Next.js` 开发态与现状对照验证
  - `scripts/start-entry.mjs` 继续服务于旧 `Next.js` 存量启动与回滚基线
  - 在新主线脚本、验证路径与回滚口径未冻结前，不进入删除或停用
- 并行关系
  - 开发态：`src/minix/` + `server/` 承接新主线验证，旧 `Next.js` 运行线保留为现状对照
  - 验证态：新宿主验证应用壳、路由、中间件与 `/api/health`，旧宿主验证未迁移入口与回滚基线
  - 存量运行线：在部署主线切换前，旧 `Next.js` 仍是当前可运行宿主；新宿主只冻结承接方向
- 后续输入
  - `phase08` 直接输入：`server/`、旧 `src/app/api/*`、`src/middleware.ts`、`src/lib/auth/*`、`src/lib/api-error-handler.ts`
  - `phase09` 直接输入：`server/`、`src/minix/`、旧 `src/app/*`、旧 `src/app/api/*`、`src/lib/prisma.ts`、`src/lib/queries.ts`
  - `phase10` 直接输入：`phase09` 已冻结的共享领域服务边界、事务边界候选、查询/写路径需求与仍存在的 schema/迁移链兼容项

### `phase08-01` 最小公开路由口径
- 公开页面
  - `/login`
  - `/offline`
- 公开 API
  - `/api/health`
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/session`
- 其他后续迁入 `server/` 的新 API 默认受认证守卫保护；正式业务 API 与治理/辅助接口继续暂留旧宿主，作为后续阶段迁移参考输入。

## `phase09` 目标结构说明
### 规划中的共享领域服务层
- `phase09` 规划中的主链业务真相优先收口到共享领域服务层，用于承接合同、账单、支付周期、仪表、抄表、退租结算与删除门禁等主链语义。
- 该层的职责是把当前分散在旧 `src/app/api/*` 与 `src/lib/*` 中的核心业务规则收口为可被新旧宿主共同复用的单一真相源，而不是复制一份只给 `Hono` 使用的平行实现。
- 规划中的共享服务目录默认收口到 `src/lib/domain/` 或等价共享目录，由后续 `phase09` 文档冻结具体命名。

### 规划中的正式领域 API 宿主层
- `phase09` 规划中的正式领域 API 继续收口到 `server/`，在 `phase08` 已完成的统一 `/api` 宿主、认证门禁、中间件链与错误处理基础上，继续承接正式领域路由外壳。
- 该层在 `phase09` 允许迁入：
  - 合同生命周期与删除门禁相关路由
  - 账单与支付周期相关路由
  - 仪表、抄表、相关账单追溯与退租结算相关路由
- 该层在 `phase09` 不负责：
  - ORM 最终定案
  - 最终部署主线
  - 完整前端页面迁移

### 规划中的旧宿主兼容层
- `phase09` 期间旧 `src/app/api/*` 继续保留，但其职责应逐步降为：
  - 未迁移接口的存量运行线
  - 已迁接口的兼容包装或只读参考实现
  - 新主线主链行为的对照基线
- `phase09` 明确禁止继续把新增主链业务真相写回旧 `src/app/api/*`。

### `phase09` 的直接输入与禁止越界项
- 正式宿主输入
  - `server/` 中已冻结的统一 `/api` 宿主
  - `server/middleware/*` 中已冻结的认证门禁、中间件链与错误处理骨架
  - `src/minix/` 中已冻结的最小登录守卫与页面壳承接位
- 存量参考输入
  - 旧 `src/app/*` 页面行为
  - 旧 `src/app/api/*` 领域接口
  - `src/lib/prisma.ts`
  - `src/lib/queries.ts`
  - `src/lib/validation.ts`
  - `src/lib/auto-bill-generator.ts`
  - `src/lib/checkout-settlement.ts`
  - `src/lib/bill-semantics.ts`
  - `src/lib/contract-activation.ts`
- 禁止越界项
  - 不在领域迁移阶段反向重写 UI 设计语言
  - 不提前切 ORM 最终主线或迁移链方案
  - 不提前切部署主线
  - 不以删除旧宿主替代迁移验收

## 原内嵌 `Rento-miniX/` 目录治理说明
### 当前状态
- 原 `Rento-miniX/` 目录已完成“抽取 -> 复核 -> 清理”，当前仓库中已不存在该目录。
- 该目录曾承担“前置规划输入材料”职责，用于补充说明早期对 `Rento-miniX` 的目标方案、阶段命名与迁移设想。
- 当前后续阶段判断默认只以上述根级真相源与 `docs/phase06_*` 为准，不再存在任何内嵌目录单独驱动阶段实现的入口。

### 材料分类口径
- 已被根级真相源吸收的治理类材料：`Rento-miniX/README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`global_skills.md`、`project_skills.md`、`plan.md`；当前对应承接位分别是根级同名文件。
- 已被 `phase06` 吸收的阶段与关系类材料：`Rento-miniX/docs/rento_minix_solution_overview.md`、`docs/rento_to_minix_transition_workflow.md`、`docs/phase01_*`；当前对应承接位是根级 `plan.md`、`architecture_map.md` 与 `docs/phase06_*`。
- 原目录中的文件内容已通过吸收映射完成承接；当前仅保留相关阶段文档中的历史说明，不再作为后续 `/spec`、实现或目录治理的直接真相源。

### 文件级吸收映射
原 `Rento-miniX/` 目录中的文件，当前按如下口径理解：

- `Rento-miniX/README.md`
  - 承接位：根级 `README.md`
  - 状态：已吸收核心目标方案与 `Rento / Rento-miniX` 关系冻结

- `Rento-miniX/AGENTS.md`
  - 承接位：根级 `AGENTS.md`
  - 状态：已吸收入口职责与工作流总约束

- `Rento-miniX/project_rules.md`
  - 承接位：根级 `project_rules.md`
  - 状态：已吸收原地重构规则、目录治理与门禁边界

- `Rento-miniX/architecture_map.md`
  - 承接位：当前文件 `architecture_map.md`
  - 状态：已吸收“规划层 / 实现层”关系，但旧版“独立新仓库前提”不再直接继承

- `Rento-miniX/global_skills.md`
  - 承接位：根级 `global_skills.md`
  - 状态：已吸收参考基线驱动工作流与阶段规划技能

- `Rento-miniX/project_skills.md`
  - 承接位：根级 `project_skills.md`
  - 状态：已吸收 UI 承接、主链保真、轻部署与迁移治理技能

- `Rento-miniX/plan.md`
  - 承接位：根级 `plan.md` + `docs/phase06_*`
  - 状态：其“完整 Phase 总览”的价值已提升并吸收到根级 `plan.md`；原文件已随目录删除

- `Rento-miniX/docs/rento_minix_solution_overview.md`
  - 承接位：`docs/phase06_minix_replatform_architecture_plan.md` + `docs/phase06_minix_replatform_shared_baseline.md`
  - 状态：已吸收 `Hono` 版方案判断、UI 承接、PostgreSQL 主线与轻量化动机

- `Rento-miniX/docs/rento_to_minix_transition_workflow.md`
  - 承接位：根级 `global_skills.md` + `docs/phase06_*`
  - 状态：已吸收 workflow 原则，但其中“正式实现默认切到独立新仓库”已不再直接继承

- `Rento-miniX/docs/phase01_baseline_and_scope_*`
  - 承接位：根级 `plan.md` + `docs/phase06_*`
  - 状态：已吸收“先冻结再实现”的节奏与阶段顺序设计方法，但阶段命名和仓库前提已按原地重构语境重写

### 抽取边界
- 允许抽取的内容：`Rento` 与 `Rento-miniX` 的关系冻结、UI 默认承接、PostgreSQL 固定主线、低复杂度重构原则、阶段职责拆分、工作流停顿门禁。
- 允许作为历史输入保留但不直接继承的内容：面向独立新仓库阶段的命名、当时的目录预制设想、早期 `phase01` 顺序说明。
- 不应继续直接继承的内容：把内嵌 `Rento-miniX/` 视为未来长期实现主线目录的表述，以及任何会让当前仓库重新出现双重真相源的旧叙事。

## Git / Remote 收口口径
- 当前仓库实际 `git origin` 已指向 `https://github.com/helloCplusplus0/Rento-miniX.git`，后续主动开发、审核与推送默认只围绕该主仓展开。
- `Rento-legacy` 只承担旧主线历史备份与只读对照参考职责，不作为当前仓库默认上游、默认推送目标或长期并行第二 remote。
- 若后续临时拉取旧主线材料，应按“只读比对输入”处理；禁止把 `Rento-legacy` 重新引入为当前阶段并行开发工作流的一部分。

## 模块迁移分类口径
- `直接复用`
  - 业务主链语义、页面信息架构、数据模型基线、真实部署问题证据
- `包一层适配`
  - 查询服务、认证逻辑、错误处理策略、页面级数据获取边界
- `必须重写`
  - `Next.js` 运行时承载方式、`src/app/api/*` 的宿主形态、旧部署主线入口
- `延后决策`
  - ORM 最终选型、迁移链兼容项退出方式、最终部署切线细节

## 现有运行线部署真相源
以下文件仍对应旧 `Rento` 的当前存量运行形态与回滚基线，而不是未来 `Rento-miniX` 的最终部署主线：
- `docker-compose.yml`：当前容器编排入口
- `.env.example`：当前共享环境模板
- `nginx/nginx.conf`：当前 HTTPS 反向代理配置
- `scripts/cloud-deploy.sh`：当前部署执行脚本
- `scripts/bootstrap-deploy-assets.sh`：当前部署资产拉取脚本
- `DEPLOYMENT.md`：当前存量运行线部署手册与回滚说明

## 根目录结构
```text
Rento/
├── src/                  # 现有 Rento 应用源码，后续原地重构起点
├── src/minix/            # 已落地的 phase07 新前端应用壳承接位
├── prisma/               # Prisma schema 与迁移
├── public/               # 静态资源
├── scripts/              # 启动、初始化、部署脚本
├── server/               # 已落地的 phase07 Hono 运行时承接位
├── docs/                 # 阶段设计、问题分析、归档与 phase06 文档
├── nginx/                # 当前容器化 HTTPS 配置
├── backups/              # 运行时备份挂载目录
├── logs/                 # 运行时日志挂载目录
├── README.md             # 当前项目总览
├── DEPLOYMENT.md         # 当前存量运行线部署手册
├── AGENTS.md             # 当前主真相源入口摘要
├── project_rules.md      # 当前主真相源规则
├── global_skills.md      # 当前主真相源通用方法论
├── project_skills.md     # 当前主真相源项目技能
├── plan.md               # 当前主真相源阶段总览
├── architecture_map.md   # 当前文件
├── docker-compose.yml    # 当前存量运行线容器编排
└── .env.example          # 当前存量运行线环境模板
```

## 业务源码结构
### `src/app`
- `src/app/page.tsx`：工作台首页入口
- `src/app/rooms`、`renters`、`contracts`、`bills`：核心业务页面
- `src/app/add/*`：新增流程入口
- `src/app/api/*`：当前 Next.js 后端 API；在 `phase09` 期间继续作为存量业务 API、治理/辅助 API、未迁移接口与兼容宿主
- `src/app/login/page.tsx`：管理员登录页
- 当前定位：`phase07-04` 后继续保留为参考基线、存量运行线和未迁移页面壳，不再作为新增前端宿主逻辑默认落点

### `src/lib`
- `prisma.ts`：Prisma Client 单例
- `queries.ts`：核心查询封装
- `api-error-handler.ts`：API 错误处理与请求约束
- `auth/*`：认证、密码校验、会话守卫
- `health-checker.ts` 等：运行治理能力
- 当前定位：`phase09` 期间继续作为共享领域语义与正式宿主适配的直接参考基线，其中 `queries.ts`、`validation.ts`、`auto-bill-generator.ts`、`checkout-settlement.ts`、`bill-semantics.ts` 与 `contract-activation.ts` 是主链领域服务迁移的核心输入

### `scripts`
- `scripts/dev-entry.mjs`：旧 `Next.js` 开发态入口，继续承担现状对照与回滚参考职责
- `scripts/start-entry.mjs`：旧 `Next.js` 启动入口，继续承担存量运行线与回滚基线职责
- 当前定位：在 `dev:minix`、`build:minix`、`start:minix` 或等价新主线脚本冻结前，不作为可删除资产

### `prisma`
- `schema.prisma`：当前数据主真相源
- `migrations/`：历史迁移目录，仍包含 SQLite 兼容遗留

## 当前文档结构
- `docs/phase05_*`：旧主线已完成的 PWA 交付阶段文档，作为上游连续性输入保留
- `docs/phase06_*`：当前 `Rento-miniX` 原地重构阶段文档
- `docs/fix/`：旧主线 fix 闭环材料，后续不再作为当前默认主工作流，但仍保留历史参考价值
- `docs/archive/`：历史归档材料

## 原内嵌目录删除结论
- 原 `Rento-miniX/` 目录已按“抽取 -> 复核 -> 清理”的顺序完成删除。
- “抽取”结果：当前仍有效的治理结论、关系冻结与阶段边界，已被根级真相源或 `docs/phase06_*` 明确吸收。
- “复核”结果：仓库内已不存在把该目录作为正式真相源、正式实现目录或当前阶段直接依赖入口的有效引用。
- 当前若再次出现同类内嵌规划目录，应沿用同样的收口顺序，而不是让其长期并存。

## 当前结构判断
- 当前仓库已具备原地重构所需的参考代码、治理文档与历史阶段结论，不再需要另开并行本地项目目录。
- 当前最需要收口的是“以 `phase07` 已完成结论为基础，继续保持根级真相源与阶段实现状态一致”，而不是回退重做应用壳或运行时代码。
- 后续 `Rento-miniX` 的正式实现仍在当前根级源码目录中推进；原内嵌 `Rento-miniX/` 目录已删除，不再存在第二套目录主线。
- 完整 `Rento -> Rento-miniX` 阶段路线图的长期全局承接位已收口到根级 `plan.md`；`docs/phase06_*` 仅保留其在 `phase06` 中的推导、冻结与验收说明。
- `phase07` 已完成 `src/minix/`、`server/`、新脚本口径与旧运行线映射冻结，后续不再需要继续把新增宿主逻辑写回旧 `src/app` 或旧 `src/app/api/*`。
- `phase08` 已完成：统一 API 宿主、认证门禁、中间件链、错误处理、公开 API 白名单、环境变量“新主旧兼”口径与最小页面守卫已完成当前阶段收口。
- 当前默认下一步是审核 `docs/phase09_*` 并据此进入 `phase09` 的 `/spec`，而不是提前执行 ORM 定案或部署切线。
