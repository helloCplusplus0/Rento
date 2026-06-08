# Tasks

- [x] 任务 1：复核 `phase14-04` 输入边界并建立 contracts/checkout 盘点范围
  - [x] 子任务 1.1：对照 `docs/phase14_*`、`phase14-03` 输出与 `phase09` 合同主链结论，确认本子任务只覆盖合同读写/compat/checkout 宿主解释、挂载优先级与页面影响交接
  - [x] 子任务 1.2：确认 `server/routes/contracts.ts`、`server/routes/checkout.ts`、`server/routes/domain.ts`、`src/app/api/contracts/**/route.ts`、`src/lib/domain/contracts/index.ts`、`src/lib/domain/delete-guards/index.ts`、`server/lib/legacy-route-inventory.ts` 全部纳入盘点范围
  - [x] 子任务 1.3：确认本子任务不越界到合同业务语义改写、续租/退租规则重写、页面表单改造或旧路由删除

- [x] 任务 2：冻结 contracts 域的 retained-legacy / compat-wrapper 解释
  - [x] 子任务 2.1：逐条盘点 `/api/contracts`、`/api/contracts/:id`、`/api/contracts/activate`、`/api/contracts/:id/renew`、`/api/contracts/:id/generate-bills`、`DELETE /api/contracts/:id` 当前由 Hono、旧 Next、共享领域服务或删除门禁承接的关系
  - [x] 子任务 2.2：明确 `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 当前仍属 retained-legacy drain，但统一 `/api` runtime 的当前对外请求宿主已是 `server/routes/contracts.ts`；激活、续租、补账单、删除继续由其承接为 compat-wrapper
  - [x] 子任务 2.3：冻结 contracts 域的 `inventoryScope`、`dominantCategory`、`formalHosts`、`bridgeHosts`、`domainServicePaths`、`pageImpact`、`drainPriority` 与 `freezeConclusion`

- [x] 任务 3：冻结 checkout 子域的正式写入口与 compat 边界
  - [x] 子任务 3.1：逐条盘点 `/api/contracts/:contractId/checkout` 在 `server/routes/checkout.ts`、旧 Next compat wrapper 与共享领域服务中的职责关系
  - [x] 子任务 3.2：明确 checkout 正式事务编排位于 `server/routes/checkout.ts` + `src/lib/domain/contracts/index.ts`，旧入口仅保留 compat-wrapper 与回滚价值
  - [x] 子任务 3.3：冻结 checkout 相关 `domainServicePaths`、`pageImpact` 与 exit 条件解释

- [x] 任务 4：收口 checkout 挂载优先级、页面影响与合同锚点约束
  - [x] 子任务 4.1：明确 `server/routes/domain.ts` 中 `'/contracts/:contractId/checkout'` 必须先于 `'/contracts'` 挂接，且该结论与 Hono 路由顺序一致
  - [x] 子任务 4.2：把 `/contracts*`、`/contracts/:id`、续租、退租、补账单相关页面影响写成单一解释，并继续复用 `phase13` 页面交接
  - [x] 子任务 4.3：确认本子任务继续保持合同锚点、历史数据保留与删除门禁约束，不把 query parity 与页面 parity 混写

- [x] 任务 5：完成文档与 spec 的一致性验证
  - [x] 子任务 5.1：确认 `docs/phase14_*`、`phase14-03` 与 `phase09` 相关 spec 可共同支撑 `phase14-04` 的单一解释
  - [x] 子任务 5.2：确认本子任务未把 contracts 整域误写成“已完成切流”，也未把 checkout route priority 漏写
  - [x] 子任务 5.3：确认本子任务未进入实现、未删除旧路由，并为后续真实实现层提供可直接复用的上游输入

- [x] 验收修复项 6：收口 contracts retained-legacy 冻结口径与实际 Hono 宿主暴露的冲突
  - [x] 子任务 6.1：修复 `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 的单一解释；统一为“当前 drain 分类仍是 retained-legacy，但统一 `/api` runtime 的对外请求宿主已由 `server/routes/contracts.ts` 暴露同名 GET/POST/PUT，旧 Next 文件仅保留镜像实现与回滚基线”
  - [x] 子任务 6.2：修复 `server/routes/contracts.ts` 中 `LEGACY_COMPAT.reason` 与 `phase14-04` 冻结口径冲突；改为区分“生命周期/删除 compat-wrapper”与“GET/POST/PUT 仍属 retained-legacy drain”的并存事实
  - [x] 子任务 6.3：同步升级 `phase14-04` spec/docs/inventory 的分类说明，恢复 contracts 域“统一 Hono 请求宿主已暴露 + retained-legacy drain 未完成 + checkout formal write host 独立存在”的单一上游输入

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 1
- 任务 4 依赖任务 2、任务 3
- 任务 5 依赖任务 2、任务 3、任务 4
