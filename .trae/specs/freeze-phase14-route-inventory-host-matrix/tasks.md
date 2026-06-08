# Tasks

- [x] 任务 1：复核 `phase14-01` 的输入范围并建立本轮盘点边界
  - [x] 子任务 1.1：对照 `docs/phase14_*` 与 `docs/phase13_*`，确认本子任务只覆盖 route inventory 分类、host matrix、页面影响面与 drain 优先级输入
  - [x] 子任务 1.2：确认 `server/lib/legacy-route-inventory.ts`、`server/routes/domain.ts`、`server/routes/*.ts`、`src/app/api/**/route.ts`、`src/lib/page-closure-compat/*` 全部纳入盘点范围
  - [x] 子任务 1.3：确认本子任务不越界到 API 切流实现、旧路由删除、query helper 重写或页面迁移返工

- [x] 任务 2：冻结 route inventory 的统一分类与正式宿主判定规则
  - [x] 子任务 2.1：为 `formal-host-owned`、`compat-wrapper`、`retained-legacy` 补齐 `phase14` 语境下的统一判断标准
  - [x] 子任务 2.2：明确“已有 Hono 路由但仍不算正式宿主”的统一判定规则
  - [x] 子任务 2.3：把 `formalHosts`、`bridgeHosts`、`domainServicePaths`、`keepReason`、`exitCondition`、`rollbackCondition` 组织成后续子任务可直接复用的 host matrix 字段集

- [x] 任务 3：建立分域 host matrix 与 drain 优先级
  - [x] 子任务 3.1：按 `dashboard`、`settings`、`rooms/buildings/meters`、`contracts/checkout`、`bills`、`renters`、`meter-readings/utility`、`governance` 输出分域矩阵
  - [x] 子任务 3.2：为每个业务域明确“当前分类 + 当前正式宿主 + bridge 边界 + 页面影响面 + drain 优先级”
  - [x] 子任务 3.3：把治理/辅助接口与正式业务 API 明确拆开，避免把治理路径误判为已完成切流

- [x] 任务 4：把 `phase13` 页面交接表绑定到 route inventory
  - [x] 子任务 4.1：把首页、设置、房源、合同、账单、租客、抄表等正式页面与对应 retained-legacy API/query 建立显式映射
  - [x] 子任务 4.2：明确哪些页面仍直接受 dashboard/settings/bills-stats/shared compat helper 影响
  - [x] 子任务 4.3：保证后续 `phase14-02 ~ phase14-07` 可直接引用该页面影响面，不再重复审计页面范围

- [x] 任务 5：完成文档与真实代码状态的一致性验证
  - [x] 子任务 5.1：复核 host matrix 覆盖 `server/routes/*`、`src/app/api/*` 与 `server/lib/legacy-route-inventory.ts` 的真实路径
  - [x] 子任务 5.2：复核 `docs/phase14_*`、`docs/phase13_*`、`plan.md`、`AGENTS.md`、`project_rules.md` 中关于 `phase14-01` 的边界与本次冻结结果一致
  - [x] 子任务 5.3：确认本子任务未进入实现、未删除旧路由、未重写 query helper，且输出可直接作为 `phase14-02` 的上游输入

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 1、任务 2
- 任务 4 依赖任务 1、任务 3
- 任务 5 依赖任务 2、任务 3、任务 4
