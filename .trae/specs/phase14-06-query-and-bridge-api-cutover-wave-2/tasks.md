# Tasks
- [x] Task 1: 盘点 dashboard / settings / renters / meter-readings / utility 当前 query host、bridge helper 与 retained-legacy 残留，确认 wave-2 的真实 cutover 范围。
  - [x] SubTask 1.1: 核对 `server/routes/dashboard.ts`、`settings.ts`、`renters.ts`、`meter-readings.ts` 与对应 `src/app/api/**/route.ts` 的正式职责映射
  - [x] SubTask 1.2: 核对首页、设置页、租客页、抄表页与 utility 相关页面/API/query 的当前调用方向
  - [x] SubTask 1.3: 列出必须迁出的 retained-legacy query host、必须降级的 shared compat helper 与允许保留的治理型/回滚边界

- [x] Task 2: 完成 dashboard / settings 的 query host cutover。
  - [x] SubTask 2.1: 把首页主查询与 dashboard bridge 相关路径切到统一 Hono 宿主或明确冻结的最终 compat 宿主
  - [x] SubTask 2.2: 把 settings 的治理型 retained-legacy 入口迁为正式宿主或明确的最终 compat 宿主，收口 `src/lib/global-settings.ts` 与旧 Next 路由职责
  - [x] SubTask 2.3: 保持首页统计、设置治理语义、页面表现与旧 `Rento` 业务逻辑一致；若运行路线无法完美切换，仅做最小技术适配

- [x] Task 3: 完成 renters / meter-readings / utility 的 query 与 bridge cutover。
  - [x] SubTask 3.1: 把 renters 域的页面主查询与写操作从 shared compat helper 切到统一 Hono 宿主或明确冻结的最终 compat 宿主
  - [x] SubTask 3.2: 把 meter-readings / utility 的主查询与兼容尾项从旧 Next / bridge 层切到统一 Hono 宿主或明确冻结的最终 compat 宿主
  - [x] SubTask 3.3: 保持历史抄表、关联账单追溯、utility 历史兼容尾项与租客主链语义不变；若运行路线无法完美切换，仅按旧 `Rento` 业务逻辑做最小适配

- [x] Task 4: 降级 shared compat helper 与旧 Next API，并同步 route inventory。
  - [x] SubTask 4.1: 将 `src/lib/page-closure-compat/dashboard.ts`、`renters.ts`、`meter-readings.ts` 降级为过渡、回滚或明确延后边界
  - [x] SubTask 4.2: 将旧 `src/app/api/dashboard*`、`settings*`、`renters*`、`meter-readings*`、`utility-readings` 对应主路径降级为 `compat-wrapper`、`rollback-only` 或明确退出候选
  - [x] SubTask 4.3: 更新 `server/lib/legacy-route-inventory.ts`，使分类结果与 wave-2 cutover 后的运行时真相一致

- [x] Task 5: 完成验证与验收材料。
  - [x] SubTask 5.1: 补一组覆盖首页、设置、租客、抄表与 utility 尾项的 smoke 或人工验证路径
  - [x] SubTask 5.2: 运行必要的 lint / type-check / 定向验证，确认没有引入新的错误
  - [x] SubTask 5.3: 准备独立审核所需的变更说明、运行路线适配说明、风险点与验证结论

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 4
