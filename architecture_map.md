# architecture_map.md

## 仓库总览
当前仓库的逻辑主线已切换为 `Rento-miniX`，但代码实现现状仍同时包含：

- 当前仓库同时包含：
  - 旧 `Rento` 的现有实现与存量运行资产
  - `Rento-miniX` 原地重构所需的根级真相源与阶段文档
- 当前阶段的核心任务不再是回退重做应用壳、运行时基础或最小 API/Auth 骨架；`phase09` 已完成共享领域服务、正式宿主、主链 smoke 与 compat wrapper 清单收口，`phase10` 已完成阶段文档与 `phase10-01 ~ phase10-05` `/spec` 收口，并继续固定 `Prisma + PostgreSQL` 为正式数据访问主线，`phase11` 已完成 `phase11-01 ~ phase11-05` 当前轮已批准 spec 收口，并已把正式环境模板、主健康入口、文档最小验证要求与部署演练记录要求冻结为单一部署真相的一部分；当前默认工作流已从 `phase12-05` 文档收口推进到 `phase13-frontend-page-parity-implementation` 的阶段文档审核阶段，开始把 `phase12 ~ phase16` 的路线图从“冻结层”推进到“真实页面迁移实施层”。

## 当前双层结构说明
### 现有实现层
- 现有代码仍位于根级 `src/`、`prisma/`、`public/`、`scripts/` 等目录。
- 这部分是旧 `Rento` 的现状实现，也是后续原地重构的直接参考基线。
- 在 `phase10` 数据访问层方案冻结前，不把这部分现有实现一次性大爆炸改写成新架构。

### 新主线规划层
- 根级 `README.md`、`AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md` 与 `docs/phase06_*`、`docs/phase07_*`、`docs/phase08_*`、`docs/phase09_*`、`docs/phase10_*`、`docs/phase11_*`、`docs/phase12_*`、`docs/phase13_*` 组成当前 `Rento-miniX` 的主真相源。
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
### 已落地的共享领域服务层
- `phase09` 已把主链业务真相优先收口到共享领域服务层，用于承接合同、账单、支付周期、仪表、抄表、退租结算与删除门禁等主链语义。
- 该层的职责是把分散在旧 `src/app/api/*` 与 `src/lib/*` 中的核心业务规则收口为可被新旧宿主共同复用的单一真相源，而不是复制一份只给 `Hono` 使用的平行实现。
- 已落地的共享服务目录收口到 `src/lib/domain/`。

### 已落地的正式领域 API 宿主层
- `phase09` 已把正式领域 API 继续收口到 `server/`，在 `phase08` 已完成的统一 `/api` 宿主、认证门禁、中间件链与错误处理基础上，继续承接正式领域路由外壳。
- 该层在 `phase09` 已迁入：
  - 合同生命周期与删除门禁相关路由
  - 账单与支付周期相关路由
  - 仪表、抄表、相关账单追溯与退租结算相关路由
- 该层在 `phase09` 不负责：
  - ORM 最终定案
  - 最终部署主线
  - 完整前端页面迁移

### 已落地的旧宿主兼容层
- `phase09` 完成后旧 `src/app/api/*` 仍继续保留，但其职责已明确收口为：
  - 未迁移接口的存量运行线
  - 已迁接口的兼容包装或只读参考实现
  - 新主线主链行为的对照基线
- `phase09` 已明确禁止继续把新增主链业务真相写回旧 `src/app/api/*`，并新增 `phase09-06` 的 compat wrapper 与退出清单作为 `phase10` 输入。

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

## `phase10` 目标结构说明
### 规划中的长期数据访问层
- `phase10` 的职责不是重新定义领域语义，而是在 `phase09` 已冻结的共享领域服务之下，继续冻结长期数据访问承接位。
- 当前正式数据访问主线继续固定为 `Prisma + PostgreSQL`，其中：
  - `src/lib/prisma.ts` 是 Prisma Client 单例入口
  - `src/lib/domain/*` 继续承接正式主链写路径与少量主链读回查
  - `src/lib/transaction-manager.ts` 已作为正式主链四领域模块的统一事务来源冻结；治理脚本与兼容工具仍按各自边界继续评估

### 规划中的查询层分层
- `phase10` 规划中的查询层不追求“一次删光旧查询 helper”，而是冻结三类身份：
  - 正式主链查询：服务正式宿主与主链页面/流程回查
  - legacy compat 查询：服务 `src/app/api/*` 中仍保留的兼容读取入口
  - 治理/脚本查询：服务 dashboard、repair、validation、consistency 等辅助入口
- 当前直接输入主要包括：
  - `src/lib/queries.ts`
  - `src/lib/optimized-queries.ts`
  - `src/lib/dashboard-queries.ts`
  - `src/lib/search-queries.ts`
  - `server/lib/legacy-route-inventory.ts`

### 规划中的迁移兼容层
- `phase10` 规划中的迁移兼容层继续收口到：
  - `prisma/schema.prisma`
  - `prisma/migrations/migration_lock.toml`
  - `scripts/migrate-and-seed.sh`
- 该层的职责不是立即切换最终迁移主线，而是写清：
  - SQLite 残留为何仍存在
  - 当前兼容路径服务于哪些场景
  - `db push` 与 `migrate deploy` 的正式/兼容职责边界
  - 后续退出条件与回滚条件

### `phase10-05` 收口结果
- `phase10` 当前已形成单一闭环：
  - 顶层真相源：`AGENTS.md`、`plan.md`、`architecture_map.md`、`project_rules.md`
  - 阶段文档：`docs/phase10_data_access_and_migration_closure_architecture_plan.md`、`docs/phase10_data_access_and_migration_closure_dev_plan.md`、`docs/phase10_data_access_and_migration_closure_shared_baseline.md`
  - `/spec` 收口：`phase10-01 ~ phase10-05`
- `phase10` 最低验证命令已冻结为：
  - `npm run audit:phase09:legacy-routes`
  - `npm run lint`
  - `npm run type-check`
- 若本轮仅涉及文档，则最小验证要求仍包括：
  - `docs/phase10_*` 三份文档互链复核
  - 被引用文档、脚本与代码路径存在性复核
- 供 `phase11` 直接继承的最小上游输入已冻结为：
  - 长期数据访问层方案判断
  - 正式/兼容/治理查询分层与 canonical read path 判断
  - 统一事务边界与单一策略来源
  - 迁移兼容项、`db push` compat path 与 `migrate deploy` 正式目标的边界
  - 与 `phase09-06` route inventory 对齐后的退出/保留判断

## `phase11` 目标结构说明
### 规划中的正式部署主线
- `phase11` 的职责是把已存在的新主线承接位提升为正式部署主线，而不是重写应用壳、API 或领域语义。
- 正式部署拓扑规划固定为：
  - `Caddy`：公网 HTTPS 入口与反向代理
  - `systemd`：单一 Hono 运行时守护进程
  - `Hono`：正式 `/api/*` 与 `dist/` 静态壳托管
  - `PostgreSQL`：唯一正式数据库主线
- 正式部署主线默认不再引入 `redis`；`redis` 只继续保留在 legacy 回滚基线中。

### 规划中的服务端产物链
- 当前 `server/index.ts`、`server/app.ts` 与 `server/lib/static.ts` 已具备正式运行时承接位。
- 当前 `phase11-05` 已补齐的不是新的运行时代码，而是：
  - 顶层真相源、`DEPLOYMENT.md` 与 `docs/phase11_*` 的最终一致性复核
  - 仅文档变更时的最小验证要求
  - 后续部署/回滚演练的最小记录字段、引用方式与审核用途
- 因此 `phase11` 的直接实现承接位将围绕：
  - `package.json`
  - `scripts/start-minix.mjs`
  - `scripts/health-check.sh`
  - `scripts/migrate-and-seed.sh`
  - `tsconfig` 的服务端产物配置
  - `DEPLOYMENT.md`
  - `deploy/caddy/Caddyfile`
  - `deploy/systemd/rento-minix.service`

### 规划中的发布门禁与回滚基线
- `phase11` 的发布门禁需要统一收口到：
  - `npm run lint`
  - `npm run type-check`
  - `npm run build:minix`
  - `npm run audit:phase09:legacy-routes`
  - 条件允许时的 `npm run smoke:phase09:all`
  - `/api/health` 与登录页的正式部署验证
- `phase11-05` 进一步冻结：
  - 仅文档变更时必须完成 `docs/phase11_*` 互链复核、被引用路径存在性复核与根级真相源状态复核
  - 部署/回滚演练记录至少包含演练时间、目标环境、执行命令、健康检查结果、主链 smoke 结果、回滚触发条件与最终结论
  - 演练记录必须标明“正式主线验证”或“legacy 回滚验证”，并可被根级真相源或阶段文档引用
- `phase11` 的回滚基线继续固定为旧容器化运行线，而不是切回 `Rento-legacy` 仓库或恢复第二真相源。

## `phase12 ~ phase16` 目标结构说明
### 规划中的页面 parity 冻结层
- `phase12` 规划中的前端 parity 继续收口到 `docs/phase12_*` 与根级真相源，用于冻结旧 `src/app/*` 的页面事实表、路由落点、页面装配边界、UI 保真规则与后续多阶段路线图。
- 该层的职责是把“迁哪些页面、先迁哪些页面、如何复用、哪些 UI 不能动、页面与 retained-legacy API 如何联动”冻结成单一答案，而不是直接承担真实页面迁移实施。
- 该层默认继续把旧 `src/app/*` 视为页面原型与行为参考基线，并把现有 `src/components/pages/*`、`src/components/business/*`、`src/components/layout/*` 与 `src/components/ui/*` 的复用策略先收口到文档。

### 规划中的页面 parity 实施层
- 新增 `phase13-frontend-page-parity-implementation`，其前端 parity 实施继续收口到 `src/minix/`，用于把旧 `src/app/*` 的正式页面壳、路由落点与页面装配边界真实迁入纯新主线。
- 该层的职责是逐步把旧宿主页面迁成纯新主线可用的正式页面，而不是借迁移重做 UI、重写主链语义或提前切 API / PWA / cutover。
- 该层默认继续复用现有 `src/components/pages/*`、`src/components/business/*`、`src/components/layout/*` 与 `src/components/ui/*`，只在技术适配确有必要时调整宿主绑定层。
- 该层的统一验收口径进一步固定为：任何已迁页面都必须以旧 `Rento` 源代码为直接原型，并在除最小技术适配外达到接近 `100%` 的信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义保真度；若仅完成页面壳落位或说明页替换，不得单独视为迁移完成。

### 规划中的 API / query parity 承接层
- `phase14` 规划中的 API / query parity 继续收口到根级 `server/` 与 `src/lib/domain/*`、`src/lib/queries.ts` 等既有正式数据访问承接位。
- 该层的职责是清空旧 `src/app/api/*` 中仍承担正式业务职责的 retained-legacy 路由，而不是重新打开 ORM 替换议题。
- 当前正式数据访问主线继续固定为：
  - `Prisma + PostgreSQL`
  - `src/lib/prisma.ts`
  - `src/lib/domain/*`
  - `src/lib/transaction-manager.ts`

### 规划中的新主线 PWA 承接层
- `phase15` 规划中的 PWA parity 将继续收口到 `src/minix/`、根级 `public/`、`vite.config.ts` 与 `server/lib/static.ts` 所承接的纯新主线产物链。
- 该层的职责是把安装、更新、最小离线兜底与发布口径迁到 `Vite + Hono` 主线，而不是继续依赖旧 Next PWA 宿主。
- 该层默认继续保持最小受控策略，不通过缓存动态鉴权业务接口来换取“离线更强”的表面效果。

### 规划中的 parity 验收与 legacy 退出层
- `phase16` 规划中的 cutover 与 legacy 退出继续建立在：
  - `phase11` 已冻结的正式部署主线与发布门禁
  - `phase13` 的页面 parity 结果
  - `phase14` 的 API / query parity 结果
  - `phase15` 的新主线 PWA parity 结果
- 该层只负责回答“纯新主线是否已完整替代旧技术栈、何时允许退出 legacy 资产”，不再反向重写业务边界。

### `phase12 ~ phase16` 闭环路线图矩阵
| 阶段 | 结构承接位 | 主要职责 | 前置依赖 | 退出条件 | 文档轮次最小验证要求 |
| --- | --- | --- | --- | --- | --- |
| `phase12` | `docs/phase12_*`、根级真相源、旧 `src/app/**/page.tsx` 参考基线 | 冻结页面范围、页面映射、页面装配复用、UI 保真边界与多阶段路线图 | `phase10` 数据访问边界、`phase11` 部署主线、旧页面原型 | 页面映射、复用矩阵、UI 保真边界与后续路线图均已形成单一解释，且顶层真相源同步完成 | `docs/phase12_*` 互链复核、被引用路径存在性复核、顶层真相源状态一致性复核 |
| `phase13` | `src/minix/router/*`、`src/minix/layout/*`、`src/minix/routes/*`、复用后的 `src/components/*` | 真实迁移正式页面壳、页面装配层、数据加载边界与正式路由承接位 | `phase12` 页面事实表、映射表、复用矩阵与 UI 保真边界 | 首批正式页面已在新宿主真实落位，且除最小技术适配外与旧 `Rento` 原型保持接近 `100%` 的页面保真度，不再只是规划、placeholder 或说明性承接页 | 未来 `docs/phase13_*` 互链复核、被引用 `src/minix/*`/`src/components/*`/旧 `src/app/**/page.tsx` 路径存在性复核、顶层真相源状态一致性复核 |
| `phase14` | `server/*`、`src/lib/domain/*`、`src/lib/queries*`、`server/lib/legacy-route-inventory.ts` | 收口正式 API/query 宿主，清退 retained-legacy 路由 | `phase12` 页面-API 映射、`phase13` 页面 parity 结果、`phase10` query/事务边界、`phase11` 发布门禁 | retained-legacy / compat / formal-host-owned 清单与 route drain 顺序单一可解释 | 未来 `docs/phase14_*` 互链复核、被引用正式 API/query 路径存在性复核、顶层真相源状态一致性复核 |
| `phase15` | `src/minix/*`、`public/*`、`vite.config.ts`、`server/lib/static.ts` | 迁入 manifest、service worker、安装/更新策略、最小离线页与缓存边界 | `phase13` 页面壳、`phase14` API 边界、`phase05` PWA 基线、`phase11` 静态托管主线 | 纯 `Vite + Hono` 主线可独立承接最小受控 PWA 能力，不再依赖旧 Next PWA 宿主 | 未来 `docs/phase15_*` 互链复核、被引用 PWA/静态托管路径存在性复核、顶层真相源状态一致性复核 |
| `phase16` | parity 验收矩阵、部署/回滚记录、legacy 资产清单与归档入口 | 完成功能 parity 验收、cutover 审核、回滚演练与 legacy 退出 | `phase11` 部署/回滚基线、`phase13` 页面 parity、`phase14` API parity、`phase15` PWA parity | 能证明纯新主线在不依赖旧 `src/app/*`、旧 `src/app/api/*`、旧 Next PWA 宿主的前提下正式交付 | 未来 `docs/phase16_*` 互链复核、被引用验收记录/部署记录/legacy 资产清单路径存在性复核、顶层真相源状态一致性复核 |

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

## 正式部署真相源
- 根级 `DEPLOYMENT.md`、`README.md`、`AGENTS.md`、`project_rules.md`、`plan.md` 与 `docs/phase11_*` 将共同承接 `Rento-miniX` 的正式部署说明、发布门禁与 cutline 退出条件。
- 在 `phase11` 当前轮实现中，正式部署主线已冻结为 `Caddy + systemd + Hono + PostgreSQL`，并已落地 `deploy/caddy/Caddyfile` 与 `deploy/systemd/rento-minix.service` 作为正式部署资产基线。
- 当前 `.env.example` 已升级为正式共享环境模板，`scripts/health-check.sh` 已固定默认命中 `/api/health`，并与 `NEXTAUTH_URL` / `MINIX_SERVER_PORT` 口径保持一致。
- `phase11-04` 已把 legacy 回滚资产清单、保留条件、退出条件与 `Rento-legacy` 的只读边界收口到根级文档与 `docs/phase11_*`。
- `phase11-05` 已把文档最小验证要求、最低工程验证命令与部署/回滚演练记录要求收口到上述根级真相源与 `docs/phase11_*` 的单一闭环中。

## legacy 回滚基线
以下文件仍对应旧 `Rento` 的当前存量运行形态与回滚基线，而不是未来 `Rento-miniX` 的最终部署主线：
- `docker-compose.yml`：当前容器编排入口
- `nginx/nginx.conf`：当前 HTTPS 反向代理配置
- `scripts/cloud-deploy.sh`：当前部署执行脚本
- `scripts/bootstrap-deploy-assets.sh`：当前部署资产拉取脚本
- `scripts/start-entry.mjs`：当前 `Next.js standalone` 生产启动入口
- 历史容器化部署所依赖的镜像、容器、`nginx` 与 `redis` 变量口径：继续仅作为 legacy 回滚参考

legacy 基线统一边界：
- 只承担历史运行参考、故障回滚与新旧运行线差异对照职责
- 不再作为默认部署入口、默认运维入口或正式真相源
- 在正式部署主线、发布门禁、部署演练与回滚验证完成并通过审核前继续保留
- 只有在替代真相源与回滚记录冻结后，才允许进入后续退出决策；本轮不直接删除资产

## 根目录结构
```text
Rento/
├── src/                  # 现有 Rento 应用源码，后续原地重构起点
├── src/minix/            # 已落地的 phase07 新前端应用壳承接位
├── prisma/               # Prisma schema 与迁移
├── public/               # 静态资源
├── scripts/              # 启动、初始化、部署脚本
├── server/               # 已落地的 phase07 Hono 运行时承接位
├── deploy/               # 已落地的 phase11 正式部署资产基线
├── docs/                 # 阶段设计、问题分析、归档与 phase06 文档
├── nginx/                # 当前容器化 HTTPS 配置
├── backups/              # 运行时备份挂载目录
├── logs/                 # 运行时日志挂载目录
├── README.md             # 当前项目总览
├── DEPLOYMENT.md         # 当前正式部署真相源与 legacy 回滚说明入口
├── AGENTS.md             # 当前主真相源入口摘要
├── project_rules.md      # 当前主真相源规则
├── global_skills.md      # 当前主真相源通用方法论
├── project_skills.md     # 当前主真相源项目技能
├── plan.md               # 当前主真相源阶段总览
├── architecture_map.md   # 当前文件
├── docker-compose.yml    # 当前存量运行线容器编排
└── .env.example          # 当前正式共享环境模板
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
- 当前默认下一步已从 `phase12` 路线图重分层审核推进到 `phase13` 阶段文档审核：后续继续以 `docs/phase12_*`、新增的 `docs/phase13_*` 与 `plan.md` 为真相源，按已冻结的 `phase12 -> phase13 -> phase14 -> phase15 -> phase16` 路线图推进；其中 `phase13` 专门承接真实前端页面迁移实施，在进入 `/spec`、页面/API/PWA/cutover 实施前，legacy 资产继续保留为回滚基线。
