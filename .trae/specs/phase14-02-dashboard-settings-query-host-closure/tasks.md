# Tasks

- [x] D1 冻结顺序：先统一 dashboard query host 与 page-closure bridge，再统一 settings API 身份与治理边界，最后统一首页 `/`、设置页 `/settings` 与 governance 辅助接口的页面影响解释

- [x] 任务 1：复核 `phase14-02` 的输入边界并建立 dashboard/settings 盘点范围
  - [x] 子任务 1.1：对照 `docs/phase14_*` 与 `phase14-01` host matrix，确认本子任务只覆盖 dashboard/settings 的 query host、bridge 角色、治理边界、页面影响与 D1 顺序
  - [x] 子任务 1.2：确认 `server/routes/dashboard.ts`、`server/routes/settings.ts`、`src/app/api/dashboard/**/route.ts`、`src/app/api/settings/**/route.ts`、`src/lib/page-closure-compat/dashboard.ts`、`src/lib/dashboard-queries.ts`、`src/lib/global-settings.ts` 全部纳入盘点范围
  - [x] 子任务 1.3：确认本子任务不越界到 dashboard 新 query model、settings 权限/审计体系、治理页面迁移或页面重构

- [x] 任务 2：冻结 dashboard 域的 query host 与 bridge 解释
  - [x] 子任务 2.1：逐条盘点 `/api/dashboard/*` 当前由 Hono、旧 Next、compat helper 或 query helper 承接的关系
  - [x] 子任务 2.2：明确 `server/routes/dashboard.ts` 当前仅属于 page-closure bridge；`/stats`、`/contract-alerts`、`/upcoming-contracts`、`/leaving-tenants`、`/vacant-rooms` 已由 bridge 承接，`/overdue-payments` 与 `/unpaid-rent` 仍完全 retained-legacy
  - [x] 子任务 2.3：冻结 dashboard 的 `inventoryScope`、`dominantCategory`、`formalHosts`、`bridgeHosts`、`domainServicePaths`、`pageImpact`、`drainPriority` 与 `freezeConclusion`，并将页面影响面固定为首页 `/`

- [x] 任务 3：冻结 settings 域的 API 身份与治理边界
  - [x] 子任务 3.1：逐条盘点 `/api/settings` 与 `/api/settings/init` 当前由 Hono、旧 Next 与 `globalSettings` 共同承接的关系
  - [x] 子任务 3.2：明确 `server/routes/settings.ts` 当前属于最小治理兼容宿主，而不是正式业务 API 已切流
  - [x] 子任务 3.3：冻结 settings 的治理边界、页面影响面与后续 drain 顺序，并将页面影响面固定为 `/settings`

- [x] 任务 4：收口首页/设置页与治理接口的边界解释
  - [x] 子任务 4.1：把首页 `/` 与 dashboard retained-legacy/query helper/page-closure bridge 的关系写成单一解释
  - [x] 子任务 4.2：把设置页 `/settings` 与 settings retained-legacy/治理初始化入口的关系写成单一解释
  - [x] 子任务 4.3：明确 `/api/validation`、`/api/data-consistency`、健康辅助与 repair/status-check 等 governance 辅助接口仍属延后范围，不包装成 dashboard/settings 已完成切流的证据

- [x] 任务 5：完成文档与 spec 的一致性验证
  - [x] 子任务 5.1：确认 `docs/phase14_*` 已同步 `phase14-02` 的冻结结论，并继续复用 `phase14-01` host matrix 字段集
  - [x] 子任务 5.2：确认本子任务输出可直接作为 `phase14-03-rooms-buildings-meters-api-drain` 的 D1 上游输入
  - [x] 子任务 5.3：确认本子任务未进入实现、未改写 query model、未扩大治理范围，并完成独立审核结论回写

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 1
- 任务 4 依赖任务 2、任务 3
- 任务 5 依赖任务 2、任务 3、任务 4
