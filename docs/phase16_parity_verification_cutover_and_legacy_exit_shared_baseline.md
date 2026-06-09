# Phase16 Parity Verification Cutover And Legacy Exit Shared Baseline

## 当前状态
- 本文档用于冻结 `phase16` 必须共同遵守的最终验收边界。
- 它直接继承 `phase11` 的部署/回滚基线、`phase13` 的页面 parity 结论、`phase14` 的 API/query parity 结论与 `phase15` 的 PWA/runtime parity 结论。
- 本阶段不重新定义上游阶段的技术方案，只把上游结果翻译为最终验收、cutover 与 legacy-exit 的单一判断口径。

## 配套文档
- 架构规划：`docs/phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md`
- 开发规划：`docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`
- 仓库级阶段总览：`plan.md`

## 一、共享前提
- `phase11` 已完成：正式部署主线、最低发布门禁、健康检查、legacy 回滚基线与部署/回滚演练记录要求已冻结。
- `phase13` 已完成：正式业务页面 `25/25` 已迁入 `src/minix`，页面 parity 比较基线继续是旧 `src/app/**/page.tsx` 原型。
- `phase14` 已完成：旧 `src/app/api/*` 中已不存在承担正式业务主职责的 retained-legacy 路由，正式业务旧入口已统一降级为 `formal-host-owned` 或 `compat-wrapper`。
- `phase15` 已完成：纯新主线已可统一交付 `manifest`、`sw.js`、安装提示、更新提示、最小离线页与 PWA smoke 口径。

## 二、统一词汇
### 2.1 parity-blocker
- 旧 `Rento` 已具备、但 `Rento-miniX` 当前仍缺失的正式业务能力。
- 会阻断纯新主线在不依赖旧页面/API/PWA 宿主的前提下正式交付。

### 2.2 acceptable-adaptation
- 新旧路线的宿主、构建、部署或浏览器行为差异。
- 只要不改变业务主链语义、页面信息结构、API 行为、PWA 最小能力与正式发布能力，即可接受。

### 2.3 non-blocking-legacy-reference
- 仍保留在仓库中的 legacy 页面、legacy API、legacy PWA 入口或容器化资产。
- 它们只承担原型参考、兼容包装、回滚基线、差异对照或归档前参考职责。

### 2.4 formal-host-owned
- 由 `server/routes/*.ts` 或纯新主线运行时承担正式宿主职责的旧 API 路径分类。
- 在 `phase16` 中默认先视为“已满足宿主替代”，除非验证证据证明仍依赖旧入口。

### 2.5 compat-wrapper
- 旧入口仍保留薄包装、桥接、会话透传、回滚兼容或迁移过渡职责。
- 在 `phase16` 中必须继续判断它是否仍承担正式业务主职责。

### 2.6 retained-legacy
- 仍未切出旧宿主的 legacy 路径或 legacy 资产分类。
- 在 `phase16` 中必须继续判断其是否构成正式 blocker，还是仅为治理/辅助/回滚参考。

## 三、共享输入清单
- `docs/phase13_frontend_page_parity_implementation_shared_baseline.md`
- `docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md`
- `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md`
- `server/lib/legacy-route-inventory.ts`
- `src/minix/router/index.tsx`
- `src/minix/routes/*`
- `src/app/**/page.tsx`
- `src/app/api/**/route.ts`
- `src/components/pwa/*`
- `public/manifest.json`
- `public/sw.js`
- `server/lib/static.ts`
- `scripts/phase09-05-main-flow-smoke.ts`
- `scripts/phase14-06-query-cutover-smoke.ts`
- `scripts/pwa-smoke-check.sh`
- `scripts/health-check.sh`
- `DEPLOYMENT.md`
- `deploy/caddy/Caddyfile`
- `deploy/systemd/rento-minix.service`
- `docker-compose.yml`
- `nginx/nginx.conf`
- `scripts/cloud-deploy.sh`
- `scripts/bootstrap-deploy-assets.sh`
- `scripts/start-entry.mjs`

## 四、四类 parity matrix
- `phase16-01` 当前轮已完成：
  - 页面 parity matrix 回填
  - API/query parity matrix 回填
  - PWA/runtime parity matrix 回填
  - deploy / cutover / rollback matrix 回填
- 本文件仍不提前回填自动化验证结果、人工验收记录或最终 cutover/legacy-exit 结论。

### 4.1 页面 parity matrix
- 基线范围固定为 `phase13` 已冻结的 `25` 个正式业务页面。
- 每行至少记录：
  - 旧页面路径
  - 新页面路径
  - 页面类型
  - 当前结论
  - 证据来源
  - 差异说明
- 只允许三种结论：
  - `已满足 parity`
  - `存在迁移遗漏，必须补齐`
  - `存在可接受宿主差异，可忽略`
- 旧 `src/app/**/page.tsx` 继续保留为页面原型与只读参考，不自动构成 blocker。
- 当前页级回填结论：
  - `25` 个正式业务页面当前均为 `已满足 parity`
  - `0` 个页面为 `存在迁移遗漏，必须补齐`
  - `0` 个页面单独落入 `存在可接受宿主差异，可忽略`
- 差异分类编码：
  - `A / acceptable-adaptation`：由 `React Router route module + loader / pending / error boundary` 承接原 `Next.js page` 宿主协议，属于最小宿主适配。
  - `B / non-blocking-legacy-reference`：旧 `src/app/**/page.tsx` 继续保留为页面原型与只读参考，不承担新宿主正式运行主职责。
  - `C / acceptable-adaptation`：首页中的 `/profile`、`/notifications` 入口继续按延后支持页处理，在新宿主中改为受控 fallback / 阶段提示，不构成正式页面 parity 缺口。
  - `D / acceptable-adaptation`：设置页中的治理辅助入口仍通过 `openDocumentPath()` 打开治理页，不影响 `/settings` 主页面已迁移结论。
  - `E / acceptable-adaptation`：`/bills/stats` 为 `phase13-07` 尾项收口页，页面 parity 已通过；历史 stats query host 差异已在 `phase14` 中完成交接，不再构成页面 blocker。

| 旧页面路径 | 新页面路径 | 页面类型 | 当前结论 | 证据来源 | 差异说明 |
| --- | --- | --- | --- | --- | --- |
| `/` (`src/app/page.tsx`) | `/` (`src/minix/routes/HomePage.tsx`) | 工作台首页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1、3.5 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/HomePage.tsx` + `src/app/page.tsx` | `A + B + C`；首页已由 `HomePage.tsx` 承接，旧首页只保留为原型；支持页入口改为受控 fallback / 阶段提示，属于可接受宿主适配。 |
| `/rooms` (`src/app/rooms/page.tsx`) | `/rooms` (`src/minix/routes/rooms/RoomListRoute.tsx`) | 列表页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/rooms/RoomListRoute.tsx` + `src/app/rooms/page.tsx` | `A + B`；列表、筛选、详情跳转与错误边界已切到 React Router route module，旧页面仅保留参考。 |
| `/add` (`src/app/add/page.tsx`) | `/add` (`src/minix/routes/add/AddHubRoute.tsx`) | 聚合入口页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/add/AddHubRoute.tsx` + `src/app/add/page.tsx` | `A + B`；新增入口聚合与页面内跳转由新宿主承接，旧页面只作原型参考。 |
| `/contracts` (`src/app/contracts/page.tsx`) | `/contracts` (`src/minix/routes/contracts/ContractListRoute.tsx`) | 列表页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/contracts/ContractListRoute.tsx` + `src/app/contracts/page.tsx` | `A + B`；合同列表、详情跳转与续租入口已在新宿主承接。 |
| `/bills` (`src/app/bills/page.tsx`) | `/bills` (`src/minix/routes/bills/BillListRoute.tsx`) | 列表页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/bills/BillListRoute.tsx` + `src/app/bills/page.tsx` | `A + B`；账单列表、详情跳转与统计页入口已由新宿主承接，旧页面仅保留参考。 |
| `/settings` (`src/app/settings/page.tsx`) | `/settings` (`src/minix/routes/settings/SettingsRoute.tsx`) | 设置页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/settings/SettingsRoute.tsx` + `src/app/settings/page.tsx` | `A + B + D`；设置主页已迁入新宿主，治理辅助入口继续受控打开治理页，不改变主页面 parity 结论。 |
| `/rooms/[id]` (`src/app/rooms/[id]/page.tsx`) | `/rooms/:id` (`src/minix/routes/rooms/RoomDetailRoute.tsx`) | 详情页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/rooms/RoomDetailRoute.tsx` + `src/app/rooms/[id]/page.tsx` | `A + B`；详情信息、关联合同入口与错态边界已切到 route module。 |
| `/rooms/[id]/edit` (`src/app/rooms/[id]/edit/page.tsx`) | `/rooms/:id/edit` (`src/minix/routes/rooms/EditRoomRoute.tsx`) | 编辑页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/rooms/EditRoomRoute.tsx` + `src/app/rooms/[id]/edit/page.tsx` | `A + B`；编辑表单与提交后回跳已由新宿主承接。 |
| `/add/room` (`src/app/add/room/page.tsx`) | `/add/room` (`src/minix/routes/add/AddRoomRoute.tsx`) | 新建页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/add/AddRoomRoute.tsx` + `src/app/add/room/page.tsx` | `A + B`；创建流程与楼栋选择逻辑已由 route module 承接。 |
| `/add/contract` (`src/app/add/contract/page.tsx`) | `/add/contract` (`src/minix/routes/add/AddContractRoute.tsx`) | 新建页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/add/AddContractRoute.tsx` + `src/app/add/contract/page.tsx` | `A + B`；快捷签约入口与房源/租客预填已完成新宿主承接。 |
| `/contracts/new` (`src/app/contracts/new/page.tsx`) | `/contracts/new` (`src/minix/routes/contracts/ContractCreateRoute.tsx`) | 新建页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/contracts/ContractCreateRoute.tsx` + `src/app/contracts/new/page.tsx` | `A + B`；合同新建表单与成功回跳已由新宿主承接。 |
| `/contracts/[id]` (`src/app/contracts/[id]/page.tsx`) | `/contracts/:id` (`src/minix/routes/contracts/ContractDetailRoute.tsx`) | 详情页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/contracts/ContractDetailRoute.tsx` + `src/app/contracts/[id]/page.tsx` | `A + B`；合同详情与账单/房源/租客联动入口已由 route module 承接。 |
| `/contracts/[id]/edit` (`src/app/contracts/[id]/edit/page.tsx`) | `/contracts/:id/edit` (`src/minix/routes/contracts/ContractEditRoute.tsx`) | 编辑页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/contracts/ContractEditRoute.tsx` + `src/app/contracts/[id]/edit/page.tsx` | `A + B`；编辑回填与提交链路已由新宿主承接。 |
| `/contracts/[id]/renew` (`src/app/contracts/[id]/renew/page.tsx`) | `/contracts/:id/renew` (`src/minix/routes/contracts/ContractRenewRoute.tsx`) | 流程动作页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/contracts/ContractRenewRoute.tsx` + `src/app/contracts/[id]/renew/page.tsx` | `A + B`；续租流程、上下文预加载与回跳已切到 route module。 |
| `/contracts/[id]/checkout` (`src/app/contracts/[id]/checkout/page.tsx`) | `/contracts/:id/checkout` (`src/minix/routes/contracts/ContractCheckoutRoute.tsx`) | 流程动作页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/contracts/ContractCheckoutRoute.tsx` + `src/app/contracts/[id]/checkout/page.tsx` | `A + B`；退租结算流程与结果反馈已由新宿主承接。 |
| `/bills/create` (`src/app/bills/create/page.tsx`) | `/bills/create` (`src/minix/routes/bills/CreateBillRoute.tsx`) | 新建页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/bills/CreateBillRoute.tsx` + `src/app/bills/create/page.tsx` | `A + B`；手工建账入口与回跳已完成新宿主承接。 |
| `/bills/[id]` (`src/app/bills/[id]/page.tsx`) | `/bills/:id` (`src/minix/routes/bills/BillDetailRoute.tsx`) | 详情页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/bills/BillDetailRoute.tsx` + `src/app/bills/[id]/page.tsx` | `A + B`；账单详情与关联合同/租客跳转已由新宿主承接。 |
| `/bills/[id]/edit` (`src/app/bills/[id]/edit/page.tsx`) | `/bills/:id/edit` (`src/minix/routes/bills/EditBillRoute.tsx`) | 编辑页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/bills/EditBillRoute.tsx` + `src/app/bills/[id]/edit/page.tsx` | `A + B`；账单编辑与结果反馈已切到新宿主。 |
| `/renters` (`src/app/renters/page.tsx`) | `/renters` (`src/minix/routes/renters/RenterListRoute.tsx`) | 列表页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/renters/RenterListRoute.tsx` + `src/app/renters/page.tsx` | `A + B`；租客列表与详情跳转已由新宿主承接。 |
| `/renters/new` (`src/app/renters/new/page.tsx`) | `/renters/new` (`src/minix/routes/renters/RenterCreateRoute.tsx`) | 新建页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/renters/RenterCreateRoute.tsx` + `src/app/renters/new/page.tsx` | `A + B`；租客创建表单已由 route module 承接。 |
| `/renters/[id]` (`src/app/renters/[id]/page.tsx`) | `/renters/:id` (`src/minix/routes/renters/RenterDetailRoute.tsx`) | 详情页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/renters/RenterDetailRoute.tsx` + `src/app/renters/[id]/page.tsx` | `A + B`；租客详情、关联合同与快捷签约入口已在新宿主承接。 |
| `/renters/[id]/edit` (`src/app/renters/[id]/edit/page.tsx`) | `/renters/:id/edit` (`src/minix/routes/renters/RenterEditRoute.tsx`) | 编辑页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/renters/RenterEditRoute.tsx` + `src/app/renters/[id]/edit/page.tsx` | `A + B`；租客编辑与回填已切到新宿主。 |
| `/meter-readings/batch` (`src/app/meter-readings/batch/page.tsx`) | `/meter-readings/batch` (`src/minix/routes/meter-readings/MeterReadingBatchRoute.tsx`) | 流程动作页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/meter-readings/MeterReadingBatchRoute.tsx` + `src/app/meter-readings/batch/page.tsx` | `A + B`；批量抄表流程与批处理跳转协议已由新宿主承接。 |
| `/meter-readings/history` (`src/app/meter-readings/history/page.tsx`) | `/meter-readings/history` (`src/minix/routes/meter-readings/MeterReadingHistoryRoute.tsx`) | 流程动作页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/meter-readings/MeterReadingHistoryRoute.tsx` + `src/app/meter-readings/history/page.tsx` | `A + B`；抄表历史浏览与详情恢复路径已切到 route module。 |
| `/bills/stats` (`src/app/bills/stats/page.tsx`) | `/bills/stats` (`src/minix/routes/bills/BillStatsRoute.tsx`) | 统计页 | `已满足 parity` | `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 4.1、3.3 + `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 6.4 + `src/minix/router/index.tsx` + `src/minix/routes/bills/BillStatsRoute.tsx` + `src/app/bills/stats/page.tsx` | `A + B + E`；页面 route-level loader / pending / error 边界已收口，历史 stats query host 差异不再构成页面 blocker。 |

### 4.2 API/query parity matrix
- 基线范围固定为 `server/lib/legacy-route-inventory.ts` 中的 route inventory。
- 每行至少记录：
  - 旧 route path + method
  - inventory category
  - 当前 formal host
  - 当前 compat/bridge host
  - 当前页面或脚本依赖面
  - 退出条件
  - 最终判定
- 判断规则：
  - `formal-host-owned` 默认通过
  - `compat-wrapper` 需要继续判断是否仍承担正式业务主职责
  - `retained-legacy` 需要拆成正式 blocker 或治理/辅助残留两类
- 当前回填结论：
  - `53` 条 inventory operation 已完成回填：`5` 条 `formal-host-owned`、`42` 条 `compat-wrapper`、`6` 条 `retained-legacy`
  - `0` 条正式业务 route 仍落在 `retained-legacy`
  - 当前 remaining `retained-legacy` 全部属于治理/辅助接口，不承担正式业务主职责，因此不构成 `phase16` API/query parity blocker
  - `server/routes/domain.ts` 中 `'/contracts/:contractId/checkout'` 继续先于 `'/contracts'` 挂接；`Context7` 官方 API 当前 Hono 文档也明确 `app.route()` 会按子应用注册顺序把子路由加入父应用，因此该挂接顺序继续作为 checkout 不被 contracts 骨架吞掉的证据之一

| 旧 route path + method | inventory category | 当前 formal host | 当前 compat/bridge host | dependency | 退出条件 | 最终判定 |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/auth/login` `POST` | `formal-host-owned` | `server/routes/auth.ts` | 旧入口仅 `rollback-only`：`src/app/api/auth/login/route.ts` | 依赖 `src/lib/auth/password.ts`、`src/lib/auth/session.ts`；页面依赖 `/login` 登录提交 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；正式认证宿主已冻结，旧入口仅保留回滚参考 |
| `/api/auth/logout` `POST` | `formal-host-owned` | `server/routes/auth.ts` | 旧入口仅 `rollback-only`：`src/app/api/auth/logout/route.ts` | 依赖 `src/lib/auth/session.ts`；运行时会话退出 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；正式认证宿主已冻结，旧入口仅保留回滚参考 |
| `/api/health` `GET` | `formal-host-owned` | `server/routes/health.ts` | 旧入口仅 `rollback-only`：`src/app/api/health/route.ts` | 依赖 `src/lib/observability.ts`、`src/lib/prisma.ts`；脚本依赖 `scripts/health-check.sh` 与部署健康检查 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；正式健康检查宿主已冻结，旧入口仅保留回滚参考 |
| `/api/buildings` `GET, POST` | `formal-host-owned` | `server/routes/buildings.ts` | 旧入口仅 `rollback-only`：`src/app/api/buildings/route.ts` | 依赖 `src/lib/queries.ts`；页面依赖 `/rooms*`、`/add/room`、`/add/contract` 的楼栋选择 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；楼栋引用数据 formal host 已冻结，旧入口仅保留回滚参考 |
| `/api/buildings/:id` `GET, PUT, DELETE` | `formal-host-owned` | `server/routes/buildings.ts` | 旧入口仅 `rollback-only`：`src/app/api/buildings/[id]/route.ts` | 依赖 `src/lib/queries.ts`、`src/lib/prisma.ts`；页面依赖 `/add/room` 内嵌楼栋编辑/删除 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；楼栋引用数据 formal host 已冻结，旧入口仅保留回滚参考 |
| `/api/contracts/activate` `POST` | `compat-wrapper` | `server/routes/contracts.ts` | `src/app/api/contracts/activate/route.ts` | 依赖 `src/lib/domain/contracts/index.ts`；页面与定时激活流程共享合同生命周期语义 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；formal host 已承担正式激活语义，旧入口仅 compat/rollback |
| `/api/contracts` `GET, POST` | `compat-wrapper` | `server/routes/contracts.ts` | `src/app/api/contracts/route.ts` | 依赖 `src/lib/queries.ts`、`src/lib/optimized-queries.ts`、`src/lib/domain/meters/index.ts`；页面依赖 `/contracts`、`/contracts/new`、`/add/contract` | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；合同列表/创建已切到 Hono，旧入口仅 in-process compat proxy |
| `/api/contracts/:id` `GET, PUT` | `compat-wrapper` | `server/routes/contracts.ts` | `src/app/api/contracts/[id]/route.ts` | 依赖 `src/lib/queries.ts`、`src/lib/prisma.ts`；页面依赖 `/contracts/:id`、`/contracts/:id/edit` | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；合同详情/编辑已切到 Hono，旧入口仅 in-process compat proxy |
| `/api/contracts/:id` `DELETE` | `compat-wrapper` | `server/routes/contracts.ts` | `src/app/api/contracts/[id]/route.ts` | 依赖 `src/lib/domain/delete-guards/index.ts`；页面依赖合同删除门禁 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；删除门禁主语义已收口到 Hono + shared delete guard |
| `/api/contracts/:id/generate-bills` `POST` | `compat-wrapper` | `server/routes/contracts.ts` | `src/app/api/contracts/[id]/generate-bills/route.ts` | 依赖 `src/lib/domain/contracts/index.ts`；页面依赖合同补账单动作 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；补账单编排已收口到 Hono/shared service，旧入口仅 compat |
| `/api/contracts/:id/renew` `POST` | `compat-wrapper` | `server/routes/contracts.ts` | `src/app/api/contracts/[id]/renew/route.ts` | 依赖 `src/lib/domain/contracts/index.ts`；页面依赖 `/contracts/:id/renew` | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；续租主语义已收口，旧入口仅 compat |
| `/api/contracts/:id/checkout` `POST` | `compat-wrapper` | `server/routes/checkout.ts` | `src/app/api/contracts/[id]/checkout/route.ts` | 依赖 `src/lib/domain/contracts/index.ts`；页面依赖 `/contracts/:id/checkout`，脚本与路由装配依赖 `server/routes/domain.ts` 的优先挂接 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；checkout formal write host 已独立冻结，旧入口仅 compat/rollback |
| `/api/bills` `GET, POST` | `compat-wrapper` | `server/routes/bills.ts` | `src/app/api/bills/route.ts` | 依赖 `src/lib/queries.ts`、`src/lib/optimized-queries.ts`；页面依赖 `/bills`、`/bills/create`、`/contracts/:id` | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；账单列表/手工创建已切到 Hono，旧入口仅 compat |
| `/api/bills/:id` `GET` | `compat-wrapper` | `server/routes/bills.ts` | `src/app/api/bills/[id]/route.ts` | 依赖 `src/lib/queries.ts`；页面依赖 `/bills/:id` | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；账单详情读取已切到 Hono，旧入口仅 compat |
| `/api/bills/:id` `PATCH, DELETE` | `compat-wrapper` | `server/routes/bills.ts` | `src/app/api/bills/[id]/route.ts` | 依赖 `src/lib/domain/billing/index.ts`；页面依赖 `/bills/:id/edit` 与账单删除门禁 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；账单草稿更新/删除门禁主语义已收口 |
| `/api/bills/:id/status` `PATCH` | `compat-wrapper` | `server/routes/bills.ts` | `src/app/api/bills/[id]/status/route.ts` | 依赖 `src/lib/domain/billing/index.ts`；页面依赖账单收款/状态变更 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；账单状态语义已收口到 formal host |
| `/api/bills/:id/details` `GET` | `compat-wrapper` | `server/routes/bills.ts` | `src/app/api/bills/[id]/details/route.ts` | 依赖 `src/lib/prisma.ts`、`src/lib/bill-cache.ts`；页面依赖账单详情明细与 `BillBasicInfo` | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；账单明细读取已切到 Hono，旧入口仅 compat |
| `/api/bills/:id/utility-details` `GET` | `compat-wrapper` | `server/routes/bills.ts` | `src/app/api/bills/[id]/utility-details/route.ts` | 依赖 `src/lib/queries.ts`、`src/lib/prisma.ts`；页面依赖水电账单详情拆解 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；utility details 读取已在 `phase14-07` 收口到 Hono，旧入口仅 compat |
| `/api/bills/stats` `GET` | `compat-wrapper` | `server/routes/bills.ts` | `src/app/api/bills/stats/route.ts`；桥接：`src/minix/lib/primary-route-data.ts`、`src/minix/routes/bills/BillStatsRoute.tsx` | 依赖 `src/lib/bill-stats.ts`、`src/lib/bill-cache.ts`；页面依赖 `/bills/stats` | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；统计 formal host 已冻结，旧入口与页面桥接均为非阻断兼容层 |
| `/api/meter-readings` `GET` | `compat-wrapper` | `server/routes/meter-readings.ts` | `src/app/api/meter-readings/route.ts` | 依赖 `server/lib/meter-readings-route-service.ts`、`src/lib/queries.ts`；页面依赖 `/meter-readings/history` | 当前端与所有存量调用均切换到统一 Hono 宿主后，旧 `src/app/api/meter-readings/route.ts` compat proxy 可直接移除 | `已满足 parity`；抄表历史读取已切到 Hono，旧入口仅 compat |
| `/api/meter-readings` `POST` | `compat-wrapper` | `server/routes/meter-readings.ts` | `src/app/api/meter-readings/route.ts` | 依赖 `src/lib/domain/meters/index.ts`；页面依赖 `/meter-readings/batch` | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；正式抄表写入与自动出账已收口到 Hono/shared domain |
| `/api/meter-readings/:id` `GET, PUT, DELETE` | `compat-wrapper` | `server/routes/meter-readings.ts` | `src/app/api/meter-readings/[id]/route.ts` | 依赖 `src/lib/domain/meters/index.ts`；页面依赖抄表详情、禁用旧更新入口与删除门禁提示 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；详情/禁改/禁删语义已迁入 formal host，旧入口仅 compat |
| `/api/meter-readings/:id/related-bills` `GET` | `compat-wrapper` | `server/routes/meter-readings.ts` | `src/app/api/meter-readings/[id]/related-bills/route.ts` | 依赖 `src/lib/domain/meters/index.ts`；页面依赖抄表到账单追溯 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；关联账单追溯已切到 formal host |
| `/api/meter-readings/status-check` `GET` | `compat-wrapper` | `server/routes/meter-readings.ts` | `src/app/api/meter-readings/status-check/route.ts` | 依赖 `server/lib/meter-readings-route-service.ts`、`src/lib/reading-status-sync.ts`；页面与治理动作依赖抄表状态巡检 | 当前端与所有存量调用均切换到统一 Hono 宿主后，旧 `src/app/api/meter-readings/status-check/route.ts` compat proxy 可直接移除 | `已满足 parity`；状态巡检 formal host 已冻结，旧入口仅 compat |
| `/api/meter-readings/repair-status` `POST` | `compat-wrapper` | `server/routes/meter-readings.ts` | `src/app/api/meter-readings/repair-status/route.ts` | 依赖 `server/lib/meter-readings-route-service.ts`、`src/lib/reading-status-sync.ts`；页面与治理动作依赖抄表状态修复 | 当前端与所有存量调用均切换到统一 Hono 宿主后，旧 `src/app/api/meter-readings/repair-status/route.ts` compat proxy 可直接移除 | `已满足 parity`；状态修复 formal host 已冻结，旧入口仅 compat |
| `/api/utility-readings` `GET, POST` | `compat-wrapper` | `server/routes/utility-readings.ts` | `src/app/api/utility-readings/route.ts` | 依赖 `src/lib/domain/meters/index.ts`；页面历史兼容尾项与账单/抄表辅助流程依赖 | 当前端与所有存量调用均切换到统一 Hono 宿主后，旧 `src/app/api/utility-readings/route.ts` compat proxy 可直接移除 | `已满足 parity`；utility 历史兼容读写已收口到 Hono，旧入口仅 compat |
| `/api/rooms` `GET, POST` | `compat-wrapper` | `server/routes/rooms.ts` | `src/app/api/rooms/route.ts` | 依赖 `src/lib/queries.ts`、`src/lib/optimized-queries.ts`；页面依赖 `/rooms`、`/add/room`、`/add/contract` | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；房间列表/创建已切到 Hono，旧入口仅 compat |
| `/api/rooms` `PATCH` | `compat-wrapper` | `server/routes/rooms.ts` | `src/app/api/rooms/route.ts` | 依赖 `src/lib/queries.ts`；页面与批量房态更新依赖 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；房间批量状态更新已在 `phase14-07` 切到 Hono，旧入口仅 compat |
| `/api/rooms/batch` `POST` | `compat-wrapper` | `server/routes/rooms.ts` | `src/app/api/rooms/batch/route.ts` | 依赖 `src/lib/queries.ts`、`src/lib/prisma.ts`、`src/lib/mutation-revalidation.ts`；页面依赖批量建房 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；批量建房已切到 Hono，旧入口仅 compat |
| `/api/rooms/:id` `GET, PUT` | `compat-wrapper` | `server/routes/rooms.ts` | `src/app/api/rooms/[id]/route.ts` | 依赖 `src/lib/queries.ts`、`src/lib/prisma.ts`；页面依赖 `/rooms/:id`、`/rooms/:id/edit` | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；房间详情/编辑已切到 Hono，旧入口仅 compat |
| `/api/rooms/:id` `DELETE` | `compat-wrapper` | `server/routes/rooms.ts` | `src/app/api/rooms/[id]/route.ts` | 依赖 `src/lib/domain/delete-guards/index.ts`；页面依赖房间删除门禁 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；房间删除门禁已收口到 Hono + shared delete guard |
| `/api/rooms/:id/status` `PATCH` | `compat-wrapper` | `server/routes/rooms.ts` | `src/app/api/rooms/[id]/status/route.ts` | 依赖 `src/lib/queries.ts`；页面依赖房间单体状态切换 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；房态更新已切到 Hono，旧入口仅 compat |
| `/api/rooms/:id/meters` `GET, POST` | `compat-wrapper` | `server/routes/rooms.ts` | `src/app/api/rooms/[id]/meters/route.ts` | 依赖 `src/lib/queries.ts`；页面依赖房间挂表、抄表前置上下文 | 统一 Hono API 宿主成为唯一对外入口，前端、脚本与存量调用均不再依赖旧 Next.js API | `已满足 parity`；房间挂表链路已切到 Hono，旧入口仅 compat |
| `/api/meters/:meterId` `GET, PUT, DELETE` | `compat-wrapper` | `server/routes/meters.ts` | `src/app/api/meters/[meterId]/route.ts` | 依赖 `src/lib/queries.ts`、`src/lib/prisma.ts`；页面依赖房间仪表详情、更新与受控删除 | 当前端与所有存量调用切换到统一 Hono 宿主后，旧 `src/app/api/meters/[meterId]/route.ts` compat wrapper 可移除 | `已满足 parity`；仪表独立资产 formal/compat 宿主已稳定，旧入口非阻断 |
| `/api/meters/:meterId/status` `PATCH` | `compat-wrapper` | `server/routes/meters.ts` | `src/app/api/meters/[meterId]/status/route.ts` | 依赖 `src/lib/queries.ts`；页面依赖仪表启停切换 | 当前端与所有存量调用切换到统一 Hono 宿主后，旧 `src/app/api/meters/[meterId]/status/route.ts` compat wrapper 可移除 | `已满足 parity`；仪表状态切换已切到 Hono，旧入口仅 compat |
| `/api/renters` `GET, POST` | `compat-wrapper` | `server/routes/renters.ts` | `src/app/api/renters/route.ts` | 依赖 `server/lib/renters-route-service.ts`、`src/lib/optimized-queries.ts`、`src/lib/queries.ts`；页面依赖 `/renters`、`/renters/new`、`/add/contract` | 当前端与所有存量调用均切换到统一 Hono 宿主后，旧 `src/app/api/renters/route.ts` compat proxy 可直接移除 | `已满足 parity`；renters 列表/创建已切到 Hono，旧入口仅 compat |
| `/api/renters/:id` `GET, PUT, DELETE` | `compat-wrapper` | `server/routes/renters.ts` | `src/app/api/renters/[id]/route.ts` | 依赖 `server/lib/renters-route-service.ts`、`src/lib/queries.ts`；页面依赖 `/renters/:id`、`/renters/:id/edit` | 当前端与所有存量调用均切换到统一 Hono 宿主后，旧 `src/app/api/renters/[id]/route.ts` compat proxy 可直接移除 | `已满足 parity`；renters 详情/编辑/删除已切到 Hono，旧入口仅 compat |
| `/api/renters/stats` `GET` | `compat-wrapper` | `server/routes/renters.ts` | `src/app/api/renters/stats/route.ts` | 依赖 `server/lib/renters-route-service.ts`、`src/lib/queries.ts`；页面依赖租客统计卡片与路由首屏数据 | 当前端与所有存量调用均切换到统一 Hono 宿主后，旧 `src/app/api/renters/stats/route.ts` compat proxy 可直接移除 | `已满足 parity`；renters stats 已切到 Hono，旧入口仅 compat |
| `/api/settings` `GET, POST, DELETE` | `compat-wrapper` | `server/routes/settings.ts` | `src/app/api/settings/route.ts` | 依赖 `src/lib/global-settings.ts`；页面依赖 `/settings` 首屏读写与重置 | 当前端与所有存量调用均切换到统一 Hono settings 宿主后，旧 `src/app/api/settings*` 路由可直接移除 | `已满足 parity`；settings 正式宿主已切到 Hono，旧入口仅 compat |
| `/api/settings/init` `POST` | `compat-wrapper` | `server/routes/settings.ts` | `src/app/api/settings/init/route.ts` | 依赖 `src/lib/global-settings.ts`；页面依赖设置初始化动作 | 当前端与所有存量调用均切换到统一 Hono settings 宿主后，旧 `src/app/api/settings*` 路由可直接移除 | `已满足 parity`；settings 初始化已切到 Hono，旧入口仅 compat |
| `/api/dashboard/stats` `GET` | `compat-wrapper` | `server/routes/dashboard.ts` | `src/app/api/dashboard/stats/route.ts` | 依赖 `src/lib/dashboard-formal-host.ts`；页面依赖首页统计卡片与 `useStatistics` | 当前端与所有存量调用均切换到统一 Hono dashboard 宿主后，旧 `src/app/api/dashboard/*` 路由可直接移除 | `已满足 parity`；dashboard stats 已切到 Hono，旧入口仅 compat |
| `/api/dashboard/contract-alerts` `GET` | `compat-wrapper` | `server/routes/dashboard.ts` | `src/app/api/dashboard/contract-alerts/route.ts` | 依赖 `src/lib/dashboard-formal-host.ts`；页面依赖首页合同提醒 | 当前端与所有存量调用均切换到统一 Hono dashboard 宿主后，旧 `src/app/api/dashboard/*` 路由可直接移除 | `已满足 parity`；dashboard 告警查询已切到 Hono，旧入口仅 compat |
| `/api/dashboard/upcoming-contracts` `GET` | `compat-wrapper` | `server/routes/dashboard.ts` | `src/app/api/dashboard/upcoming-contracts/route.ts` | 依赖 `src/lib/dashboard-formal-host.ts`；页面依赖首页即将到期合同卡片 | 当前端与所有存量调用均切换到统一 Hono dashboard 宿主后，旧 `src/app/api/dashboard/*` 路由可直接移除 | `已满足 parity`；dashboard upcoming 合同查询已切到 Hono，旧入口仅 compat |
| `/api/dashboard/leaving-tenants` `GET` | `compat-wrapper` | `server/routes/dashboard.ts` | `src/app/api/dashboard/leaving-tenants/route.ts` | 依赖 `src/lib/dashboard-formal-host.ts`；页面依赖首页退租提醒卡片 | 当前端与所有存量调用均切换到统一 Hono dashboard 宿主后，旧 `src/app/api/dashboard/*` 路由可直接移除 | `已满足 parity`；dashboard leaving-tenants 查询已切到 Hono，旧入口仅 compat |
| `/api/dashboard/overdue-payments` `GET` | `compat-wrapper` | `server/routes/dashboard.ts` | `src/app/api/dashboard/overdue-payments/route.ts` | 依赖 `src/lib/dashboard-formal-host.ts`；页面依赖首页逾期付款卡片 | 当前端与所有存量调用均切换到统一 Hono dashboard 宿主后，旧 `src/app/api/dashboard/*` 路由可直接移除 | `已满足 parity`；dashboard overdue-payments 查询已切到 Hono，旧入口仅 compat |
| `/api/dashboard/unpaid-rent` `GET` | `compat-wrapper` | `server/routes/dashboard.ts` | `src/app/api/dashboard/unpaid-rent/route.ts` | 依赖 `src/lib/dashboard-formal-host.ts`；页面依赖首页退租未结卡片 | 当前端与所有存量调用均切换到统一 Hono dashboard 宿主后，旧 `src/app/api/dashboard/*` 路由可直接移除 | `已满足 parity`；dashboard unpaid-rent 查询已切到 Hono，旧入口仅 compat |
| `/api/dashboard/vacant-rooms` `GET` | `compat-wrapper` | `server/routes/dashboard.ts` | `src/app/api/dashboard/vacant-rooms/route.ts` | 依赖 `src/lib/dashboard-formal-host.ts`；页面依赖首页空房提醒卡片 | 当前端与所有存量调用均切换到统一 Hono dashboard 宿主后，旧 `src/app/api/dashboard/*` 路由可直接移除 | `已满足 parity`；dashboard vacant-rooms 查询已切到 Hono，旧入口仅 compat |
| `/api/health/system` `GET` | `retained-legacy` | `-` | `src/app/api/health/system/route.ts` | 依赖 `src/lib/health-checker.ts`、`src/lib/observability.ts`；治理/细分健康检查脚本依赖 | 待后续治理阶段明确是否保留细分辅助健康检查，再决定统一承接位或归档退出策略 | `非阻断 retained-legacy`；仅治理/辅助接口，不承担正式业务主职责 |
| `/api/health/bills` `GET` | `retained-legacy` | `-` | `src/app/api/health/bills/route.ts` | 依赖 `src/lib/health-checker.ts`、`src/lib/observability.ts`；账务细分健康检查依赖 | 待后续治理阶段明确是否保留账务细分辅助健康检查，再决定统一承接位或归档退出策略 | `非阻断 retained-legacy`；仅治理/辅助接口，不承担正式业务主职责 |
| `/api/bills/repair-details` `GET, POST` | `retained-legacy` | `-` | `src/app/api/bills/repair-details/route.ts` | 依赖 `src/lib/prisma.ts`；治理修复与排障辅助依赖 | 待后续治理阶段明确 repair 工具链归属后，再决定归档、脚本化或统一宿主 | `非阻断 retained-legacy`；仅治理/修复接口，不承担正式业务主职责 |
| `/api/validation` `GET, POST` | `retained-legacy` | `-` | `src/app/api/validation/route.ts` | 依赖 `src/lib/validation.ts`；设置/治理辅助入口依赖 | 待后续治理阶段明确 validation 辅助接口是否改造为脚本/表单层能力后，再评估去向 | `非阻断 retained-legacy`；仅治理/辅助接口，不承担正式业务主职责 |
| `/api/data-consistency` `GET, POST` | `retained-legacy` | `-` | `src/app/api/data-consistency/route.ts` | 依赖 `src/lib/prisma.ts`；数据一致性巡检/修复辅助依赖 | 待后续治理阶段明确数据一致性巡检与修复工具承接位后，再决定脚本化或归档 | `非阻断 retained-legacy`；仅治理/辅助接口，不承担正式业务主职责 |
| `/api/meter-history-stats` `GET, POST` | `retained-legacy` | `-` | `src/app/api/meter-history-stats/route.ts` | 依赖 `src/lib/prisma.ts`；仪表历史统计/修复辅助依赖 | 待后续阶段统一处理仪表历史统计与修复辅助宿主时，再评估迁移或归档 | `非阻断 retained-legacy`；仅治理/统计辅助接口，不承担正式业务主职责 |

### 4.3 PWA/runtime parity matrix
- 基线范围固定为安装提示、更新提示、`manifest.json`、`sw.js`、`/offline`、静态头策略与 PWA smoke 入口。
- 每行至少记录：
  - 能力项
  - 当前 formal runtime host
  - 本地 PC 结果
  - 移动端 HTTP 结果
  - 正式 HTTPS 判断基线
  - 差异分类
  - 对 cutover 的影响
  - 当前结论
  - 证据来源
- 判断规则：
  - 本地移动端 HTTP 无安装入口不构成 blocker
  - 带公认 HTTPS 证书环境下的移动端安装/更新/离线结果是最终判断基线
  - 旧 Next PWA 宿主若只剩参考/回滚价值，可作为 non-blocking legacy reference
- 当前回填结论：
  - `7` 条能力项已完成回填：`6` 条 `已满足 parity`、`1` 条 `存在可接受宿主差异，可忽略`
  - `0` 条 PWA/runtime 能力项构成当前 `phase16` `parity-blocker`
  - 本地 `PC + Edge/Chrome + HTTP` 的安装与登录链路已由 `phase15` 人工验收记录覆盖，可作为当前 matrix 的既有运行时证据
  - 本地移动端 `HTTP` 无统一安装入口继续归类为 `acceptable-adaptation`，不单独上调为 blocker
  - 带公认 HTTPS 证书环境下的 Android + Chrome 安装、更新与离线兜底仍需在 `phase16-03` 完成最终人工复验；这属于既定后续验证动作，不改变当前“能力已落位”的 matrix 结论
- 差异分类编码：
  - `P1 / acceptable-adaptation`：`VITE_ENABLE_PWA` 是构建期开关；切换启用/关闭态需要重建 `dist/`，不等同于 legacy Next 运行时变量热切换
  - `P2 / acceptable-adaptation`：本地移动端 `HTTP` 不出现安装提示由浏览器安全上下文决定，继续按普通 Web 退化
  - `P3 / non-blocking-legacy-reference`：旧 Next PWA 宿主只保留参考/回滚价值，不再承担正式 `manifest`、`sw.js`、安装提示或更新提示主职责

| 能力项 | 当前 formal runtime host | 本地 PC 结果 | 移动端 HTTP 结果 | 正式 HTTPS 判断基线 | 差异分类 | 对 cutover 的影响 | 当前结论 | 证据来源 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 运行时挂载与 PWA 开关 | `src/minix/layout/MinixRuntimeLayout.tsx` + `index.html` 中的 `manifest` / `theme-color` / `rento-pwa-enabled` meta | 可在纯新主线壳层挂载 `PwaRuntimeManager` / `PwaInstallPrompt`；`phase15` 已记录 PC 本地安装链路通过 | 页面壳与 metadata 仍可交付，但是否出现安装能力继续受安全上下文约束 | 在 `npm run build:minix:pwa` 产物下，正式域名需继续以同一套 `manifest` / runtime 壳交付 | `P1 + P3` | 不阻断；只要求后续部署时使用正确构建 profile，而不是回退 legacy 宿主 | `已满足 parity` | `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md` 4.1、7、8 + `src/minix/layout/MinixRuntimeLayout.tsx` + `index.html` |
| 安装提示与平台退化 | `src/components/pwa/PwaInstallPrompt.tsx` + `src/components/pwa/usePwaInstallState.ts` | `phase15` 已记录 `PC + Edge/Chrome + HTTP` 可看到安装提示并完成安装/登录链路 | 本地移动端 `HTTP` 无统一安装入口，继续按普通 Web 退化；iOS 仅保留最小手动安装说明 | Android + Chrome + HTTPS 仍是正式安装判断基线；iOS 继续只承诺最小说明，不承诺同等级体验 | `P2 + P3` | 不阻断；后续只需把正式 HTTPS 实机记录补入 `phase16-03` | `存在可接受宿主差异，可忽略` | `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md` 5、7、8 + `src/components/pwa/PwaInstallPrompt.tsx` + `src/components/pwa/usePwaInstallState.ts` |
| `manifest.json` 元数据与图标集 | `public/manifest.json` + `index.html` `<link rel="manifest">` | 本地可交付完整 `name` / `short_name` / `start_url` / `scope` / `display` / icons 元数据 | 同一份 `manifest` 继续可被访问；是否展示安装入口不改变元数据交付 | 正式 HTTPS 需继续复核 installability 结果是否与当前 `manifest` 字段保持一致 | `P3` | 不阻断；`manifest` 真相源已经单一化 | `已满足 parity` | `public/manifest.json` + `index.html` + `scripts/pwa-smoke-check.sh` |
| Service Worker 缓存边界 | `public/sw.js` | 静态壳、图标、`manifest` 与 `/offline` 可进入 SW cache；`/api/*` 明确排除在缓存外 | 若安全上下文不满足则不注册 SW，但“不缓存动态业务接口”的边界不变 | 正式 HTTPS 需继续验证注册后仍只缓存静态壳、不缓存 `/api/*` 与登录态业务页面 | `P3` | 不阻断；缓存真相源已维持单一且受控 | `已满足 parity` | `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md` 6 + `public/sw.js` |
| 更新提示与 `SKIP_WAITING` | `src/components/pwa/PwaRuntimeManager.tsx` + `public/sw.js` | 运行时已具备 waiting worker 提示、`SKIP_WAITING` 与 `controllerchange` 自动刷新链路 | 无 SW 时自然退化为普通刷新，不出现独立更新提示 | 正式 HTTPS 需在 Android + Chrome 上补充 waiting worker -> 刷新接管的人工记录 | `P2 + P3` | 不阻断；更新链路已具备，后续只差正式环境人工证据 | `已满足 parity` | `src/components/pwa/PwaRuntimeManager.tsx` + `public/sw.js` + `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md` 6、7 |
| `/offline` 最小离线兜底 | `src/minix/routes/OfflinePage.tsx` + `src/minix/router/index.tsx` + `public/sw.js` | `/offline` 路由已落位，可作为最小离线页直接访问 | 本地移动端 `HTTP` 下即便未注册 SW，也可直接访问 `/offline` 路由 | 正式 HTTPS 仍需复核断网导航时是否稳定回退到 `/offline` | `P3` | 不阻断；最小离线兜底页已具备单一落位 | `已满足 parity` | `src/minix/routes/OfflinePage.tsx` + `src/minix/router/index.tsx` + `public/sw.js` + `scripts/pwa-smoke-check.sh` |
| 静态头策略与 smoke 入口 | `server/lib/static.ts` + `scripts/pwa-smoke-check.sh` | 已定义 `index.html` / `manifest.json` / `sw.js` / hashed assets 的头策略检查口径 | 本地移动端 `HTTP` 仍可复用同一 smoke 口径做最小校验 | 正式 HTTPS 继续以 `production-ready` profile + `/api/health` + `/offline` 作为部署后工程验证入口 | `P1 + P3` | 不阻断；正式部署后的自动化入口已冻结 | `已满足 parity` | `server/lib/static.ts` + `scripts/pwa-smoke-check.sh` + `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md` 6、7 |

### 4.4 deploy / cutover / rollback matrix
- 基线范围固定为正式部署入口、legacy 回滚入口、健康检查、主链 smoke、PWA 构建 profile 与演练记录。
- 每行至少记录：
  - 能力项
  - formal host / formal entry
  - legacy 入口 / rollback base
  - 触发条件
  - 验证证据
  - 回滚窗口
  - 差异分类
  - 当前结论
- 判断规则：
  - `npm run build:minix` / `npm run start:minix` / `/api/health` / 主链 smoke 构成正式主线验证入口
  - `LEGACY_START=1 npm run start`、`docker-compose.yml`、`nginx/nginx.conf` 与相关脚本只保留 rollback / 对照职责
- 当前回填结论：
  - `6` 条能力项已完成回填：`4` 条 `已满足 parity`、`1` 条 `non-blocking-legacy-reference`、`1` 条 `待 phase16-03 ~ phase16-04 执行的审核动作`
  - 正式入口、正式公网代理、正式守护进程与正式健康检查链路都已形成单一解释，不再要求旧容器化运行线承担默认主入口职责
  - legacy 资产当前统一归类为 `rollback-only`，继续保留直到 cutover 审核、正式部署演练与 legacy 回滚演练记录闭环完成
  - 当前未执行正式部署演练与 legacy 回滚演练，因此本 matrix 只回填“入口与职责是否冻结”的当前结论，不提前给出 `phase16` 最终通过/未通过判断
- 差异分类编码：
  - `D1 / formal-host-owned`：由 `build:minix` / `start:minix`、`Caddy`、`systemd`、`/api/health` 组成的正式主线入口
  - `D2 / acceptable-adaptation`：部署拓扑从 `docker-compose + nginx + Next.js standalone` 切换为 `Caddy + systemd + Hono`，属于已批准的主线替代
  - `D3 / rollback-only`：legacy 容器化资产只承担回滚、差异对照与只读参考职责
  - `D4 / evidence-pending`：演练记录、cutover 审核包与最终 legacy-exit 判断留待 `phase16-03 ~ phase16-04` 回填

| 能力项 | formal host / formal entry | legacy 入口 / rollback base | 触发条件 | 验证证据 | 回滚窗口 | 差异分类 | 当前结论 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 正式构建与生产启动入口 | `npm run build:minix` / `npm run build:minix:pwa` + `npm run start:minix` + `scripts/start-minix.mjs` | `LEGACY_START=1 npm run start` + `scripts/start-entry.mjs` | 需要交付纯新主线产物、或按 PWA profile 重建 `dist/` 时 | `DEPLOYMENT.md` 正式脚本边界、`scripts/start-minix.mjs` 对 `dist/index.html` 与 `build/minix-server/index.mjs` 的存在性校验、`scripts/start-entry.mjs` 的 legacy-only 启动门禁 | 截至 `phase16` 审核通过前，legacy 启动入口继续保留为对照/回滚入口 | `D1 + D2 + D3` | `已满足 parity`；正式入口已单值化，legacy 启动只剩 rollback-only 身份 |
| 正式公网入口与反向代理 | `deploy/caddy/Caddyfile` 反向代理到 `127.0.0.1:${MINIX_SERVER_PORT}` | `nginx/nginx.conf` + `docker-compose.yml` 中的 `nginx -> app:3001` | 需要以正式域名、`80/443` 与 HTTPS 承接对外流量时 | `DEPLOYMENT.md` 正式部署拓扑、`deploy/caddy/Caddyfile`、legacy `nginx/nginx.conf` 与 `docker-compose.yml` | 在正式 `Caddy` 演练与 cutover 审核通过前，legacy `nginx` 继续保留 | `D1 + D2 + D3` | `已满足 parity`；正式公网入口已冻结为 Caddy，legacy nginx 仅回滚参考 |
| 正式进程托管与单一运行时 | `deploy/systemd/rento-minix.service` + Hono 单进程 | `docker-compose.yml` 中 `app` 容器与 `restart: unless-stopped` | 需要常驻托管纯新主线 Hono runtime 时 | `deploy/systemd/rento-minix.service` 的 `ExecStart=/usr/bin/node .../scripts/start-minix.mjs`、`DEPLOYMENT.md` 正式资产基线 | 在 systemd 演练与回滚验证完成前，legacy app 容器继续保留 | `D1 + D2 + D3` | `已满足 parity`；正式守护链路已单值化，不再默认依赖容器编排 |
| 主健康入口与最小 smoke | `/api/health` + `scripts/health-check.sh` + `scripts/pwa-smoke-check.sh` | `docker-compose.yml` 中容器 healthcheck 与 legacy 细分健康路径 | 需要验证正式运行时可用性、PWA 头策略与基本静态壳交付时 | `scripts/health-check.sh`、`scripts/pwa-smoke-check.sh`、`server/lib/static.ts`、`DEPLOYMENT.md` 健康检查口径 | 在正式部署演练记录补齐前，legacy healthcheck 仍可用于差异对照 | `D1 + D2 + D3` | `已满足 parity`；正式健康/最小 smoke 入口已冻结为纯新主线脚本组合 |
| legacy 回滚资产保留边界 | `DEPLOYMENT.md` 中的保留条件、退出条件与 cutline 说明 | `docker-compose.yml`、`nginx/nginx.conf`、`scripts/start-entry.mjs` | 需要执行故障回滚、存量运行线对照或 legacy-only 验证时 | `DEPLOYMENT.md` legacy 回滚基线章节 + 相关 legacy 资产文件 | 直到 `phase16-04` 完成退出判断前持续保留 | `D3` | `non-blocking-legacy-reference`；legacy 资产仍在，但已不承担正式主职责 |
| cutover / rollback 审核记录 | `docs/phase16_*` + `DEPLOYMENT.md` 引用摘要 | legacy 仅提供回滚入口与记录对象，不再提供第二套真相源 | 需要输出正式部署演练记录、legacy 回滚演练记录、回滚触发条件与最终 cutover 审核包时 | `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md` 第 7~9 节 + `DEPLOYMENT.md` 部署演练记录要求 | 直到 `phase16-03 ~ phase16-04` 执行完毕前都处于开放窗口 | `D4` | `待后续阶段执行`；当前只冻结字段与承接位，不提前给出最终 cutover/rollback 结论 |

## 五、共享判断标准
- 不把“旧文件仍存在”直接等同于“重构未完成”。
- 不把“功能表现有技术适配差异”直接等同于“迁移遗漏”。
- 不把“仍保留 legacy 资产”直接等同于“仍依赖 legacy 正式运行”。
- 只有当旧入口仍承担正式业务主职责，或会阻断纯新主线正式交付时，才允许判为 `parity-blocker`。

## 六、最小验证要求
- 文档与路径验证：
  - `docs/phase16_*` 三份文档互链复核
  - 被引用路径存在性复核
- 自动化验证：
  - `npm run lint`
  - `npm run type-check`
  - `npm run build:minix`
  - `npm run audit:phase09:legacy-routes`
  - `npm run smoke:phase09:all`
  - `npm run smoke:phase14:wave2`
  - `npm run build:minix:pwa`
  - `bash ./scripts/pwa-smoke-check.sh --profile production-ready --base-url <runtime-url>`
  - `bash ./scripts/health-check.sh --url <runtime-url>`
- 人工验收：
  - 页面主链人工浏览器对照
  - PC 浏览器 PWA 安装/登录链路
  - 带公认 HTTPS 证书环境下的 Android + Chrome 安装/更新/离线验证
  - 正式部署环境主链可访问性
  - legacy 回滚入口可恢复性

## 七、cutover 审核包要求
- 至少包含：
  - 四类 parity matrix
  - 自动化验证结果
  - 人工浏览器验收记录
  - 正式部署演练记录
  - legacy 回滚演练记录
  - 回滚触发条件
  - 最终结论
- 结论只允许两种：
  - `通过`
  - `未通过但单值化`

## 八、legacy 退出边界
- legacy 资产的保留原因、退出条件、回滚价值与当前耦合关系都必须被写清。
- 在 cutover 审核通过前，legacy 资产默认继续保留为回滚基线。
- 只有当正式替代入口、验证结果与回滚记录都冻结后，legacy 资产才允许进入归档或退出决策。

## 九、明确不做
- 不重开正式业务 API 迁移。
- 不重开页面实现或视觉重设计。
- 不重开 PWA 新方案选型或离线数据库议题。
- 不在本阶段直接删除 legacy 容器化资产、旧页面原型或旧 API 文件。

## 十、证据产物固定落位
- 页面 parity matrix 固定落位在“4.1 页面 parity matrix”。
- API/query parity matrix 固定落位在“4.2 API/query parity matrix”。
- PWA/runtime parity matrix 固定落位在“4.3 PWA/runtime parity matrix”。
- deploy / cutover / rollback matrix 固定落位在“4.4 deploy / cutover / rollback matrix”。
- 本文件只承接最终 matrix、差异分类与共享判断标准，不承接临时过程记录。
- `phase16-01` 当前轮已完成四类 matrix 回填；仍不提前给出“通过/未通过”阶段结论，也不把后续自动化验证、人工验收或 legacy 退出判断混写到 matrix 章节。
- 自动化验证结果、人工浏览器验收、部署/回滚演练记录与 legacy 退出判断固定回写到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md` 的对应章节，再由根级真相源与 `DEPLOYMENT.md` 引用摘要。
